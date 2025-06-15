import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { MessageCacheService } from './message-cache.service';
import { Message } from '../models/message.model';
import { MessageContext } from '../interfaces/message-context.interface';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  collection,
  Firestore,
  query,
  where,
  orderBy,
  collectionData,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})

export class MessageDataService {
  private readonly collectionPath = 'messages';

  constructor(
    private firebaseService: FirebaseService,
    private firestore: Firestore, private messageCacheService: MessageCacheService
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

  // getMessagesForThread(threadId: string): Observable<Message[]> {
  //   return this.messageCacheService.messages$.pipe(
  //     map(messages => messages.filter(m => m.threadId === threadId)),
  //   );
  // }

  getMessagesForThread(threadId: string): Observable<Message[]> {
    const load$ = from(
      this.messageCacheService.loadMessagesForThread(threadId)
    );

    return load$.pipe(
      switchMap(() => this.messageCacheService.threadMessages$)
    );
  }


  // getMessagesForThread(threadId: string): Observable<Message[]> {
  //   const q = query(
  //     collection(this.firestore, 'messages'),
  //     where('threadId', '==', threadId),
  //     orderBy('timestamp', 'asc')
  //   );

  //   return collectionData(q, { idField: 'id' }).pipe(
  //     map(docs => this.mapToMessages(docs))
  //   );
  // }

  getMessagesForContext(context: MessageContext, currentUserId: string): Observable<Message[]> {
    const load$ = from(
      this.messageCacheService.loadMessagesForContext(context, currentUserId)
    );

    return load$.pipe(
      switchMap(() => this.messageCacheService.messages$)
    );
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
