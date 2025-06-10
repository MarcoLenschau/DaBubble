import { Injectable, Injector } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { User } from '../models/user.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { deleteDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private readonly collectionPath = 'users';
  private currentUserSubject = new BehaviorSubject<User>(this.createGuestUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private firebaseService: FirebaseService, private injector: Injector) { }

  private get auth(): AuthService {
    return this.injector.get(AuthService);
  }

  public setCurrentUser(user: User): void {
    const current = this.currentUserSubject.value;
    if (this.isUserEqual(current, user)) {
      return;
    }
    this.currentUserSubject.next(user);
  }

  public async initCurrentUser(): Promise<void> {
    const userDoc = await this.getCurrentUserDoc();
    const user = userDoc ? this.mapToUser(userDoc) : this.createGuestUser();
    this.setCurrentUser(user);
  }

  /**
 * Get user data from all user
 * 
 * @returns {Observable<User[]>} 
 */
  getUsers(): Observable<User[]> {
    console.warn('**********************************[UserDataService] getUsers() aufgerufen', new Date().toISOString());
    return this.firebaseService.getColRef(this.collectionPath).pipe(
      map((firestoreDocs) =>
        firestoreDocs.map(
          (docData) =>
            new User({
              id: docData['id'],
              displayName: docData['displayName'],
              email: docData['email'],
              photoURL: docData['photoURL'] ?? './assets/img/profilepic/frederik.png',
              state: docData['state'] ?? false,
              recentEmojis: docData['recentEmojis'] ?? [],
              emojiUsage: docData['emojiUsage'] ?? {},
            })
        )
      )
    );
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

  private isUserEqual(u1: User, u2: User): boolean {
    if (u1 === u2) return true;
    if (!u1 || !u2) return false;

    if (u1.id !== u2.id) return false;
    if (u1.displayName !== u2.displayName) return false;

    if (!this.areStringArraysEqual(u1.recentEmojis ?? [], u2.recentEmojis ?? [])) {
      return false;
    }

    if (!this.areNumberMapsEqual(u1.emojiUsage ?? {}, u2.emojiUsage ?? {})) {
      return false;
    }

    return true;
  }

  private areStringArraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  }

  private areNumberMapsEqual(map1: { [key: string]: number }, map2: { [key: string]: number }): boolean {
    const keys1 = Object.keys(map1);
    const keys2 = Object.keys(map2);
    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (map1[key] !== map2[key]) return false;
    }
    return true;
  }

}