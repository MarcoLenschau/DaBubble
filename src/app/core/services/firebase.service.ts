import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, getDocs, getDoc, query, where, setDoc, onSnapshot, DocumentReference } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  constructor(private firebase: Firestore) { }

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

  // TODO: async searchMessagesForUser(term: string, userId: string): Promise<Message[]> {}

  // /**
  //  * Aktualisiert bestehende Benutzer mit lowercase displayName-Feld
  //  */
  // async updateAllUsersWithLowercaseField(): Promise<void> {
  //   const usersRef = collection(this.firebase, 'users');
  //   const snapshot = await getDocs(usersRef);

  //   const updates = snapshot.docs.map((docSnap) => {
  //     const data = docSnap.data();
  //     const displayName = data['displayName'];

  //     if (displayName && !data['displayName_lowercase']) {
  //       const docRef = doc(this.firebase, 'users', docSnap.id);
  //       return updateDoc(docRef, {
  //         displayName_lowercase: displayName.toLowerCase(),
  //       });
  //     } else {
  //       return Promise.resolve();
  //     }
  //   });
  // }

  async updateUserState(user: any, state: boolean) {
    const docRef = doc(this.firebase, 'users', user.id);
    await updateDoc(docRef, { state: state });
  }
}
