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
  
  /**
   * Get user data from all user
   * 
   * @returns {Observable<User[]>} Observable from array of all user in the database 
   */
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

  /**
   * Update user data for firebase
   * 
   * @param user - User object from database
   */
  async updateUser(user: User): Promise<void> {
    const docRef = this.firebaseService.getSingleDocRef(
      this.collectionPath,
      user.id
    );
    await updateDoc(docRef, this.getCleanJson(user));
  }

  /**
   * Delete user from firebase
   * 
   * @param userId - ID from user
   */
  async deleteUser(userId: string): Promise<void> {
    const docRef = this.firebaseService.getSingleDocRef(
      this.collectionPath,
      userId
    );
    await deleteDoc(docRef);
  }

  /**
   * Get clean JSON from a user
   * 
   * @param user - User object from database
   * 
   * @returns {} - Clean JSON with user data
   */
  private getCleanJson(user: any): any {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      recentEmojis: user.recentEmojis,
      emojiUsage: user.emojiUsage,
    };
  }

  /**
   * Gets the current user data.
   *
   * @returns {User} The current user.
   */
  getCurrentUser(): User {
    return this.auth.user;
  }
}
