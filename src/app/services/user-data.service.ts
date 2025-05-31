import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { User } from '../models/user.model';
import { Observable, map } from 'rxjs';
import { doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private readonly collectionPath = 'users';

  constructor(private firebaseService: FirebaseService, private auth: AuthService) { }

  getUsers(): Observable<User[]> {
    return this.firebaseService.getColRef(this.collectionPath).pipe(
      map((firestoreDocs) =>
        firestoreDocs.map(
          (docData) =>
            new User({
              id: docData['id'],
              displayName: docData['displayName'],
              email: docData['email'],
              img: docData['imgUrl'] ?? './assets/img/profilepic/frederik.png',
              recentEmojis: docData['recentEmojis'] ?? [],
              emojiUsage: docData['emojiUsage'] ?? {},
            })
        )
      )
    );
  }

  async updateUser(user: User) {
    const docRef = this.firebaseService.getSingleDocRef(
      this.collectionPath,
      user.id
    );
    await updateDoc(docRef, this.getCleanJson(user));
  }

  /** User löschen */
  async deleteUser(userId: string) {
    const docRef = this.firebaseService.getSingleDocRef(
      this.collectionPath,
      userId
    );
    await deleteDoc(docRef);
  }

  private getCleanJson(user: User): any {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      img: user.img,
      recentEmojis: user.recentEmojis,
      emojiUsage: user.emojiUsage,
    };
  }

  getCurrentUser(): any {
    this.auth.user$.subscribe(user => {
      return user;
    })
  }
}
