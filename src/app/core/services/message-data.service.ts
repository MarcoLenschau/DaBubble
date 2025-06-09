import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Message } from '../models/message.model';
import { MessageContext } from '../interfaces/message-context.interface';
import { Reaction } from '../interfaces/reaction.interface';
import { Observable, map, OperatorFunction, combineLatest, tap, distinctUntilChanged } from 'rxjs';
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
  collectionData,
  onSnapshot
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class MessageDataService {
  private readonly collectionPath = 'messages';
  private _lastChannelMessages: Message[] | null = null;
  private _lastDirectMessages: Message[] | null = null;
  private _lastSelfMessages: Message[] | null = null;
  private _lastChannelMessageHash: string | null = null;
  private _lastDirectMessageHash: string | null = null;
  private _lastSelfMessageHash: string | null = null;


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

  // getMessages(): Observable<Message[]> {
  //   return this.firebaseService.getColRef(this.collectionPath).pipe(
  //     map(docs => this.mapToMessages(docs))
  //   );
  // }

  getMessagesForThread(threadId: string): Observable<Message[]> {
    const q = query(
      collection(this.firestore, 'messages'),
      where('threadId', '==', threadId),
      orderBy('timestamp', 'asc')
    );

    return collectionData(q).pipe(
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

    let snapshotCount = 0;

    return new Observable<Message[]>(subscriber => {
      const unsubscribe = onSnapshot(q, snapshot => {
        snapshotCount++; // nur zum Loggen
        console.groupCollapsed(`[onSnapshot] Channel: ${channelId} | Aufruf: #${snapshotCount}`);

        const rawDocs = snapshot.docs.map(d => d.data()); // nur zum Loggen
        console.log('📦 Dokumente erhalten:', rawDocs.length);
        if (rawDocs.length > 100) {
          console.warn('⚠️ Mehr als 100 Nachrichten empfangen – potenziell exzessiver Datenstrom!');
        }

        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const messages = this.mapToMessages(docs);
        const currentHash = this.getMessageHash(messages);
        const isChanged = this._lastChannelMessageHash !== currentHash;

        console.log('🔍 Hash alt:', this._lastChannelMessageHash);
        console.log('🔍 Hash neu:', currentHash);
        console.log('💡 Änderung erkannt:', isChanged);

        if (isChanged) {
          this._lastChannelMessageHash = currentHash;
          console.log('✅ Neue Nachrichten → weiterleiten:', messages.length);
          subscriber.next(messages);
        } else {
          console.log('🚫 Keine inhaltliche Änderung → kein next()');
        }

        console.groupEnd();
      }, error => {
        console.error('[onSnapshot] Fehler:', error);
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

    let snapshotCount = 0; // nur zum Loggen
    let lastM1: Message[] | null = null; // nur zum Loggen
    let lastM2: Message[] | null = null; // nur zum Loggen

    return new Observable<Message[]>(subscriber => {
      let lastM1: Message[] | null = null;
      let lastM2: Message[] | null = null;

      const sub1 = onSnapshot(q1, snapshot => {
        console.log('[onSnapshot raw] DOCS:', snapshot.docs.map(d => d.data()));

        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        lastM1 = this.mapToMessages(docs);
        emitCombined();
      }, error => subscriber.error(error));

      const sub2 = onSnapshot(q2, snapshot => {
        console.log('[onSnapshot raw] DOCS:', snapshot.docs.map(d => d.data()));

        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        lastM2 = this.mapToMessages(docs);
        emitCombined();
      }, error => subscriber.error(error));

      const emitCombined = () => {
        if (lastM1 === null || lastM2 === null) return;
        snapshotCount++; // nur zum Loggen
        const combined = [...lastM1, ...lastM2].sort((a, b) => a.timestamp - b.timestamp);
        const currentHash = this.getMessageHash(combined);
        const isChanged = this._lastDirectMessageHash !== currentHash;

        console.groupCollapsed(`[onSnapshot] DirectMessages ${currentUser} ↔ ${directContact} | Aufruf: #${snapshotCount}`);
        console.log('🧩 Kombinierte Nachrichten:', combined.length);
        console.log('🔍 Hash alt:', this._lastDirectMessageHash);
        console.log('🔍 Hash neu:', currentHash);
        console.log('💡 Änderung erkannt:', isChanged);
        if (combined.length > 100) {
          console.warn('⚠️ Kombinierte Nachrichten > 100 → prüfen auf Datenflut!');
        }

        if (isChanged) {
          this._lastDirectMessageHash = currentHash;
          console.log('✅ Neue Nachrichten → weiterleiten');
          subscriber.next(combined);
        } else {
          console.log('🚫 Keine Änderung → kein next()');
        }
        console.groupEnd();
      };

      return () => {
        sub1();
        sub2();
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
      const unsubscribe = onSnapshot(q, snapshot => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const messages = this.mapToMessages(docs);
        const currentHash = this.getMessageHash(messages);
        if (this._lastSelfMessageHash !== currentHash) {
          this._lastSelfMessageHash = currentHash;
          subscriber.next(messages);
        }

      }, error => subscriber.error(error));

      return () => unsubscribe();
    });
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

  private getMessageHash(messages: Message[]): string {
    return messages.map(m =>
      `${m.id}:${m.text}:${m.threadId ?? ''}:${m.lastReplyTimestamp ?? 0}:${m.replies}:${this.reactionsToString(m.reactions)}`
    ).join('|');
  }

  private reactionsToString(reactions: Reaction[]): string {
    return reactions
      .map(r => `${r.emojiName}:${r.userIds.sort().join(',')}`)
      .sort()
      .join(';');
  }
}
