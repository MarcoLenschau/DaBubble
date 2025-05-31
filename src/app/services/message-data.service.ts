import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Message } from '../models/message.model';
import { MessageContext } from '../interfaces/message-context.interface';
import { Observable, map, OperatorFunction } from 'rxjs';
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


  // getMessages(): Observable<Message[]> {
  //   return this.firebaseService.getColRef(this.collectionPath).pipe(
  //     map((firestoreDocs) =>
  //       firestoreDocs.map(
  //         (docData) =>
  //           new Message({
  //             id: docData['id'],
  //             name: docData['name'],
  //             text: docData['text'],
  //             timestamp: docData['timestamp'],
  //             userId: docData['userId'],
  //             receiverId: docData['receiverId'] ?? '',
  //             isDirectMessage: docData['isDirectMessage'] ?? false,
  //             channelId: docData['channelId'] ?? '',
  //             threadId: docData['threadId'] ?? '',
  //             reactions: docData['reactions'] ?? [],
  //           })
  //       )
  //     )
  //   );
  // }

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

  getMessagesForContext(context: MessageContext, currentUserId: string): Observable<Message[]> {
    let q: Query<DocumentData>;

    if (context.type === 'channel') {
      q = query(collection(this.firestore, 'messages'),
        where('channelId', '==', context.id),
        orderBy('timestamp', 'asc')
      );
    } else if (context.type === 'direct') {
      const isSelf = context.receiverId === currentUserId;
      const filters = [
        where('channelId', '==', null),
        where('receiverId', '==', context.receiverId),
      ];
      if (isSelf) {
        filters.push(where('userId', '==', currentUserId));
      }
      q = query(collection(this.firestore, 'messages'), ...filters, orderBy('timestamp', 'asc'));
    } else {
      throw new Error('Invalid context type');
    }

    // return collectionData(q) as Observable<Message[]>;
    return collectionData(q).pipe(
      this.mapToMessages()
    );
  }

  private getCleanJson(message: Message): any {
    return {
      id: message.id,
      name: message.name,
      text: message.text,
      timestamp: message.timestamp,
      userId: message.userId,
      channelId: message.channelId,
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
            timestamp: doc['timestamp'],
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
