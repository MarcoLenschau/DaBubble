import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { MessageCacheService } from './message-cache.service';
import { Message } from '../models/message.model';
import { MessageContext } from '../interfaces/message-context.interface';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  collection,
  Firestore,
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

  /**
     * Adds a new message to Firestore and assigns it a generated ID.
     *
     * @param message The message object to add.
     * @returns A Promise that resolves when the message is saved.
     * @throws Throws an error if saving fails.
     */
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

  /**
   * Updates an existing message in Firestore by replacing its content.
   *
   * @param message The updated message object.
   * @returns A promise that resolves when the update is complete.
   */
  async updateMessage(message: Message) {
    const docRef = this.firebaseService.getSingleDocRef(
      this.collectionPath,
      message.id
    );
    await updateDoc(docRef, this.getCleanJson(message));
  }

  /**
   * Updates specific fields of an existing message in Firestore.
   *
   * @param id The ID of the message to update.
   * @param data Partial message data with fields to update.
   * @returns A Promise that resolves when the update is complete.
   */
  async updateMessageFields(id: string, data: Partial<Message>): Promise<void> {
    const docRef = this.firebaseService.getSingleDocRef(this.collectionPath, id);
    await updateDoc(docRef, data);
  }

  /**
   * Deletes a message document from Firestore by its ID.
   *
   * @param messageId The ID of the message to delete.
   * @returns A Promise that resolves when the deletion is complete.
   */
  async deleteMessage(messageId: string) {
    const docRef = this.firebaseService.getSingleDocRef(
      this.collectionPath,
      messageId
    );
    await deleteDoc(docRef);
  }

  /**
   * Loads messages belonging to a thread and returns an observable stream of those messages.
   *
   * @param threadId The ID of the thread.
   * @returns Observable that emits the messages in the thread.
   */
  getMessagesForThread(threadId: string): Observable<Message[]> {
    const load$ = from(
      this.messageCacheService.loadMessagesForThread(threadId)
    );

    return load$.pipe(
      switchMap(() => this.messageCacheService.threadMessages$)
    );
  }

  /**
   * Loads messages for a given context (channel or direct) and returns an observable stream.
   *
   * @param context The message context.
   * @param currentUserId The current user's ID (used for direct messages).
   * @returns Observable that emits messages belonging to the context.
   */
  getMessagesForContext(context: MessageContext, currentUserId: string): Observable<Message[]> {
    const load$ = from(
      this.messageCacheService.loadMessagesForContext(context, currentUserId, 'MessageDataService: regular load')
    );

    return load$.pipe(
      switchMap(() => this.messageCacheService.messages$)
    );
  }

  /**
   * Returns a cleaned JSON representation of a message suitable for Firestore storage.
   *
   * @param message The message object.
   * @returns Cleaned message data with default values where appropriate.
   */
  private getCleanJson(message: Message): any {
    return {
      audio: message.audio ?? '',
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
}
