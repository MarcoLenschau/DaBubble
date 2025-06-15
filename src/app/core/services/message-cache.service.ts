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
  QueryDocumentSnapshot,
  DocumentData,
  Unsubscribe
} from '@angular/fire/firestore';

import { detectRelevantChanges, } from '../utils/messages-utils';

@Injectable({
  providedIn: 'root'
})

export class MessageCacheService {
  private messageCache = new Map<string, Message[]>();
  private messageSubject = new BehaviorSubject<Message[]>([]);
  private unsubscribeFn: Unsubscribe | null = null;

  constructor(private firestore: Firestore) { }

  get messages$(): Observable<Message[]> {
    return this.messageSubject.asObservable();
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

  generateCacheKey(context: MessageContext, currentUserId?: string): string {
    if (context.type === 'channel') {
      return `channel:${context.id}`;
    } else {
      const ids = [currentUserId || '', context.receiverId || ''].sort();
      return `direct:${ids[0]}-${ids[1]}`;
    }
  }

  async loadMessagesForContext(context: MessageContext, currentUserId: string): Promise<void> {
    const cacheKey = this.generateCacheKey(context, currentUserId);

    if (this.messageCache.has(cacheKey)) {
      this.messageSubject.next([...this.messageCache.get(cacheKey)!]);
      return;
    }

    const allMessages = this.messageCache.get('all') ?? [];
    const filtered = this.filterMessagesByContext(allMessages, context, currentUserId);
    this.messageCache.set(cacheKey, filtered);
    this.messageSubject.next([...filtered]);

    this.clearActiveSubscription();
    this.startLiveListener(context, currentUserId, cacheKey);
  }

  private clearActiveSubscription(): void {
    if (this.unsubscribeFn) {
      this.unsubscribeFn();
      this.unsubscribeFn = null;
    }
  }

  private startLiveListener(context: MessageContext, currentUserId: string, cacheKey: string) {
    const col = collection(this.firestore, 'messages');

    if (context.type === 'channel') {
      const q = query(col, where('channelId', '==', context.id), orderBy('timestamp', 'asc'));
      const unsub = onSnapshot(q, snap => this.handleDocChanges(snap, cacheKey));
      this.unsubscribeFn = unsub;
    }

    else if (context.type === 'direct' && context.receiverId) {
      const q1 = query(col, ...this.directQueryConditions(currentUserId, context.receiverId));
      const q2 = query(col, ...this.directQueryConditions(context.receiverId, currentUserId));

      const unsub1 = onSnapshot(q1, snap => this.handleDocChanges(snap, cacheKey));
      const unsub2 = onSnapshot(q2, snap => this.handleDocChanges(snap, cacheKey));
      this.unsubscribeFn = () => { unsub1(); unsub2(); };
    }
  }

  private handleDocChanges(snapshot: QuerySnapshot<DocumentData>, cacheKey: string): void {
    let global = this.messageCache.get('all') ?? [];
    let globalChanged = false;

    const currentContextMessages = this.messageCache.get(cacheKey) ?? [];
    let contextChanged = false;

    snapshot.docChanges().forEach(change => {
      const msg = this.mapDocToMessage(change.doc as any);
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

      const belongs = this.messageBelongsToContext(msg, cacheKey);
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

  private messageBelongsToContext(msg: Message, cacheKey: string): boolean {
    if (cacheKey.startsWith('channel:')) {
      const channelId = cacheKey.split(':')[1];
      return msg.channelId === channelId;
    }
    if (cacheKey.startsWith('direct:')) {
      const ids = cacheKey.substring('direct:'.length).split('-');
      if (!msg.isDirectMessage) return false;
      return ((msg.userId === ids[0] && msg.receiverId === ids[1]) ||
        (msg.userId === ids[1] && msg.receiverId === ids[0]));
    }
    return false;
  }


  private filterMessagesByContext(messages: Message[], context: MessageContext, currentUserId: string): Message[] {
    if (context.type === 'channel') {
      return messages.filter(m => m.channelId === context.id);
    }
    if (context.type === 'direct') {
      if (!context.receiverId) return [];
      return messages.filter(m =>
        m.isDirectMessage &&
        ((m.userId === currentUserId && m.receiverId === context.receiverId) ||
          (m.userId === context.receiverId && m.receiverId === currentUserId))
      );
    }
    return [];
  }

  private directQueryConditions(userA: string, userB: string) {
    return [
      where('isDirectMessage', '==', true),
      where('userId', '==', userA),
      where('receiverId', '==', userB),
      orderBy('timestamp', 'asc')
    ];
  }

  private mapDocToMessage(doc: QueryDocumentSnapshot<DocumentData>): Message {
    const data = doc.data() as any;
    return new Message({
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

  private mapToMessages(docs: any[]): Message[] {
    return docs.map(doc => new Message({
      id: doc.id,
      name: doc.name,
      text: doc.text,
      timestamp: doc.timestamp ?? Date.now(),
      userId: doc.userId,
      receiverId: doc.receiverId ?? '',
      isDirectMessage: doc.isDirectMessage ?? false,
      channelId: doc.channelId ?? '',
      threadId: doc.threadId ?? '',
      reactions: doc.reactions ?? [],
      lastReplyTimestamp: doc.lastReplyTimestamp,
      replies: doc.replies ?? 0,
    }));
  }
}