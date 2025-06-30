import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, getDocs, query, where, setDoc, writeBatch } from '@angular/fire/firestore';
import { MessageAudioService } from './message-audio.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private messageAudio = inject(MessageAudioService);
  private firebase = inject(Firestore);

  getDocRef(docRef: string) {
    return collection(this.firebase, docRef);
  }

  getColRef(col: string) {
    // Wiederholtes, unkontrolliertes Subscriben auf collectionData-Observables? 
    return collectionData(this.getDocRef(col), { idField: 'id' });
  }

  getSingleDocRef(docRef: string, docId: any) {
    return doc(this.firebase, docRef, docId);
  }

  /**
   * Add new user in firebase.
   */
  async addUser(data: any, emaiAuth: boolean, provider = false) {
    if (data && Object.keys(data).length) {
      const usersCollection = this.getDocRef('users');
      const userDocRef = doc(usersCollection);
      data.id = userDocRef.id;
      await setDoc(userDocRef, this.toObj(data, emaiAuth, provider));
    }
  }

  toObj(data: any, emailAuth: boolean, provider: boolean): {} {
    return {
      id: data.id,
      displayName: data.displayName,
      email: data.email,
      emailVerified: emailAuth,
      provider: provider,
      photoURL: data.photoURL || './assets/img/profilepic/frederik.png',
      state: true,
      recentEmojis: data.recentEmojis || [],
      emojiUsage: data.emojiUsage || {},
      stsTokenManager: data.stsTokenManager
        ? {
          accessToken: data.stsTokenManager.accessToken,
          expirationTime: data.stsTokenManager.expirationTime,
          refreshToken: data.stsTokenManager.refreshToken,
        }
        : null,
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
   * Search user by email
   */
  async searchUsersByEmail(email: string): Promise<any[]> {
    const usersRef = collection(this.firebase, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async updateUserState(user: any, state: boolean) {
    const docRef = doc(this.firebase, 'users', user.id);
    await updateDoc(docRef, { state: state });
  }

  async updateUser(userId: string, data: Partial<any>): Promise<void> {
    const userDocRef = doc(this.firebase, 'users', userId);
    await updateDoc(userDocRef, data);
  }

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

  // Original-Code:

  // async addAudioMessage(data: any, receiverId: string): Promise<void> {
  //   const messageCollection = this.getDocRef('messages');
  //   const messageRef = doc(messageCollection);
  //   const audioBlob = data.get('audio');
  //   const base64: any = await this.messageAudio.blobToBase64(audioBlob);
  //   await setDoc(messageRef, this.messageAudio.getCleanAudioMessage(base64, receiverId));
  // }

  // async addDirectAudioMessage(data: any, receiverId: string, user: User): Promise<void> {
  //   const messageCollection = this.getDocRef('messages');
  //   const messageRef = doc(messageCollection);
  //   const audioBlob = data.get('audio');
  //   const base64: any = await this.messageAudio.blobToBase64(audioBlob);
  //   await setDoc(messageRef, this.messageAudio.getCleanDirectAudioMessage(base64, receiverId, user));
  // }

  // async addChannelAudioMessage(data: any, receiverId: string, user: User): Promise<void> {
  //   const messageCollection = this.getDocRef('messages');
  //   const messageRef = doc(messageCollection);
  //   const audioBlob = data.get('audio');
  //   const base64: any = await this.messageAudio.blobToBase64(audioBlob);
  //   await setDoc(messageRef, this.messageAudio.getCleanChannelAudioMessage(base64, receiverId, user));
  // }

  async addAudioMessage(
    data: any,
    user: User,
    opts: {
      channelId?: string;
      threadId?: string;
      receiverId?: string;
      isDirect: boolean;
    }
  ): Promise<void> {
    const messageCollection = this.getDocRef('messages');
    const messageRef = doc(messageCollection);
    const audioBlob = data.get('audio');
    const base64: any = await this.messageAudio.blobToBase64(audioBlob);
    const cleanMessage = this.messageAudio.getCleanAudioMessage(base64, {
      id: messageRef.id,
      user,
      channelId: opts.channelId ?? '',
      threadId: opts.threadId ?? '',
      receiverId: opts.receiverId ?? '',
      isDirect: opts.isDirect,
    });

    await setDoc(messageRef, cleanMessage);
  }

}