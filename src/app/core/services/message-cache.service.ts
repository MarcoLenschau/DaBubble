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
import { detectRelevantChanges, } from '../utils/messages-utils';
import {
  filterMessagesByContext, messageBelongsToContext, mapDocToMessage, generateCacheKey, directQueryConditions, messageBelongsToThread,
} from '../utils/message-cache-utils';

@Injectable({
  providedIn: 'root'
})

export class MessageCacheService {
  private messageCache = new Map<string, Message[]>();
  private messageSubject = new BehaviorSubject<Message[]>([]);
  private threadMessageSubject = new BehaviorSubject<Message[]>([]);
  private activeListeners = new Map<string, Unsubscribe>();

  constructor(private firestore: Firestore) { }

  get messages$(): Observable<Message[]> {
    return this.messageSubject.asObservable();
  }

  get threadMessages$(): Observable<Message[]> {
    return this.threadMessageSubject.asObservable();
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

  async loadMessagesForContext(context: MessageContext, currentUserId: string): Promise<void> {
    const cacheKey = generateCacheKey(context, currentUserId);

    if (this.messageCache.has(cacheKey)) {
      this.messageSubject.next([...this.messageCache.get(cacheKey)!]);
      return;
    }

    const allMessages = this.messageCache.get('all') ?? [];
    const filtered = filterMessagesByContext(allMessages, context, currentUserId);
    this.messageCache.set(cacheKey, filtered);
    this.messageSubject.next([...filtered]);

    await this.removeLiveListener(cacheKey);
    this.registerLiveListener(cacheKey, () => this.createContextListener(context, currentUserId, cacheKey));
  }

  async loadMessagesForThread(threadId: string): Promise<void> {
    const cacheKey = `thread:${threadId}`;

    if (this.messageCache.has(cacheKey)) {
      this.threadMessageSubject.next([...this.messageCache.get(cacheKey)!]);
      return;
    }

    const allMessages = this.messageCache.get('all') ?? [];
    const filtered = allMessages.filter(msg => msg.threadId === threadId);
    this.messageCache.set(cacheKey, filtered);
    this.threadMessageSubject.next([...filtered]);

    await this.removeLiveListener(cacheKey);
    this.registerLiveListener(cacheKey, () => this.createThreadListener(threadId, cacheKey));
  }

  private registerLiveListener(
    cacheKey: string,
    setupFn: () => Unsubscribe
  ): void {
    if (this.activeListeners.has(cacheKey)) {
      return;
    }

    const unsubscribe = setupFn();
    this.activeListeners.set(cacheKey, unsubscribe);
  }

  public async removeLiveListener(cacheKey: string): Promise<void> {
    const unsub = this.activeListeners.get(cacheKey);
    if (unsub) {
      unsub();
      this.activeListeners.delete(cacheKey);
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
    const col = collection(this.firestore, 'messages');
    const q = query(col, where('threadId', '==', threadId), orderBy('timestamp', 'asc'));
    return onSnapshot(q, snap => this.handleDocChangesThread(snap, cacheKey));
  }

  private handleDocChanges(snapshot: QuerySnapshot<DocumentData>, cacheKey: string): void {
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
      this.messageSubject.next([...currentContextMessages]);
    }
  }

  private handleDocChangesThread(snapshot: QuerySnapshot<DocumentData>, cacheKey: string): void {
    let global = this.messageCache.get('all') ?? [];
    let globalChanged = false;

    const threadMessages = this.messageCache.get(cacheKey) ?? [];
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
    if (!updated) return;

    this.messageCache.set('all', allMessages);

    const currentMessages = this.messageSubject.getValue();
    let visibleChanged = false;
    currentMessages.forEach(msg => {
      if (msg.userId === userId && msg.name !== newName) {
        msg.name = newName;
        visibleChanged = true;
      }
    });

    if (visibleChanged) {
      // this.messageCache.set(this.currentContextCacheKey, currentMessages); // optional
      this.messageSubject.next([...currentMessages]);
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

}