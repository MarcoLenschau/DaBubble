import { Message } from '../models/message.model';
import { QuerySnapshot, DocumentData, Unsubscribe } from '@angular/fire/firestore';
import { detectRelevantChanges } from './messages.utils';
import { messageBelongsToContext, messageBelongsToThread } from './message-context.utils';


/**
 * Handles Firestore document changes for a specific context (channel or direct message).
 * Updates the global cache and the context-specific cache and triggers emission if active.
 *
 * @param snapshot Firestore query snapshot containing document changes.
 * @param cacheKey The cache key for the context.
 * @param messageCache The in-memory message cache (global + context).
 * @param activeListeners A map of active Firestore listeners (used to ignore stale snapshots).
 * @param currentContextKey The cache key of the currently active context.
 * @param emitToContext$ Function to emit messages to the UI if the current context is affected.
 */
export function handleDocChanges(snapshot: QuerySnapshot<DocumentData>, cacheKey: string, messageCache: Map<string, Message[]>, activeListeners: Map<string, Unsubscribe>, currentContextKey: string | null, emitToContext$: (messages: Message[]) => void): void {
    if (!activeListeners.has(cacheKey)) return;
    let global = messageCache.get('all') ?? [];
    let globalChanged = false;
    let currentContextMessages = messageCache.get(cacheKey) ?? [];
    let contextChanged = false;
    snapshot.docChanges().forEach(change => {
        const msg = mapDocToMessage(change.doc as any);
        globalChanged = processGlobalChanges(change, msg, global) || globalChanged;
        contextChanged = processContextChanges(change, msg, cacheKey, currentContextMessages) || contextChanged;
    });
    updateCacheIfChanged(messageCache, cacheKey, globalChanged, global, currentContextMessages, contextChanged, currentContextKey, emitToContext$);
}

/**
 * Updates the cache and emits messages if the context has changed.
 *
 * @param messageCache The global message cache.
 * @param cacheKey The cache key of the updated context.
 * @param globalChanged Whether the global message list was modified.
 * @param global The updated global message list.
 * @param currentContextMessages The updated messages of the current context.
 * @param contextChanged Whether the current context was modified.
 * @param currentContextKey The currently active context.
 * @param emitToContext$ Callback to emit messages to the active context.
 */
function updateCacheIfChanged(messageCache: Map<string, Message[]>, cacheKey: string, globalChanged: boolean, global: Message[], currentContextMessages: Message[], contextChanged: boolean, currentContextKey: string | null, emitToContext$: (messages: Message[]) => void): void {
    if (globalChanged) messageCache.set('all', global);
    if (contextChanged) {
        messageCache.set(cacheKey, currentContextMessages);
        if (cacheKey === currentContextKey) {
            emitToContext$([...currentContextMessages]);
        }
    }
}

/**
 * Applies global changes (added, modified, removed) to the shared message list.
 *
 * @param change The Firestore document change.
 * @param msg The message represented by the document.
 * @param global The shared global message list.
 * @returns True if the global list was modified.
 */
function processGlobalChanges(change: any, msg: Message, global: Message[]): boolean {
    const idxGlobal = global.findIndex(m => m.id === msg.id);
    if (change.type === 'added') {
        return handleAddedGlobal(idxGlobal, msg, global);
    } else if (change.type === 'modified' && idxGlobal !== -1) {
        return handleModifiedGlobal(idxGlobal, msg, global);
    } else if (change.type === 'removed' && idxGlobal !== -1) {
        return handleRemovedGlobal(idxGlobal, global);
    }
    return false;
}

function handleAddedGlobal(idxGlobal: number, msg: Message, global: Message[]): boolean {
    if (idxGlobal === -1) {
        global.push(msg);
        global.sort((a, b) => a.timestamp - b.timestamp);
        return true;
    }
    return false;
}

function handleModifiedGlobal(idxGlobal: number, msg: Message, global: Message[]): boolean {
    if (detectRelevantChanges(global[idxGlobal], msg)) {
        global[idxGlobal] = msg;
        return true;
    }
    return false;
}

function handleRemovedGlobal(idxGlobal: number, global: Message[]): boolean {
    global.splice(idxGlobal, 1);
    return true;
}

/**
 * Applies document changes to the context-specific message list based on cacheKey.
 *
 * @param change The Firestore document change.
 * @param msg The message represented by the document.
 * @param cacheKey The current context's cache key.
 * @param currentContextMessages The messages of the current context.
 * @returns True if the context message list was modified.
 */
function processContextChanges(change: any, msg: Message, cacheKey: string, currentContextMessages: Message[]): boolean {
    const belongs = messageBelongsToContext(msg, cacheKey);
    const idxCtx = currentContextMessages.findIndex(m => m.id === msg.id);
    if (change.type === 'added') {
        return handleAddedContext(belongs, idxCtx, msg, currentContextMessages);
    } else if (change.type === 'modified') {
        return handleModifiedContext(belongs, idxCtx, msg, currentContextMessages);
    } else if (change.type === 'removed') {
        return handleRemovedContext(idxCtx, currentContextMessages);
    }
    return false;
}

function handleAddedContext(
    belongs: boolean,
    idxCtx: number,
    msg: Message,
    currentContextMessages: Message[]
): boolean {
    if (belongs && idxCtx === -1) {
        currentContextMessages.push(msg);
        currentContextMessages.sort((a, b) => a.timestamp - b.timestamp);
        return true;
    }
    return false;
}

function handleModifiedContext(
    belongs: boolean,
    idxCtx: number,
    msg: Message,
    currentContextMessages: Message[]
): boolean {
    if (idxCtx !== -1) {
        return updateExistingMessage(belongs, idxCtx, msg, currentContextMessages);
    } else {
        return addNewMessageIfBelongs(belongs, msg, currentContextMessages);
    }
}

/**
 * Updates or removes an existing message in the current context based on membership.
 *
 * @param belongs Whether the message still belongs to the current context.
 * @param idxCtx Index of the message in the context array.
 * @param msg The updated message.
 * @param currentContextMessages The list of messages in the current context.
 * @returns True if a change was applied.
 */
function updateExistingMessage(belongs: boolean, idxCtx: number, msg: Message, currentContextMessages: Message[]): boolean {
    if (detectRelevantChanges(currentContextMessages[idxCtx], msg)) {
        if (belongs) {
            currentContextMessages[idxCtx] = msg;
        } else {
            currentContextMessages.splice(idxCtx, 1);
        }
        return true;
    }
    return false;
}

function addNewMessageIfBelongs(
    belongs: boolean,
    msg: Message,
    currentContextMessages: Message[]
): boolean {
    if (belongs) {
        currentContextMessages.push(msg);
        currentContextMessages.sort((a, b) => a.timestamp - b.timestamp);
        return true;
    }
    return false;
}

function handleRemovedContext(
    idxCtx: number,
    currentContextMessages: Message[]
): boolean {
    if (idxCtx !== -1) {
        currentContextMessages.splice(idxCtx, 1);
        return true;
    }
    return false;
}

/**
 * Handles Firestore document changes for a thread (reply context).
 * Updates the global and thread-specific message caches and emits if changed.
 *
 * @param snapshot Firestore query snapshot containing document changes.
 * @param cacheKey The thread-specific cache key (format: `thread:<threadId>`).
 * @param messageCache The in-memory message cache.
 * @param emitToThread$ Function to emit updated thread messages to the UI.
 */
export function handleDocChangesThread(snapshot: QuerySnapshot<DocumentData>, cacheKey: string, messageCache: Map<string, Message[]>, emitToThread$: (messages: Message[]) => void): void {
    let global = messageCache.get('all') ?? [];
    let globalChanged = false;
    let threadMessages = messageCache.get(cacheKey) ?? [];
    let threadChanged = false;
    snapshot.docChanges().forEach(change => {
        const msg = mapDocToMessage(change.doc as any);
        globalChanged = processGlobalThreadChange(change, msg, global) || globalChanged;
        threadChanged = processThreadChange(change, msg, cacheKey, threadMessages) || threadChanged;
    });
    applyThreadUpdates(messageCache, cacheKey, globalChanged, threadChanged, global, threadMessages, emitToThread$);
}

/**
 * Updates the thread-specific cache and emits messages if necessary.
 *
 * @param messageCache The global message cache.
 * @param cacheKey The cache key for the thread.
 * @param globalChanged Whether the global message list was modified.
 * @param threadChanged Whether the thread message list was modified.
 * @param global The updated global message list.
 * @param threadMessages The updated list of messages in the thread.
 * @param emitToThread$ Callback to emit updated thread messages.
 */
function applyThreadUpdates(messageCache: Map<string, Message[]>, cacheKey: string, globalChanged: boolean, threadChanged: boolean, global: Message[], threadMessages: Message[], emitToThread$: (messages: Message[]) => void): void {
    if (globalChanged) messageCache.set('all', global);
    if (threadChanged) {
        messageCache.set(cacheKey, threadMessages);
        emitToThread$([...threadMessages]);
    }
}

/**
 * Applies global thread-specific changes (added, modified, removed) to the shared message list.
 *
 * @param change The Firestore document change.
 * @param msg The message represented by the document.
 * @param global The shared global message list.
 * @returns True if the global list was modified.
 */
function processGlobalThreadChange(change: any, msg: Message, global: Message[]): boolean {
    const idx = global.findIndex(m => m.id === msg.id);
    if (change.type === 'added') {
        return handleAddedGlobalThread(idx, msg, global);
    } else if (change.type === 'modified') {
        return handleModifiedGlobalThread(idx, msg, global);
    } else if (change.type === 'removed') {
        return handleRemovedGlobalThread(idx, global);
    }
    return false;
}

function handleAddedGlobalThread(idx: number, msg: Message, global: Message[]
): boolean {
    if (idx === -1) {
        global.push(msg);
        global.sort((a, b) => a.timestamp - b.timestamp);
        return true;
    }
    return false;
}

function handleModifiedGlobalThread(idx: number, msg: Message, global: Message[]): boolean {
    if (idx !== -1 && detectRelevantChanges(global[idx], msg)) {
        global[idx] = msg;
        return true;
    }
    return false;
}

function handleRemovedGlobalThread(idx: number, global: Message[]): boolean {
    if (idx !== -1) {
        global.splice(idx, 1);
        return true;
    }
    return false;
}

/**
 * Applies document changes to the message list of a specific thread.
 *
 * @param change The Firestore document change.
 * @param msg The message represented by the document.
 * @param cacheKey The thread cache key.
 * @param threadMessages The list of messages in the thread.
 * @returns True if the thread message list was modified.
 */
function processThreadChange(change: any, msg: Message, cacheKey: string, threadMessages: Message[]): boolean {
    const belongs = messageBelongsToThread(msg, cacheKey);
    const idx = threadMessages.findIndex(m => m.id === msg.id);
    if (change.type === 'added') {
        return handleAddedThread(belongs, idx, msg, threadMessages);
    } else if (change.type === 'modified') {
        return handleModifiedThread(belongs, idx, msg, threadMessages);
    } else if (change.type === 'removed') {
        return handleRemovedThread(idx, threadMessages);
    }
    return false;
}

function handleAddedThread(
    belongs: boolean,
    idx: number,
    msg: Message,
    threadMessages: Message[]
): boolean {
    if (belongs && idx === -1) {
        threadMessages.push(msg);
        threadMessages.sort((a, b) => a.timestamp - b.timestamp);
        return true;
    }
    return false;
}

function handleModifiedThread(
    belongs: boolean,
    idx: number,
    msg: Message,
    threadMessages: Message[]
): boolean {
    if (idx !== -1 && detectRelevantChanges(threadMessages[idx], msg)) {
        return updateOrRemoveThreadMessage(belongs, idx, msg, threadMessages);
    }
    return addThreadMessageIfNew(belongs, idx, msg, threadMessages);
}

/**
 * Updates or removes an existing message in a thread based on membership.
 *
 * @param belongs Whether the message still belongs to the thread.
 * @param idx Index of the message in the thread array.
 * @param msg The updated message.
 * @param threadMessages The list of messages in the thread.
 * @returns Always true if a change occurred.
 */
function updateOrRemoveThreadMessage(belongs: boolean, idx: number, msg: Message, threadMessages: Message[]): boolean {
    if (belongs) {
        threadMessages[idx] = msg;
    } else {
        threadMessages.splice(idx, 1);
    }
    return true;
}

function addThreadMessageIfNew(
    belongs: boolean,
    idx: number,
    msg: Message,
    threadMessages: Message[]
): boolean {
    if (belongs && idx === -1) {
        threadMessages.push(msg);
        threadMessages.sort((a, b) => a.timestamp - b.timestamp);
        return true;
    }
    return false;
}

function handleRemovedThread(
    idx: number,
    threadMessages: Message[]
): boolean {
    if (idx !== -1) {
        threadMessages.splice(idx, 1);
        return true;
    }
    return false;
}

/**
 * Converts a Firestore document into a strongly typed `Message` instance.
 *
 * @param doc The Firestore document.
 * @returns A new `Message` instance with parsed data and fallback defaults.
 */
export function mapDocToMessage(doc: any): Message {
    const data = doc.data() as any;
    return new Message({
        audio: data.audio ?? '',
        id: doc.id,
        name: data.name,
        text: data.text,
        timestamp: data.timestamp ?? Date.now(),
        userId: data.userId,
        receiverId: data.receiverId ?? '',
        isDirectMessage: data.isDirectMessage ?? false,
        channelId: data.channelId ?? '',
        threadId: data.threadId ?? '',
        reactions: data.reactions ?? [],
        lastReplyTimestamp: data.lastReplyTimestamp,
        replies: data.replies ?? 0,
    });
}
