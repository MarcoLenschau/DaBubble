import { Message } from '../models/message.model';
import { MessageContext } from '../interfaces/message-context.interface';
import { where, orderBy, QuerySnapshot, DocumentData, Unsubscribe } from '@angular/fire/firestore';
import { detectRelevantChanges } from './messages.utils';

export function messageBelongsToThread(msg: Message, cacheKey: string): boolean {
    const threadId = cacheKey.split(':')[1];
    return msg.threadId === threadId;
}

export function generateCacheKey(context: MessageContext, currentUserId?: string): string {
    if (context.type === 'channel') {
        return `channel:${context.id}`;
    } else {
        const a = currentUserId || '';
        const b = context.receiverId || '';
        return `direct:${[a, b].sort().join('-')}`;
    }
}

export function messageBelongsToContext(msg: Message, cacheKey: string): boolean {
    if (cacheKey.startsWith('channel:')) {
        const channelId = cacheKey.split(':')[1];
        return msg.channelId === channelId;
    }

    if (cacheKey.startsWith('direct:')) {
        const ids = cacheKey.substring('direct:'.length).split('-');
        if (!msg.isDirectMessage) return false;

        if (ids[0] === ids[1]) {
            return msg.userId === ids[0] && msg.receiverId === ids[0];
        }

        return (
            (msg.userId === ids[0] && msg.receiverId === ids[1]) ||
            (msg.userId === ids[1] && msg.receiverId === ids[0])
        );
    }

    return false;
}

export function filterMessagesByContext(
    messages: Message[],
    context: MessageContext,
    currentUserId: string
): Message[] {
    if (context.type === 'channel') {
        return messages.filter(m => m.channelId === context.id);
    }

    if (context.type === 'direct' && context.receiverId) {
        return messages.filter(m =>
            m.isDirectMessage &&
            ((m.userId === currentUserId && m.receiverId === context.receiverId) ||
                (m.userId === context.receiverId && m.receiverId === currentUserId))
        );
    }

    return [];
}

export function directQueryConditions(userA: string, userB: string) {
    return [
        where('isDirectMessage', '==', true),
        where('userId', '==', userA),
        where('receiverId', '==', userB),
        orderBy('timestamp', 'asc')
    ];
}

export function extractContextFromKey(key: string): MessageContext {
    if (key.startsWith('channel:')) {
        return { type: 'channel', id: key.split(':')[1] };
    }
    if (key.startsWith('direct:')) {
        const ids = key.split(':')[1].split('-');
        return { type: 'direct', id: '', receiverId: ids[1] };
    }
    return { type: 'channel', id: '' };
}

export function handleDocChanges(
    snapshot: QuerySnapshot<DocumentData>,
    cacheKey: string,
    messageCache: Map<string, Message[]>,
    activeListeners: Map<string, Unsubscribe>,
    currentContextKey: string | null,
    emitToContext$: (messages: Message[]) => void
): void {
    if (!activeListeners.has(cacheKey)) {
        return;
    }
    let global = messageCache.get('all') ?? [];
    let globalChanged = false;

    const currentContextMessages = messageCache.get(cacheKey) ?? [];
    let contextChanged = false;

    snapshot.docChanges().forEach(change => {
        const msg = mapDocToMessage(change.doc as any);

        const idxGlobal = global.findIndex(m => m.id === msg.id);
        if (change.type === 'added') {
            if (idxGlobal === -1) {
                global.push(msg);
                global.sort((a, b) => a.timestamp - b.timestamp);
                globalChanged = true;
            }
        } else if (change.type === 'modified' && idxGlobal !== -1) {
            if (detectRelevantChanges(global[idxGlobal], msg)) {
                global[idxGlobal] = msg;
                globalChanged = true;
            }
        } else if (change.type === 'removed' && idxGlobal !== -1) {
            global.splice(idxGlobal, 1);
            globalChanged = true;
        }

        const belongs = messageBelongsToContext(msg, cacheKey);
        const idxCtx = currentContextMessages.findIndex(m => m.id === msg.id);
        if (change.type === 'added') {
            if (belongs && idxCtx === -1) {
                currentContextMessages.push(msg);
                currentContextMessages.sort((a, b) => a.timestamp - b.timestamp);
                contextChanged = true;
            }
        } else if (change.type === 'modified') {
            if (idxCtx !== -1) {
                if (detectRelevantChanges(currentContextMessages[idxCtx], msg)) {
                    if (belongs) {
                        currentContextMessages[idxCtx] = msg;
                    } else {
                        currentContextMessages.splice(idxCtx, 1);
                    }
                    contextChanged = true;
                }
            } else {
                if (belongs) {
                    currentContextMessages.push(msg);
                    currentContextMessages.sort((a, b) => a.timestamp - b.timestamp);
                    contextChanged = true;
                }
            }
        } else if (change.type === 'removed') {
            if (idxCtx !== -1) {
                currentContextMessages.splice(idxCtx, 1);
                contextChanged = true;
            }
        }
    });

    if (globalChanged) {
        messageCache.set('all', global);
    }
    if (contextChanged) {
        messageCache.set(cacheKey, currentContextMessages);

        if (cacheKey === currentContextKey) {
            emitToContext$([...currentContextMessages]);
        }
    }
}

export function handleDocChangesThread(
    snapshot: QuerySnapshot<DocumentData>,
    cacheKey: string,
    messageCache: Map<string, Message[]>,
    emitToThread$: (messages: Message[]) => void
): void {
    let global = messageCache.get('all') ?? [];
    let globalChanged = false;

    const threadMessages = messageCache.get(cacheKey) ?? [];
    let threadChanged = false;

    snapshot.docChanges().forEach(change => {
        const msg = mapDocToMessage(change.doc as any);
        const idxGlobal = global.findIndex(m => m.id === msg.id);

        if (change.type === 'added' && idxGlobal === -1) {
            global.push(msg);
            global.sort((a, b) => a.timestamp - b.timestamp);
            globalChanged = true;
        } else if (change.type === 'modified' && idxGlobal !== -1) {
            if (detectRelevantChanges(global[idxGlobal], msg)) {
                global[idxGlobal] = msg;
                globalChanged = true;
            }
        } else if (change.type === 'removed' && idxGlobal !== -1) {
            global.splice(idxGlobal, 1);
            globalChanged = true;
        }

        const belongs = messageBelongsToThread(msg, cacheKey);
        const idxThread = threadMessages.findIndex(m => m.id === msg.id);

        if (change.type === 'added' && belongs && idxThread === -1) {
            threadMessages.push(msg);
            threadMessages.sort((a, b) => a.timestamp - b.timestamp);
            threadChanged = true;
        } else if (change.type === 'modified') {
            if (idxThread !== -1) {
                if (detectRelevantChanges(threadMessages[idxThread], msg)) {
                    if (belongs) {
                        threadMessages[idxThread] = msg;
                    } else {
                        threadMessages.splice(idxThread, 1);
                    }
                    threadChanged = true;
                }
            } else if (belongs) {
                threadMessages.push(msg);
                threadMessages.sort((a, b) => a.timestamp - b.timestamp);
                threadChanged = true;
            }
        } else if (change.type === 'removed' && idxThread !== -1) {
            threadMessages.splice(idxThread, 1);
            threadChanged = true;
        }
    });

    if (globalChanged) {
        messageCache.set('all', global);
    }

    if (threadChanged) {
        messageCache.set(cacheKey, threadMessages);
        emitToThread$([...threadMessages]);
    }
}


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
