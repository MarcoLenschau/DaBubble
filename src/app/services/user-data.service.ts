import { Injectable, Injector } from '@angular/core';
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

  currentUser: User = this.createGuestUser();

  constructor(private firebaseService: FirebaseService, private injector: Injector) { }

  private get auth(): AuthService {
    return this.injector.get(AuthService);
  }

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
              photoURL: docData['imgUrl'] ?? './assets/img/profilepic/frederik.png',
              state: docData['state'] ?? false,
              recentEmojis: docData['recentEmojis'] ?? [],
              emojiUsage: docData['emojiUsage'] ?? {},
            })
        )
      )
    );
  }

  public async initCurrentUser(): Promise<void> {
    const userDoc = await this.getCurrentUserDoc();
    if (userDoc) {
      this.currentUser = this.mapToUser(userDoc);
    } else {
      this.currentUser = this.createGuestUser();
    }
  }

  /**
   * Update user data for firebase
   * 
   * @param user - User object from database
   */
  // async updateUser(user: User): Promise<void> {
  //   const docRef = this.firebaseService.getSingleDocRef(
  //     this.collectionPath,
  //     user.id
  //   );
  // This line has a fail what the profile picture updates
  // await updateDoc(docRef, this.getCleanJson(user));
  // }

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
      state: user.state,
      recentEmojis: user.recentEmojis,
      emojiUsage: user.emojiUsage,
    };
  }

  /**
   * Gets the current user data.
   *
   * @returns {User} The current user.
   */
  async getCurrentUser(): Promise<User | null> {
    const userDoc = await this.getCurrentUserDoc();
    if (!userDoc) return null;

    return this.mapToUser(userDoc);
  }

  /**
  * Retrieves the current user's Firestore document based on the authenticated user's email.
  * 
  * @returns {Promise<any | null>} A promise resolving to the user document data or null if no matching user is found.
  */
  private async getCurrentUserDoc(): Promise<any | null> {
    const email = this.auth.user?.email ?? null;
    if (!email) {
      return null;
    }
    const users = await this.firebaseService.searchUsersByEmail(email);
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Maps a Firestore user document to a User instance.
   * 
   * @param {any} userDoc - The user document data from Firestore.
   * @returns {User} The mapped User object.
   */
  private mapToUser(userDoc: any): User {
    return new User({
      id: userDoc.id,
      displayName: userDoc.displayName,
      email: userDoc.email,
      photoURL: userDoc.photoURL,
      state: userDoc.state ?? false,
      recentEmojis: userDoc.recentEmojis ?? [],
      emojiUsage: userDoc.emojiUsage ?? {},
    });
  }

  public createGuestUser(): User {
    return new User({
      id: 'gast',
      displayName: 'Gast',
      email: 'example@email.com',
      photoURL: './assets/img/profilepic/frederik.png',
      state: false,
      recentEmojis: [],
      emojiUsage: {},
    });
  }
}
