import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from '../models/message.model';
import { MessageContext } from '../interfaces/message-context.interface';
import { getDocs, collection, Firestore, query, where, orderBy, onSnapshot, QuerySnapshot, DocumentData, Unsubscribe, CollectionReference } from '@angular/fire/firestore';
import { handleDocChanges, handleDocChangesThread } from '../utils/message-cache.utils';
import { filterMessagesByContext, generateCacheKey, directQueryConditions } from '../utils/message-context.utils';

@Injectable({
  providedIn: 'root'
})

export class MessageCacheService {
  private messageCache = new Map<string, Message[]>();
  private messageSubject = new BehaviorSubject<Message[]>([]);
  private threadMessageSubject = new BehaviorSubject<Message[]>([]);
  private activeListeners = new Map<string, Unsubscribe>();
  private currentContextKey: string | null = null;
  public currentContextObj: MessageContext | null = null;
  private firestore = inject(Firestore);
  
  /**
   * Observable stream of all messages.
   * 
   * @returns Observable<Message[]> Emits all messages as an observable stream.
   */
  get messages$(): Observable<Message[]> {
    return this.messageSubject.asObservable();
  }

  /**
   * Observable stream of messages in the current thread.
   * 
   * @returns Observable<Message[]> Emits messages of the currently active thread.
   */
  get threadMessages$(): Observable<Message[]> {
    return this.threadMessageSubject.asObservable();
  }

  /**
   * Returns the current message context or null if none is set.
   * 
   * @returns MessageContext | null The current context or null if not set.
   */
  public getCurrentContext(): MessageContext | null {
    return this.currentContextObj;
  }

  /**
   * Returns the current cache key for the message context or null if none is set.
   * 
   * @returns string | null The current cache key or null if not set.
   */
  public getCurrentContextKey(): string | null {
    return this.currentContextKey;
  }

  /**
   * Initializes the message cache by loading all messages from Firestore, ordered by timestamp ascending.
   * 
   * @returns A promise that resolves when the cache has been initialized.
   */
  async initInitialMessageCache(): Promise<void> {
    const q = query(
      collection(this.firestore, 'messages'),
      orderBy('timestamp', 'asc'),
    );

    const snapshot = await getDocs(q);
    const allMessages = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Message[];

    this.messageCache.set('all', allMessages);
  }

  /**
   * Loads messages for the given context and user.
   * Updates the current context, cache, and ensures a listener is active for the context.
   * 
   * @param context The message context (channel or direct)
   * @param currentUserId The current user's ID
   * @param reason Optional reason for loading (for debugging)
   * @returns Promise resolved when loading is complete
   */
  async loadMessagesForContext(context: MessageContext, currentUserId: string, reason: string = 'unknown'): Promise<void> {
    const cacheKey = generateCacheKey(context, currentUserId);
    this.updateCurrentContext(cacheKey, context);
    this.updateCacheAndSubject(cacheKey, context, currentUserId);
    this.ensureListener(context, currentUserId, cacheKey);
  }

  /**
   * Updates the current message context and removes previous listener if necessary.
   * 
   * @param cacheKey Cache key for the current context
   * @param context The current message context
   */
  private updateCurrentContext(cacheKey: string, context: MessageContext): void {
    if (this.currentContextKey && this.currentContextKey !== cacheKey) {
      this.removeLiveListener(this.currentContextKey);
    }
    this.currentContextKey = cacheKey;
    this.currentContextObj = context;
  }

  /**
   * Filters cached messages based on the context and user,
   * updates the cache, and emits messages to subscribers.
   * 
   * @param cacheKey Cache key for the context
   * @param context The message context
   * @param currentUserId The current user's ID
   */
  private updateCacheAndSubject(cacheKey: string, context: MessageContext, currentUserId: string): void {
    const allMessages = this.messageCache.get('all') ?? [];
    const filtered = filterMessagesByContext(allMessages, context, currentUserId);
    this.messageCache.set(cacheKey, filtered);
    this.messageSubject.next([...filtered]);
  }

  /**
   * Ensures a live listener is registered for the current context.
   * 
   * @param context The message context
   * @param currentUserId The current user's ID
   * @param cacheKey Cache key for the context
   */
  private ensureListener(context: MessageContext, currentUserId: string, cacheKey: string): void {
    if (!this.activeListeners.has(cacheKey)) {
      this.registerLiveListener(cacheKey, () =>
        this.createContextListener(context, currentUserId, cacheKey));
    }
  }

  /**
   * Loads messages for a given thread, emits cached messages immediately,
   * manages live listeners, and loads messages from cache if necessary.
   *
   * @param threadId The ID of the thread to load messages for
   * @returns Promise that resolves when the loading and caching process completes
   */
  async loadMessagesForThread(threadId: string): Promise<void> {
    const cacheKey = `thread:${threadId}`;
    this.emitCachedThreadMessages(cacheKey);

    if (this.activeListeners.has(cacheKey)) {
      this.removeLiveListener(cacheKey);
    }

    this.registerLiveListener(cacheKey, () => this.createThreadListener(threadId, cacheKey));

    await this.loadAndCacheThreadMessagesIfNeeded(threadId, cacheKey);
  }

  /**
   * Emits cached thread messages to subscribers based on the provided cache key.
   *
   * @param cacheKey The cache key representing the thread messages
   */
  private emitCachedThreadMessages(cacheKey: string): void {
    const cached = this.messageCache.get(cacheKey) ?? [];
    this.threadMessageSubject.next([...cached]);
  }


  /**
   * Loads messages for a thread from the 'all' cache if they are not already cached,
   * caches the filtered messages, and emits them to subscribers.
   *
   * @param threadId The ID of the thread whose messages should be loaded
   * @param cacheKey The cache key associated with the thread
   * @returns Promise that resolves when loading and caching is complete
   */
  private async loadAndCacheThreadMessagesIfNeeded(threadId: string, cacheKey: string): Promise<void> {
    if (!this.messageCache.has(cacheKey)) {
      const allMessages = this.messageCache.get('all') ?? [];
      const filtered = allMessages.filter(msg => msg.threadId === threadId);
      this.messageCache.set(cacheKey, filtered);
      this.threadMessageSubject.next([...filtered]);
    }
  }

  /**
   * Registers a live listener for the given cache key if it does not already exist.
   * The listener is created by invoking the provided factory function.
   *
   * @param cacheKey The cache key for which the live listener should be registered
   * @param createUnsub A factory function that returns an unsubscribe function or Promise thereof
   */
  public registerLiveListener(cacheKey: string, createUnsub: () => (() => void | Promise<void>)): void {
    if (this.activeListeners.has(cacheKey)) {
      return;
    }
    try {
      const unsub = createUnsub();
      this.activeListeners.set(cacheKey, unsub);
    } catch (err) {
      console.error('[CacheService] Fehler bei registerLiveListener für key=', cacheKey, err);
    }
  }

  /**
   * Removes the live listener associated with the given cache key.
   * If no listener exists for the key, the method returns immediately.
   *
   * @param cacheKey The cache key identifying the listener to remove
   */
  public removeLiveListener(cacheKey: string): void {
    const unsub = this.activeListeners.get(cacheKey);
    if (!unsub) return;

    this.callUnsubAndCleanup(unsub, cacheKey);
  }

  /**
   * Calls the unsubscribe function and cleans up the activeListeners map.
   * Handles both synchronous and asynchronous unsubscribe functions,
   * logging errors if they occur during the process.
   *
   * @param unsub The unsubscribe function to call
   * @param cacheKey The cache key associated with the listener to clean up
   */
  private callUnsubAndCleanup(unsub: () => any, cacheKey: string): void {
    try {
      const result = unsub();
      Promise.resolve(result)
        .then(() => this.activeListeners.delete(cacheKey))
        .catch((err) => {
          console.error('[CacheService] Fehler beim Entfernen des LiveListeners für key=', cacheKey, err);
        });
    } catch (err) {
      console.error('[CacheService] SYNC Fehler bei unsub() für key=', cacheKey, err);
    }
  }

  /**
   * Creates a Firestore listener for messages in a given context.
   * Supports 'channel' and 'direct' message contexts.
   *
   * @param context The message context (channel or direct)
   * @param currentUserId The ID of the current user
   * @param cacheKey The cache key associated with this context
   * @returns An unsubscribe function to stop listening
   */
  private createContextListener(context: MessageContext, currentUserId: string, cacheKey: string): Unsubscribe {
    const col = collection(this.firestore, 'messages');
    const handle = (snap: QuerySnapshot<DocumentData>) => {
      handleDocChanges(snap, cacheKey, this.messageCache, this.activeListeners, this.currentContextKey, (msgs: Message[]) => this.messageSubject.next(msgs));
    };
    if (context.type === 'channel' && context.id) {
      return this.createChannelListener(col, context.id, handle);
    }
    if (context.type === 'direct' && context.receiverId) {
      return this.createDirectListeners(col, currentUserId, context.receiverId, handle);
    }
    return () => { };
  }

  /**
   * Creates a Firestore listener for a specific channel.
   *
   * @param col The Firestore collection reference
   * @param channelId The ID of the channel to listen to
   * @param handle The snapshot handler callback
   * @returns An unsubscribe function to stop listening
   */
  private createChannelListener(col: CollectionReference<DocumentData>, channelId: string, handle: (snap: QuerySnapshot<DocumentData>) => void): Unsubscribe {
    const q = query(col, where('channelId', '==', channelId), orderBy('timestamp', 'asc'));
    return onSnapshot(q, handle);
  }

  /**
   * Creates Firestore listeners for direct message queries between two users.
   *
   * @param col The Firestore collection reference
   * @param userA ID of the first user
   * @param userB ID of the second user
   * @param handle The snapshot handler callback
   * @returns A combined unsubscribe function to stop both listeners
   */
  private createDirectListeners(col: CollectionReference<DocumentData>, userA: string, userB: string, handle: (snap: QuerySnapshot<DocumentData>) => void): Unsubscribe {
    const q1 = query(col, ...directQueryConditions(userA, userB));
    const q2 = query(col, ...directQueryConditions(userB, userA));
    const unsub1 = onSnapshot(q1, handle);
    const unsub2 = onSnapshot(q2, handle);
    return () => { unsub1(); unsub2(); };
  }

  /**
   * Creates a Firestore listener for messages in a specific thread.
   *
   * @param threadId The ID of the thread to listen to
   * @param cacheKey The cache key associated with this thread
   * @returns An unsubscribe function to stop listening
   */
  private createThreadListener(threadId: string, cacheKey: string): Unsubscribe {
    const col = collection(this.firestore, 'messages');
    const q = query(col, where('threadId', '==', threadId), orderBy('timestamp', 'asc'));
    return onSnapshot(q, snap => handleDocChangesThread(snap,
      cacheKey,
      this.messageCache,
      (msgs: Message[]) => this.threadMessageSubject.next(msgs)));
  }

  /**
   * Updates the user name in the message cache and reloads affected messages.
   * 
   * @param userId The ID of the user whose name is updated
   * @param newName The new name to assign to the user
   */
  updateUserNameInCache(userId: string, newName: string): void {
    const allMessages = this.messageCache.get('all') || [];
    let updated = this.updateNamesInMessages(allMessages, userId, newName);
    if (!updated) {
      return;
    }

    this.messageCache.set('all', allMessages);
    this.reloadContextMessagesIfNeeded(userId);
    this.updateThreadMessages(userId, newName);
  }

  /**
   * Updates the name of the user in the given message array.
   * 
   * @param messages Array of messages to update
   * @param userId The user ID to match for updating names
   * @param newName The new name to assign
   * @returns True if any message was updated, false otherwise
   */
  private updateNamesInMessages(messages: Message[], userId: string, newName: string): boolean {
    let updated = false;
    messages.forEach(msg => {
      if (msg.userId === userId && msg.name !== newName) {
        msg.name = newName;
        updated = true;
      }
    });
    return updated;
  }

  /**
   * Reloads the messages for the current context if it exists.
   * 
   * @param userId The user ID to use when reloading messages
   */
  private reloadContextMessagesIfNeeded(userId: string): void {
    const ctx = this.currentContextObj;
    if (ctx && this.currentContextKey) {
      this.loadMessagesForContext(ctx, userId, 'from updateUserNameInCache');
    }
  }

  /**
   * Updates thread messages if the user name has changed.
   * 
   * @param userId The user ID whose name was changed
   * @param newName The new name to assign
   */
  private updateThreadMessages(userId: string, newName: string): void {
    const currentThreadMessages = this.threadMessageSubject.getValue();
    let threadChanged = this.updateNamesInMessages(currentThreadMessages, userId, newName);
    if (threadChanged) {
      this.threadMessageSubject.next([...currentThreadMessages]);
    }
  }

  /**
   * Clears the current message context and emits an empty message list.
   */
  clearCurrentContext(): void {
    this.currentContextKey = null;
    this.currentContextObj = null;
    this.messageSubject.next([]);
  }
}