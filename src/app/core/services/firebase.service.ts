import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, getDocs, query, where, setDoc, writeBatch } from '@angular/fire/firestore';
import { MessageAudioService } from './message-audio.service';
import { User } from '../models/user.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private messageAudio = inject(MessageAudioService);
  private firebase = inject(Firestore);
   private contactsSubject = new BehaviorSubject<any[]>([]);
  private channelsSubject = new BehaviorSubject<any[]>([]);

  /**
   * Returns a Firestore collection reference for the specified document path.
   *
   * @param docRef - The path to the Firestore collection as a string.
   * @returns A reference to the Firestore collection at the specified path.
   */
  getDocRef(docRef: string) {
    return collection(this.firebase, docRef);
  }

  /**
   * Returns an observable of data from the specified Firestore collection.
   *
   * @param col - The name of the Firestore collection to retrieve.
   * @returns An observable emitting an array of documents from the collection, each including an `id` field.
   */
  getColRef(col: string) {
    // Wiederholtes, unkontrolliertes Subscriben auf collectionData-Observables? 
    return collectionData(this.getDocRef(col), { idField: 'id' });
  }

  /**
   * Returns a reference to a single Firestore document.
   *
   * @param docRef - The collection path or document path as a string.
   * @param docId - The ID of the document to reference.
   * @returns A reference to the specified Firestore document.
   */
  getSingleDocRef(docRef: string, docId: any) {
    return doc(this.firebase, docRef, docId);
  }

  /**
   * Adds a new user document to the 'users' collection in Firestore.
   *
   * @param data - The user data object to be added. Must be a non-empty object.
   * @param emaiAuth - Indicates if the user is authenticated via email.
   * @param provider - Optional. Specifies if the user was added via a provider (default: false).
   * @returns A promise that resolves when the user document has been successfully added.
   */
  async addUser(data: any, emaiAuth: boolean, provider = false) {
    if (data && Object.keys(data).length) {
      const usersCollection = this.getDocRef('users');
      const userDocRef = doc(usersCollection);
      data.id = userDocRef.id;
      await setDoc(userDocRef, this.toObj(data, emaiAuth, provider));
    }
  }

  /**
   * Transforms user data into a standardized object format for application use.
   *
   * @param data - The raw user data object, typically from Firebase authentication.
   * @param emailAuth - Indicates whether the user's email is verified.
   * @param provider - Indicates whether the user signed in with an external provider.
   * @returns An object containing user information such as id, displayName, email, verification status, provider status, photo URL, state, recent emojis, emoji usage, and token manager details.
   */
  toObj(data: any, emailAuth: boolean, provider: boolean): {} {
    return {
      id: data.id,
      displayName: data.displayName,
      email: data.email,
      emailVerified: emailAuth,
      provider: provider,
      photoURL: data.photoURL || './assets/img/profilepic/frederik.png',
      state: true,
      recentEmojis: data.recentEmojis || [], emojiUsage: data.emojiUsage || {}, 
      stsTokenManager: data.stsTokenManager ? 
      { accessToken: data.stsTokenManager.accessToken, expirationTime: data.stsTokenManager.expirationTime, refreshToken: data.stsTokenManager.refreshToken } : null,
    };
  }

  /**
   *  Search user by @namens (case-insensitive)
   */
  async searchUsersByNameFragment(fragment: string): Promise<any[]> {
    const usersRef = collection(this.firebase, 'users');
    const lowercaseFragment = fragment.toLowerCase(); // wichtig für Vergleich
    const q = query(
      usersRef,
      where('displayName_lowercase', '>=', lowercaseFragment),
      where('displayName_lowercase', '<=', lowercaseFragment + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Searches for users in the Firestore 'users' collection by their email address.
   *
   * @param email - The email address to search for.
   * @returns A promise that resolves to an array of user objects matching the given email.
   */
  async searchUsersByEmail(email: string): Promise<any[]> {
    const usersRef = collection(this.firebase, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
  
  /**
   * Searches for a user by their document ID in the Firestore 'users' collection.
   *
   * @param {string} userId - The ID of the user to search for.
   * @returns {Promise<any>} A Promise that resolves to the user object.
   */
  async searchUsersById(userId: string): Promise<any> {
    let user: any = {};
    const usersRef = collection(this.firebase, 'users');
    const querySnapshot = await getDocs(usersRef);
    querySnapshot.forEach((doc) => {
      doc.id === userId ? user = {id: doc.id, ...doc.data()}: null;
    });
    return user;
  }

  /**
   * Updates the state of a user in the Firestore database.
   *
   * @param user - The user object containing at least an `id` property used to locate the user document.
   * @param state - A boolean value representing the new state to set for the user.
   * @returns A promise that resolves when the user's state has been updated.
   */
  async updateUserState(user: any, state: boolean) {
    const docRef = doc(this.firebase, 'users', user.id);
    await updateDoc(docRef, { state: state });
  }

  /**
   * Updates the specified user's document in the Firestore database with the provided data.
   *
   * @param userId - The unique identifier of the user whose document should be updated.
   * @param data - A partial object containing the fields and values to update in the user's document.
   * @returns A promise that resolves when the update operation is complete.
   */
  async updateUser(userId: string, data: Partial<any>): Promise<void> {
    const userDocRef = doc(this.firebase, 'users', userId);
    await updateDoc(userDocRef, data);
  }

  /**
   * Updates the user name in all messages for a given user ID.
   * @param userId The ID of the user whose name should be updated.
   * @param newName The new name to set in the messages.
   */
  async updateUserNameInMessages(userId: string, newName: string): Promise<void> {
    const messagesRef = collection(this.firebase, 'messages');
    const q = query(messagesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    let batch = writeBatch(this.firebase);
    let batchCount = 0;
    const batchLimit = 500;

    for (const docSnap of snapshot.docs) {
      batch.update(docSnap.ref, { name: newName });
      batchCount++;

      if (batchCount === batchLimit) {
        await batch.commit();
        batch = writeBatch(this.firebase);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
  }

  /**
   * Adds an audio message to the messages collection.
   * @param data The form data containing the audio blob.
   * @param user The user sending the audio message.
   * @param opts Additional options such as channelId, threadId, receiverId, and isDirect.
   */
  async addAudioMessage(data: any, user: User, opts: 
    { channelId?: string; threadId?: string; receiverId?: string; isDirect: boolean;}): Promise<void> {
    const messageCollection = this.getDocRef('messages');
    const messageRef = doc(messageCollection);
    const audioBlob = data.get('audio');
    const base64: any = await this.messageAudio.blobToBase64(audioBlob);
    const cleanMessage = this.messageAudio.getCleanAudioMessage(base64, 
      { id: messageRef.id, user, channelId: opts.channelId ?? '', threadId: opts.threadId ?? '', 
        receiverId: opts.receiverId ?? '', isDirect: opts.isDirect });
    await setDoc(messageRef, cleanMessage);
  }


   getContactsObservable() {
    return this.contactsSubject.asObservable();
  }

  getChannelsObservable() {
    return this.channelsSubject.asObservable();
  }

  // Diese Methoden aufrufen, wenn Daten geladen werden:
  setContacts(contacts: any[]) {
    this.contactsSubject.next(contacts);
  }

  setChannels(channels: any[]) {
    this.channelsSubject.next(channels);
  }
}
