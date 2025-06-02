import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Message } from '../models/message.model';
import { MessageContext } from '../interfaces/message-context.interface';
import { Observable, map, OperatorFunction, combineLatest } from 'rxjs';
import {
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  CollectionReference,
  DocumentData,
  collection,
  getFirestore,
  Firestore,
  query,
  Query,
  where,
  orderBy,
  collectionData
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
    const messageRef = doc(collection(this.firestore, 'messages'));

    message.id = messageRef.id;

    await setDoc(messageRef, this.getCleanJson(message));
  }

  async updateMessage(message: Message) {
    const docRef = this.firebaseService.getSingleDocRef(
      this.collectionPath,
      message.id
    );
    await updateDoc(docRef, this.getCleanJson(message));
  }

  async deleteMessage(messageId: string) {
    const docRef = this.firebaseService.getSingleDocRef(
      this.collectionPath,
      messageId
    );
    await deleteDoc(docRef);
  }

  getMessages(): Observable<Message[]> {
    return this.firebaseService.getColRef(this.collectionPath).pipe(
      this.mapToMessages()
    );
  }

  getMessagesForThread(threadId: string): Observable<Message[]> {
    const q = query(
      collection(this.firestore, 'messages'),
      where('threadId', '==', threadId),
      orderBy('timestamp', 'asc')
    );

    return collectionData(q).pipe(this.mapToMessages());
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
    return collectionData(q).pipe(this.mapToMessages());
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

    const messages1$ = collectionData(q1).pipe(this.mapToMessages());
    const messages2$ = collectionData(q2).pipe(this.mapToMessages());
    console.log('Getting direct messages between', currentUser, 'and', directContact);

    return combineLatest([messages1$, messages2$]).pipe(
      map(([m1, m2]) => [...m1, ...m2].sort((a, b) => a.timestamp - b.timestamp))
    );
  }

  private getSelfMessages(userId: string): Observable<Message[]> {
    const q = query(
      collection(this.firestore, 'messages'),
      where('channelId', '==', ''),
      where('userId', '==', userId),
      where('receiverId', '==', userId),
      orderBy('timestamp', 'asc')
    );
    return collectionData(q).pipe(this.mapToMessages());
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
    };
  }

  private mapToMessages(): OperatorFunction<DocumentData[], Message[]> {
    return map((docs) =>
      docs.map(
        (doc) =>
          new Message({
            id: doc['id'],
            name: doc['name'],
            text: doc['text'],
            timestamp: doc['timestamp'] ?? Date.now(),
            userId: doc['userId'],
            receiverId: doc['receiverId'] ?? '',
            isDirectMessage: doc['isDirectMessage'] ?? false,
            channelId: doc['channelId'] ?? '',
            threadId: doc['threadId'] ?? '',
            reactions: doc['reactions'] ?? [],
          })
      )
    );
  }
}
