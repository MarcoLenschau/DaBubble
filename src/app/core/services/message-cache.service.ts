import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from '../models/message.model';
import { MessageContext } from '../interfaces/message-context.interface';
import {
  getDocs,
  collection,
  Firestore,
  query,
  where,
  orderBy,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Unsubscribe
} from '@angular/fire/firestore';
import { detectRelevantChanges, } from '../utils/messages.utils';
import {
  filterMessagesByContext, messageBelongsToContext, mapDocToMessage, generateCacheKey, directQueryConditions, messageBelongsToThread,
} from '../utils/message-cache.utils';

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

  constructor(private firestore: Firestore) { }

  get messages$(): Observable<Message[]> {
    return this.messageSubject.asObservable();
  }

  get threadMessages$(): Observable<Message[]> {
    return this.threadMessageSubject.asObservable();
  }

  public getCurrentContext(): MessageContext | null {
    return this.currentContextObj;
  }

  public getCurrentContextKey(): string | null {
    return this.currentContextKey;
  }

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

  async loadMessagesForContext(context: MessageContext, currentUserId: string, reason: string = 'unknown'): Promise<void> {
    const cacheKey = generateCacheKey(context, currentUserId);

    if (this.currentContextKey && this.currentContextKey !== cacheKey) {
      this.removeLiveListener(this.currentContextKey);
    }

    this.currentContextKey = cacheKey;
    this.currentContextObj = context;

    const allMessages = this.messageCache.get('all') ?? [];

    const filtered = filterMessagesByContext(allMessages, context, currentUserId);
    this.messageCache.set(cacheKey, filtered);
    this.messageSubject.next([...filtered]);

    if (!this.activeListeners.has(cacheKey)) {
      this.registerLiveListener(cacheKey, () =>
        this.createContextListener(context, currentUserId, cacheKey)
      );
    }
  }


  async loadMessagesForThread(threadId: string): Promise<void> {
    const cacheKey = `thread:${threadId}`;
    console.log('[Thread] START loading for:', cacheKey);
    const cached = this.messageCache.get(cacheKey) ?? [];
    this.threadMessageSubject.next([...cached]);

    // this.removeLiveListener(cacheKey);
    // this.registerLiveListener(cacheKey, () =>
    //   this.createThreadListener(threadId, cacheKey)
    // );

    // console.log('[Thread] Removing existing listener for', cacheKey);
    // this.removeLiveListener(cacheKey);

    // console.log('[Thread] Registering new listener for', cacheKey);
    // this.registerLiveListener(cacheKey, () =>
    //   this.createThreadListener(threadId, cacheKey)
    // );

    // this.registerLiveListener(cacheKey, () => {
    //   console.log('[Thread] Removing existing listener for:', cacheKey);
    //   this.removeLiveListener(cacheKey);

    //   console.log('[Thread] Registering new listener for:', cacheKey);
    //   return this.createThreadListener(threadId, cacheKey);
    // });

    if (this.activeListeners.has(cacheKey)) {
      console.log('[Thread] Removing existing listener for:', cacheKey);
      this.removeLiveListener(cacheKey);
    }

    console.log('[Thread] Registering new listener for:', cacheKey);
    this.registerLiveListener(cacheKey, () => {
      console.log('[createThreadListener] Creating listener for', cacheKey);
      return this.createThreadListener(threadId, cacheKey);
    });

    if (!this.messageCache.has(cacheKey)) {
      console.log('[Thread] No cached messages found, filtering...');
      const allMessages = this.messageCache.get('all') ?? [];
      const filtered = allMessages.filter(msg => msg.threadId === threadId);
      this.messageCache.set(cacheKey, filtered);
      this.threadMessageSubject.next([...filtered]);
      console.log('[Thread] Filtered and cached messages for:', cacheKey);
    } else {
      console.log('[Thread] Messages already cached for:', cacheKey);
    }
    console.log('[Thread] END loading for:', cacheKey);
  }

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

  public removeLiveListener(cacheKey: string): void {
    console.log('[removeLiveListener] for', cacheKey);
    const unsub = this.activeListeners.get(cacheKey);

    if (!unsub) {
      return;
    }

    try {
      const result = unsub();
      Promise.resolve(result)
        .then(() => {
          this.activeListeners.delete(cacheKey);
        })
        .catch((err) => {
          console.error('[CacheService] Fehler beim Entfernen des LiveListeners für key=', cacheKey, err);
        });
    } catch (err) {
      console.error('[CacheService] SYNC Fehler bei unsub() für key=', cacheKey, err);
    }
  }


  private createContextListener(
    context: MessageContext,
    currentUserId: string,
    cacheKey: string
  ): Unsubscribe {
    const col = collection(this.firestore, 'messages');

    if (context.type === 'channel') {
      const q = query(col, where('channelId', '==', context.id), orderBy('timestamp', 'asc'));
      return onSnapshot(q, snap => this.handleDocChanges(snap, cacheKey));
    }

    if (context.type === 'direct' && context.receiverId) {
      const q1 = query(col, ...directQueryConditions(currentUserId, context.receiverId));
      const q2 = query(col, ...directQueryConditions(context.receiverId, currentUserId));

      const unsub1 = onSnapshot(q1, snap => this.handleDocChanges(snap, cacheKey));
      const unsub2 = onSnapshot(q2, snap => this.handleDocChanges(snap, cacheKey));
      return () => { unsub1(); unsub2(); };
    }

    return () => { };
  }

  private createThreadListener(threadId: string, cacheKey: string): Unsubscribe {
    console.log('[createThreadListener] Creating listener for', cacheKey);
    const col = collection(this.firestore, 'messages');
    const q = query(col, where('threadId', '==', threadId), orderBy('timestamp', 'asc'));
    return onSnapshot(q, snap => this.handleDocChangesThread(snap, cacheKey));
  }

  //   handleDocChanges(snapshot, cacheKey, this.messageCache, this.activeListeners, this.currentContextKey, (msgs) => this.messageSubject.next(msgs));
  // handleDocChangesThread(snapshot, cacheKey, this.messageCache, (msgs) => this.threadMessageSubject.next(msgs));


  private handleDocChanges(snapshot: QuerySnapshot<DocumentData>, cacheKey: string): void {
    if (!this.activeListeners.has(cacheKey)) {
      return;
    }

    let global = this.messageCache.get('all') ?? [];
    let globalChanged = false;

    const currentContextMessages = this.messageCache.get(cacheKey) ?? [];
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
      this.messageCache.set('all', global);
    }
    if (contextChanged) {
      this.messageCache.set(cacheKey, currentContextMessages);

      if (cacheKey === this.currentContextKey) {
        this.messageSubject.next([...currentContextMessages]);
      }
    }
  }

  private handleDocChangesThread(snapshot: QuerySnapshot<DocumentData>, cacheKey: string): void {
    console.log('[handleDocChangesThread] Snapshot received for:', cacheKey);
    let global = this.messageCache.get('all') ?? [];
    let globalChanged = false;

    const threadMessages = this.messageCache.get(cacheKey) ?? [];
    let threadChanged = false;

    snapshot.docChanges().forEach(change => {
      console.log(`[Thread:${cacheKey}]`, change.type, change.doc.id);
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
      this.messageCache.set('all', global);
    }

    if (threadChanged) {
      this.messageCache.set(cacheKey, threadMessages);
      this.threadMessageSubject.next([...threadMessages]);
    }
  }

  updateUserNameInCache(userId: string, newName: string): void {
    const allMessages = this.messageCache.get('all') || [];
    let updated = false;

    allMessages.forEach(msg => {
      if (msg.userId === userId && msg.name !== newName) {
        msg.name = newName;
        updated = true;
      }
    });
    if (!updated) {
      return;
    }
    this.messageCache.set('all', allMessages);

    this.messageCache.set('all', allMessages);

    const ctx = this.currentContextObj;
    if (ctx && this.currentContextKey) {

      this.loadMessagesForContext(ctx, userId, 'from updateUserNameInCache');
    }

    const currentThreadMessages = this.threadMessageSubject.getValue();
    let threadChanged = false;
    currentThreadMessages.forEach(msg => {
      if (msg.userId === userId && msg.name !== newName) {
        msg.name = newName;
        threadChanged = true;
      }
    });

    if (threadChanged) {
      this.threadMessageSubject.next([...currentThreadMessages]);
    }
  }

  clearCurrentContext(): void {
    this.currentContextKey = null;
    this.currentContextObj = null;
    this.messageSubject.next([]);
  }
}