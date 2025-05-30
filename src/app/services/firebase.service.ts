import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  getDoc,
} from '@angular/fire/firestore';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  constructor(private firebase: Firestore) {}

  getDocRef(docRef: string) {
    return collection(this.firebase, docRef);
  }

  getColRef(col: string) {
    return collectionData(this.getDocRef(col), { idField: 'id' });
  }

  getSingleDocRef(docRef: string, docId: any) {
    return doc(this.firebase, docRef, docId);
  }

  /**
   * Fügt neuen Benutzer hinzu
   */
  async addUser(data: any) {
    if (data != null || data != undefined || data != '') {
      await addDoc(this.getDocRef('users'), this.toObj(data));
    }
  }

  /**
   * Wandelt Userdaten in speicherbares Objekt um
   */
  // toObj(data: any): {} { // Originalcode
  //   return {
  //     displayName: data.displayName,
  //     displayName_lowercase: data.displayName.toLowerCase(),
  //     email: data.email,
  //     stsTokenManager: {
  //       accessToken: data.stsTokenManager.accessToken,
  //       expirationTime: data.stsTokenManager.expirationTime,
  //       refreshToken: data.stsTokenManager.refreshToken,
  //     },
  //   };
  // }

  toObj(data: any): {} {
    return {
      displayName: data.displayName,
      displayName_lowercase: data.displayName.toLowerCase(),
      email: data.email,
      imgPath: data.photoURL,
      stsTokenManager: {
        accessToken: data.stsTokenManager.accessToken,
        expirationTime: data.stsTokenManager.expirationTime,
        refreshToken: data.stsTokenManager.refreshToken,
      }
    };
  }

  /**
   *  Suche User anhand eines @namens (case-insensitive)
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
   * Suche User per exakter E-Mail
   */
  async searchUsersByEmail(email: string): Promise<any[]> {
    const usersRef = collection(this.firebase, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Aktualisiert bestehende Benutzer mit lowercase displayName-Feld
   */
  async updateAllUsersWithLowercaseField(): Promise<void> {
    const usersRef = collection(this.firebase, 'users');
    const snapshot = await getDocs(usersRef);

    const updates = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const displayName = data['displayName'];

      if (displayName && !data['displayName_lowercase']) {
        const docRef = doc(this.firebase, 'users', docSnap.id);
        return updateDoc(docRef, {
          displayName_lowercase: displayName.toLowerCase(),
        });
      } else {
        return Promise.resolve();
      }
    });
  }
}
