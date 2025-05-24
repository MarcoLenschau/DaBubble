import { Injectable} from '@angular/core';
import { Firestore, collection, collectionData, doc, onSnapshot, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(private firebase: Firestore ) {}

  getDocRef(docRef: string) {
    return collection(this.firebase, docRef);
  }

  getColRef(col: string) {
    return collectionData(this.getDocRef(col),{ idField: 'id' });
  }

  getSingleDocRef(docRef: string, docId: any) {
    return doc(this.firebase, docRef, docId);
  }
}
