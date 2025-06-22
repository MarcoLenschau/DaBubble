import { Injectable, Injector, OnDestroy } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Firestore } from '@angular/fire/firestore';
import { User } from '../models/user.model';
import { Observable, BehaviorSubject, Subscription, combineLatest, of } from 'rxjs';
import { map, filter, switchMap, shareReplay } from 'rxjs/operators';
import { deleteDoc, collection, query, where, onSnapshot } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { MessageCacheService } from './message-cache.service';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private readonly collectionPath = 'users';
  private currentUserSubject = new BehaviorSubject<User>(this.createGuestUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private firestore: Firestore, private injector: Injector) {
    const authService = this.authService;
    const firebaseService = this.firebaseService;

    combineLatest([
      authService.user$,
      authService.authReady$
    ]).pipe(
      filter(([_, ready]) => ready),
      switchMap(([authUser]) => {
        if (!authUser?.email) {
          const guest = this.createGuestUser();
          this.setCurrentUser(guest);
          return of(guest);
        }

        const q = query(
          collection(this.firestore, this.collectionPath),
          where('email', '==', authUser.email)
        );

        return new Observable<User>(subscriber => {
          const unsubscribe = onSnapshot(q, snapshot => {
            const user = !snapshot.empty
              ? this.mapToUser({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
              : this.createGuestUser();

            this.setCurrentUser(user);
            subscriber.next(user);
          }, error => {
            console.error('onSnapshot currentUser fehlgeschlagen:', error);
            const guest = this.createGuestUser();
            this.setCurrentUser(guest);
            subscriber.next(guest);
          });

          return () => unsubscribe();
        });
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    ).subscribe();
  }

  private get authService(): AuthService {
    return this.injector.get(AuthService);
  }

  private get firebaseService(): FirebaseService {
    return this.injector.get(FirebaseService);
  }

  private get messageCacheService(): MessageCacheService {
    return this.injector.get(MessageCacheService);
  }

  getCurrentUser(): User {
    return this.currentUserSubject.value;
  }

  public setCurrentUser(user: User): void {
    const current = this.currentUserSubject.value;
    if (this.isUserEqual(current, user)) {
      return;
    }
    this.currentUserSubject.next(user);
  }

  // public async initCurrentUser(): Promise<void> {
  //   const userDoc = await this.getCurrentUserDoc();
  //   const user = userDoc ? this.mapToUser(userDoc) : this.createGuestUser();
  //   this.setCurrentUser(user);
  // }

  async initCurrentUser(): Promise<void> {
    const authUser = this.authService.userSubject.value;
    if (authUser?.email) {
      const firestoreUsers = await this.firebaseService.searchUsersByEmail(authUser.email);
      if (firestoreUsers.length > 0) {
        const user = this.mapToUser(firestoreUsers[0]);
        this.currentUserSubject.next(user);
      } else {
        this.currentUserSubject.next(this.createGuestUser());
      }
    } else {
      this.currentUserSubject.next(this.createGuestUser());
    }
  }

  /**
 * Get user data from all user
 * 
 * @returns {Observable<User[]>} 
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
    const email = this.authService.user?.email ?? null;
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

  public createGuestUser(id: string = 'default') {
    return new User({
      id: id,
      displayName: 'Gast',
      email: 'example@email.com',
      photoURL: './assets/img/profilepic/frederik.png',
      state: false,
      recentEmojis: [],
      emojiUsage: {},
    });
  }

  private isUserEqual(u1: User | null, u2: User | null): boolean {
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

  async updateUserName(userId: string, newName: string): Promise<void> {
    const currentUser = this.currentUserSubject.value;

    if (!currentUser || currentUser.id === 'default' || currentUser.displayName === newName) {
      return;
    }

    await this.firebaseService.updateUser(userId, { displayName: newName });
    await this.firebaseService.updateUserNameInMessages(userId, newName);

    this.messageCacheService.updateUserNameInCache(userId, newName);

    if (this.authService.user) {
      this.authService.user.displayName = newName;
      this.authService.userSubject.next(this.authService.user);
    }

    this.setCurrentUser(new User({
      ...currentUser,
      displayName: newName
    }));
  }
}










