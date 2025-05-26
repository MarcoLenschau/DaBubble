import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Message } from '../models/message.model';
import { Observable, map } from 'rxjs';
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
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class MessageDataService {
  private readonly collectionPath = 'messages';

  constructor(
    private firebaseService: FirebaseService,
    private firestore: Firestore
  ) {}

  getMessages(): Observable<Message[]> {
    return this.firebaseService.getColRef(this.collectionPath).pipe(
      map((firestoreDocs) =>
        firestoreDocs.map(
          (docData) =>
            new Message({
              id: docData['id'],
              name: docData['name'],
              text: docData['text'],
              timestamp: docData['timestamp'],
              userId: docData['userId'],
              channelId: docData['channelId'] ?? '',
              threadId: docData['threadId'] ?? '',
              reactions: docData['reactions'] ?? [],
            })
        )
      )
    );
  }

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

  private getCleanJson(message: Message): any {
    return {
      id: message.id,
      name: message.name,
      text: message.text,
      timestamp: message.timestamp,
      userId: message.userId,
      channelId: message.channelId,
      threadId: message.threadId,
      reactions: message.reactions,
    };
  }
}
