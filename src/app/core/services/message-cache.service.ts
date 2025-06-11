import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from '../models/message.model';
import { MessageContext } from '../interfaces/message-context.interface';
import { Reaction } from '../interfaces/reaction.interface';
import {
  getDocs,
  collection,
  Firestore,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  QuerySnapshot,
  QueryDocumentSnapshot,
  DocumentData,
  Unsubscribe
} from '@angular/fire/firestore';


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
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Message[];

    this.messageCache.set('initial', messages.reverse());
  }

  generateCacheKey(context: MessageContext): string {
    return `${context.type}:${context.id ?? ''}:${context.receiverId ?? ''}`;
  }

  async loadMessagesForContext(context: MessageContext, currentUserId: string): Promise<void> {
    const cacheKey = this.generateCacheKey(context);

    if (this.messageCache.has(cacheKey)) {
      this.messageSubject.next([...this.messageCache.get(cacheKey)!]);
      return;
    }

    const initial = this.getInitialMessages(context, currentUserId);
    this.messageSubject.next(initial);

    this.clearActiveSubscription();
    this.startLiveListener(context, currentUserId, cacheKey);

    const fullSet = await this.fetchFullMessageSet(context, currentUserId);
    this.messageCache.set(cacheKey, fullSet);
    this.messageSubject.next([...fullSet]);
  }

  private getInitialMessages(context: MessageContext, currentUserId: string): Message[] {
    const cachedInitial = this.messageCache.get('initial') ?? [];
    return this.filterMessagesByContext(cachedInitial, context, currentUserId);
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
    const current = this.messageCache.get(cacheKey) ?? [];
    let changed = false;

    snapshot.docChanges().forEach(change => {
      const msg = this.mapDocToMessage(change.doc as any);
      const idx = current.findIndex(m => m.id === msg.id);

      if (change.type === 'added') {
        if (idx === -1) {
          current.push(msg);
          changed = true;
        }
      } else if (change.type === 'modified' && idx !== -1) {
        if (this.detectRelevantChanges(current[idx], msg)) {
          current[idx] = msg;
          changed = true;
        }
      } else if (change.type === 'removed' && idx !== -1) {
        current.splice(idx, 1);
        changed = true;
      }
    });

    if (changed) {
      current.sort((a, b) => a.timestamp - b.timestamp);
      this.messageCache.set(cacheKey, current);
      this.messageSubject.next([...current]);
    }
  }

  private filterMessagesByContext(messages: Message[], context: MessageContext, currentUserId: string): Message[] {
    if (context.type === 'channel') {
      if (!context.id) {
        console.warn('[MessageCacheService] Channel-Kontext ohne ID.');
        return [];
      }
      return messages.filter(m => m.channelId === context.id);
    }
    if (context.type === 'direct') {
      if (!context.receiverId) return [];
      if (context.receiverId === currentUserId) {
        return messages.filter(m =>
          m.channelId === '' &&
          m.userId === currentUserId &&
          m.receiverId === currentUserId
        );
      } else {
        return messages.filter(m =>
          m.isDirectMessage &&
          ((m.userId === currentUserId && m.receiverId === context.receiverId) ||
            (m.userId === context.receiverId && m.receiverId === currentUserId))
        );
      }
    }
    return [];
  }

  private async fetchFullMessageSet(context: MessageContext, currentUserId: string): Promise<Message[]> {
    if (context.type === 'channel') {
      const q = query(
        collection(this.firestore, 'messages'),
        where('channelId', '==', context.id),
        orderBy('timestamp', 'asc')
      );
      const snap = await getDocs(q);
      return this.mapToMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));

    }

    if (context.type === 'direct') {
      if (!context.receiverId) {
        return [];
      }
      if (context.receiverId === currentUserId) {
        const q = query(
          collection(this.firestore, 'messages'),
          where('channelId', '==', ''),
          where('userId', '==', currentUserId),
          where('receiverId', '==', currentUserId),
          orderBy('timestamp', 'asc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Message[];
      }

      const [snap1, snap2] = await Promise.all([
        getDocs(query(collection(this.firestore, 'messages'), ...this.directQueryConditions(currentUserId, context.receiverId))),
        getDocs(query(collection(this.firestore, 'messages'), ...this.directQueryConditions(context.receiverId, currentUserId))),
      ]);

      const all = [...snap1.docs, ...snap2.docs].map(d => ({ id: d.id, ...d.data() })) as Message[];
      return all.sort((a, b) => a.timestamp - b.timestamp);
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

  private detectRelevantChanges(oldMsg: Message, newMsg: Message): boolean {
    if (oldMsg.name !== newMsg.name) return true;
    if (oldMsg.text !== newMsg.text) return true;
    if (oldMsg.threadId !== newMsg.threadId) return true;
    if (oldMsg.replies !== newMsg.replies) return true;
    if (oldMsg.lastReplyTimestamp !== newMsg.lastReplyTimestamp) return true;
    if (!this.areReactionsEqual(oldMsg.reactions, newMsg.reactions)) return true;
    return false;
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

  private areReactionsEqual(a: Reaction[], b: Reaction[]): boolean {
    if ((a?.length ?? 0) !== (b?.length ?? 0)) return false;

    const copyA = a.map(r => ({
      emojiName: r.emojiName,
      userIds: [...r.userIds].sort(),
    }));
    const copyB = b.map(r => ({
      emojiName: r.emojiName,
      userIds: [...r.userIds].sort(),
    }));

    copyA.sort((r1, r2) => r1.emojiName.localeCompare(r2.emojiName));
    copyB.sort((r1, r2) => r1.emojiName.localeCompare(r2.emojiName));

    for (let i = 0; i < copyA.length; i++) {
      const ra = copyA[i], rb = copyB[i];
      if (ra.emojiName !== rb.emojiName) return false;
      if (ra.userIds.length !== rb.userIds.length) return false;
      for (let j = 0; j < ra.userIds.length; j++) {
        if (ra.userIds[j] !== rb.userIds[j]) return false;
      }
    }
    return true;
  }
}