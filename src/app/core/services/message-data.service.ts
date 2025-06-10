import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Message } from '../models/message.model';
import { MessageContext } from '../interfaces/message-context.interface';
import { Reaction } from '../interfaces/reaction.interface';
import { Observable, Subscriber } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  DocumentData,
  collection,
  Firestore,
  query,
  where,
  orderBy,
  collectionData,
  onSnapshot, QueryDocumentSnapshot
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class MessageDataService {
  private readonly collectionPath = 'messages';

  constructor(
    private firebaseService: FirebaseService,
    private firestore: Firestore
  ) { }

  async addMessage(message: Message): Promise<void> {
    try {
      const messageRef = doc(collection(this.firestore, 'messages'));
      message.id = messageRef.id;
      await setDoc(messageRef, this.getCleanJson(message));
    } catch (error) {
      console.error('[addMessage] Fehler beim Speichern der Nachricht:', error);
      throw error;
    }
  }

  async updateMessage(message: Message) {
    const docRef = this.firebaseService.getSingleDocRef(
      this.collectionPath,
      message.id
    );
    await updateDoc(docRef, this.getCleanJson(message));
  }

  async updateMessageFields(id: string, data: Partial<Message>): Promise<void> {
    const docRef = this.firebaseService.getSingleDocRef(this.collectionPath, id);
    await updateDoc(docRef, data);
  }

  async deleteMessage(messageId: string) {
    const docRef = this.firebaseService.getSingleDocRef(
      this.collectionPath,
      messageId
    );
    await deleteDoc(docRef);
  }

  getMessagesForThread(threadId: string): Observable<Message[]> {
    const q = query(
      collection(this.firestore, 'messages'),
      where('threadId', '==', threadId),
      orderBy('timestamp', 'asc')
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map(docs => this.mapToMessages(docs))
    );
  }

  getMessagesForContext(context: MessageContext, currentUserId: string): Observable<Message[]> {

    if (context.type === 'channel') {
      if (!context.id) throw new Error('Channel context must include an id');
      return this.getChannelMessages(context.id);
    }

    if (context.type === 'direct') {
      if (!context.receiverId) throw new Error('Direct context must include a receiverId');
      const isSelf = context.receiverId === currentUserId;
      return isSelf
        ? this.getSelfMessages(currentUserId)
        : this.getDirectMessages(currentUserId, context.receiverId);
    }

    throw new Error('Invalid context type');
  }

  private getChannelMessages(channelId: string): Observable<Message[]> {
    const q = query(
      collection(this.firestore, 'messages'),
      where('channelId', '==', channelId),
      orderBy('timestamp', 'asc')
    );

    return new Observable<Message[]>(subscriber => {
      const localCache = new Map<string, Message>();

      const unsubscribe = onSnapshot(q, snapshot => {
        snapshot.docChanges().forEach(change => {
          const msg = this.mapDocToMessage(change.doc);

          switch (change.type) {
            case 'added':
              localCache.set(msg.id, msg);
              this.handleNewMessage(subscriber, localCache, msg);
              break;
            case 'modified':
              const old = localCache.get(msg.id);
              if (old) {
                const hasChanges = this.detectRelevantChanges(old, msg);
                if (hasChanges) {
                  localCache.set(msg.id, msg);
                  this.handleModifiedMessage(subscriber, localCache, msg, old);
                }
              } else {
                localCache.set(msg.id, msg);
                this.handleNewMessage(subscriber, localCache, msg);
              }
              break;
            case 'removed':
              localCache.delete(msg.id);
              this.handleRemovedMessage(subscriber, localCache, msg.id);
              break;
          }
        });
      }, error => {
        subscriber.error(error);
      });

      return () => unsubscribe();
    });
  }

  private getDirectMessages(currentUser: string, directContact: string): Observable<Message[]> {
    const q1 = query(
      collection(this.firestore, 'messages'),
      where('isDirectMessage', '==', true),
      where('userId', '==', currentUser),
      where('receiverId', '==', directContact),
      orderBy('timestamp', 'asc')
    );

    const q2 = query(
      collection(this.firestore, 'messages'),
      where('isDirectMessage', '==', true),
      where('userId', '==', directContact),
      where('receiverId', '==', currentUser),
      orderBy('timestamp', 'asc')
    );

    return new Observable<Message[]>(subscriber => {
      const cache = new Map<string, Message>();

      const processChange = (change: any) => {
        const msg = this.mapDocToMessage(change.doc);
        switch (change.type) {
          case 'added':
            cache.set(msg.id, msg);
            break;
          case 'modified': {
            const old = cache.get(msg.id);
            if (old && this.detectRelevantChanges(old, msg)) {
              cache.set(msg.id, msg);
            }
            break;
          }
          case 'removed':
            cache.delete(msg.id);
            break;
        }
      };

      const emitAll = () => {
        const all = Array.from(cache.values()).sort((a, b) => a.timestamp - b.timestamp);
        subscriber.next(all);
      };

      const sub1 = onSnapshot(q1, snap => {
        snap.docChanges().forEach(processChange);
        emitAll();
      }, err => subscriber.error(err));

      const sub2 = onSnapshot(q2, snap => {
        snap.docChanges().forEach(processChange);
        emitAll();
      }, err => subscriber.error(err));

      return () => {
        sub1(); sub2();
      };
    });
  }

  private getSelfMessages(userId: string): Observable<Message[]> {
    const q = query(
      collection(this.firestore, 'messages'),
      where('channelId', '==', ''),
      where('userId', '==', userId),
      where('receiverId', '==', userId),
      orderBy('timestamp', 'asc')
    );

    return new Observable<Message[]>(subscriber => {
      const cache = new Map<string, Message>();

      const unsubscribe = onSnapshot(q, snapshot => {
        snapshot.docChanges().forEach(change => {
          const msg = this.mapDocToMessage(change.doc);
          switch (change.type) {
            case 'added':
              cache.set(msg.id, msg);
              break;
            case 'modified': {
              const old = cache.get(msg.id);
              if (old && this.detectRelevantChanges(old, msg)) {
                cache.set(msg.id, msg);
              }
              break;
            }
            case 'removed':
              cache.delete(msg.id);
              break;
          }
        });
        const all = Array.from(cache.values()).sort((a, b) => a.timestamp - b.timestamp);
        subscriber.next(all);
      }, error => subscriber.error(error));

      return () => unsubscribe();
    });
  }

  private detectRelevantChanges(oldMsg: Message, newMsg: Message): boolean {
    if (oldMsg.name !== newMsg.name) return true;
    if (oldMsg.text !== newMsg.text) return true;
    if (oldMsg.threadId !== newMsg.threadId) return true;
    if (oldMsg.replies !== newMsg.replies) return true;
    if (oldMsg.lastReplyTimestamp !== newMsg.lastReplyTimestamp) return true;
    if (!this.areReactionsEqual(oldMsg.reactions, newMsg.reactions)) return true;
    // if ((oldMsg.isEdited ?? false) !== (newMsg.isEdited ?? false)) return true;
    return false;
  }
  private handleNewMessage(
    subscriber: Subscriber<Message[]>,
    cache: Map<string, Message>,
    msg: Message
  ) {
    const all = Array.from(cache.values()).sort((a, b) => a.timestamp - b.timestamp);
    subscriber.next(all);
  }

  private handleModifiedMessage(
    subscriber: Subscriber<Message[]>,
    cache: Map<string, Message>,
    newMsg: Message,
    oldMsg: Message
  ) {
    const all = Array.from(cache.values()).sort((a, b) => a.timestamp - b.timestamp);
    subscriber.next(all);
  }

  private handleRemovedMessage(
    subscriber: Subscriber<Message[]>,
    cache: Map<string, Message>,
    removedId: string
  ) {
    const all = Array.from(cache.values()).sort((a, b) => a.timestamp - b.timestamp);
    subscriber.next(all);
  }

  private getCleanJson(message: Message): any {
    return {
      id: message.id,
      name: message.name,
      text: message.text,
      timestamp: message.timestamp,
      userId: message.userId,
      channelId: message.channelId ?? '',
      receiverId: message.receiverId ?? null,
      isDirectMessage: message.isDirectMessage ?? false,
      threadId: message.threadId,
      reactions: message.reactions,
      lastReplyTimestamp: message.lastReplyTimestamp ?? null,
      replies: message.replies ?? 0,
    };
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
      // isEdited: data.isEdited ?? false,
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
