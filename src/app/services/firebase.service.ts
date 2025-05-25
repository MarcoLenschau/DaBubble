import { Injectable, Type} from '@angular/core';
import { Firestore, collection, collectionData, doc, onSnapshot, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Auth, User, user } from '@angular/fire/auth';
import { Observable, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(private firebase: Firestore) {}

  getDocRef(docRef: string) {
    return collection(this.firebase, docRef);
  }

  getColRef(col: string) {
    return collectionData(this.getDocRef(col),{ idField: 'id' });
  }

  getSingleDocRef(docRef: string, docId: any) {
    return doc(this.firebase, docRef, docId);
  }

  async addUser(data: any) {
    if (data != null || data != undefined || data != '') {
      await addDoc(this.getDocRef('users'), this.toObj(data));
    }
  }

  toObj(data: any): {} {
    return {
      displayName: data.displayName,
      email: data.email,
      stsTokenManager: 
      {
        accessToken: data.stsTokenManager.accessToken,
        expirationTime: data.stsTokenManager.expirationTime,
        refreshToken: data.stsTokenManager.refreshToken
      }
    };
  };
}