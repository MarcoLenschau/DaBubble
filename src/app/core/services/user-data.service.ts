import { inject, Injectable, Injector } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Firestore, QuerySnapshot, DocumentData } from '@angular/fire/firestore';
import { User } from '../models/user.model';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
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
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  /**
   * Initializes a new instance of the service and sets up the user subscription.
   * Calls the `initUserSubscription` method to start listening for user data changes.
   */
  constructor() {
    this.initUserSubscription();
  }

  /**
   * Getter for AuthService via Injector.
   * 
   * @returns {AuthService} The AuthService instance.
   */
  private get authService(): AuthService {
    return this.injector.get(AuthService);
  }

  /**
   * Getter for FirebaseService via Injector.
   * 
   * @returns {FirebaseService} The FirebaseService instance.
   */
  private get firebaseService(): FirebaseService {
    return this.injector.get(FirebaseService);
  }

  /**
   * Getter for MessageCacheService via Injector.
   * 
   * @returns {MessageCacheService} The MessageCacheService instance.
   */
  private get messageCacheService(): MessageCacheService {
    return this.injector.get(MessageCacheService);
  }

  /**
   * Returns the current user synchronously.
   * 
   * @returns {User} The current User object held in BehaviorSubject.
   */
  getCurrentUser(): User {
    return this.currentUserSubject.value;
  }

  /**
   * Initializes subscription to AuthService user and auth readiness status.
   * Automatically updates the current user based on Firestore user documents.
   */
  private initUserSubscription() {
    const authService = this.authService;
    combineLatest([
      authService.user$,
      authService.authReady$
    ]).pipe(
      filter(([_, ready]) => ready),
      switchMap(([authUser]) => this.handleAuthUser(authUser)),
      shareReplay({ bufferSize: 1, refCount: true })
    ).subscribe();
  }

  /**
   * Handles authenticated user information and fetches corresponding Firestore user.
   * Falls back to guest user if no valid email is present.
   * 
   * @param authUser The authenticated user object from AuthService.
   * @returns {Observable<User>} Observable emitting the mapped User or guest user.
   */
  private handleAuthUser(authUser: any): Observable<User> {
    if (!authUser?.email) {
      const guest = this.createGuestUser();
      this.setCurrentUser(guest);
      return of(guest);
    }
    const q = query(
      collection(this.firestore, this.collectionPath),
      where('email', '==', authUser.email)
    );

    return this.createUserObservable(q);
  }

  /**
   * Creates an Observable wrapping Firestore's onSnapshot listener for user data.
   * Updates current user subject on data changes or errors.
   * 
   * @param q Firestore query for user documents.
   * @returns {Observable<User>} Observable emitting the User object.
   */
  private createUserObservable(q: any): Observable<User> {
    return new Observable<User>(subscriber => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => this.handleSnapshot(snapshot, subscriber),
        error => this.handleSnapshotError(error, subscriber)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Processes Firestore snapshot to map user data or fallback guest user,
   * then updates current user and emits via subscriber.
   * 
   * @param snapshot Firestore QuerySnapshot containing user documents.
   * @param subscriber The Observable subscriber to emit user.
   */
  private handleSnapshot(snapshot: QuerySnapshot<DocumentData>, subscriber: any) {
    const user = !snapshot.empty
      ? this.mapToUser({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
      : this.createGuestUser();

    this.setCurrentUser(new User({ ...user }));

    subscriber.next(user);
  }

  /**
    * Handles errors during Firestore snapshot listening.
    * Logs error, sets guest user as current and emits to subscriber.
    * 
    * @param error The error thrown by onSnapshot listener.
    * @param subscriber The Observable subscriber to emit user.
    */
  private handleSnapshotError(error: any, subscriber: any) {
    console.error('onSnapshot currentUser fehlgeschlagen:', error);
    const guest = this.createGuestUser();
    this.setCurrentUser(guest);
    subscriber.next(guest);
  }

  /**
   * Updates the current user BehaviorSubject if the new user differs.
   * Avoids unnecessary emits if user data is equal.
   * 
   * @param user The new User object to set as current.
   */
  public setCurrentUser(user: User): void {
    if (!user) return;

    const userCopy = new User({ ...user });

    const current = this.currentUserSubject.value;
    if (this.isUserEqual(current, userCopy)) {
      return;
    }
    this.currentUserSubject.next(userCopy);
  }

  /**
   * Initializes current user manually by querying Firestore using authenticated user's email.
   * Sets guest user if no matching Firestore user found.
   * 
   * @returns {Promise<void>}
   */
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
   * Retrieves all users from Firestore as an Observable array of User instances.
   * 
   * @returns {Observable<User[]>} Observable emitting list of all User objects.
   */
  getUsers(): Observable<User[]> {
    return this.firebaseService.getColRef(this.collectionPath).pipe(
      map((firestoreDocs) =>
        firestoreDocs.map( (docData) =>
            new User({
              id: docData['id'], displayName: docData['displayName'], email: docData['email'],
              photoURL: docData['photoURL'] ?? './assets/img/profilepic/frederik.png', state: docData['state'] ?? false,
              recentEmojis: docData['recentEmojis'] ?? [], emojiUsage: docData['emojiUsage'] ?? {},
            })
        )
      )
    );
  }

  /**
   * Deletes a user document from Firestore by ID.
   * 
   * @param userId The Firestore document ID of the user to delete.
   * @returns {Promise<void>}
   */
  async deleteUser(userId: string): Promise<void> {
    const docRef = this.firebaseService.getSingleDocRef(
      this.collectionPath,
      userId
    );
    await deleteDoc(docRef);
  }

  /**
   * Retrieves the current user's Firestore document data based on authenticated user's email.
   * Returns null if no email or no matching user document found.
   * 
   * @returns {Promise<any | null>} Promise resolving to user document data or null.
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

  /**
   * Creates a default guest user instance.
   * 
   * @param id Optional ID for the guest user, defaults to 'default'.
   * @returns {User} A User instance representing a guest.
   */
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

  /**
   * Checks whether two User instances are equal by comparing basic and emoji-related data.
   * 
   * @param u1 First User instance or null.
   * @param u2 Second User instance or null.
   * @returns {boolean} True if users are equal, false otherwise.
   */
  private isUserEqual(u1: User | null, u2: User | null): boolean {
    if (u1 === u2) return true;
    if (!u1 || !u2) return false;

    if (!this.isBasicUserDataEqual(u1, u2)) return false;
    if (!this.isUserEmojiDataEqual(u1, u2)) return false;

    return true;
  }

  /**
   * Compares basic user data (id and displayName).
   * 
   * @param u1 First User instance.
   * @param u2 Second User instance.
   * @returns {boolean} True if basic data matches, false otherwise.
   */
  private isBasicUserDataEqual(u1: User, u2: User): boolean {
    if (u1.id !== u2.id) return false;
    if (u1.displayName !== u2.displayName) return false;
    return true;
  }

  /**
   * Compares emoji-related user data (recentEmojis and emojiUsage).
   * 
   * @param u1 First User instance.
   * @param u2 Second User instance.
   * @returns {boolean} True if emoji data matches, false otherwise.
   */
  private isUserEmojiDataEqual(u1: User, u2: User): boolean {
    if (!this.areStringArraysEqual(u1.recentEmojis ?? [], u2.recentEmojis ?? [])) {
      return false;
    }
    if (!this.areNumberMapsEqual(u1.emojiUsage ?? {}, u2.emojiUsage ?? {})) {
      return false;
    }
    return true;
  }

  /**
   * Checks equality of two string arrays.
   * 
   * @param arr1 First string array.
   * @param arr2 Second string array.
   * @returns {boolean} True if arrays have same length and values, false otherwise.
   */
  private areStringArraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  }

  /**
   * Checks equality of two maps with string keys and number values.
   * 
   * @param map1 First map object.
   * @param map2 Second map object.
   * @returns {boolean} True if keys and values match, false otherwise.
   */
  private areNumberMapsEqual(map1: { [key: string]: number }, map2: { [key: string]: number }): boolean {
    const keys1 = Object.keys(map1);
    const keys2 = Object.keys(map2);
    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (map1[key] !== map2[key]) return false;
    }
    return true;
  }

  /**
   * Updates the displayName of a user both in Firestore and cached messages.
   * Also updates local cache and AuthService user object.
   * 
   * @param userId The ID of the user to update.
   * @param newName The new display name to set.
   * @returns {Promise<void>}
   */
  async updateUserName(userId: string, newName: string): Promise<void> {
    const currentUser = this.currentUserSubject.value;

    if (!currentUser || currentUser.id === 'default' || currentUser.displayName === newName) {
      return;
    }

    await this.performUserNameUpdates(userId, newName);

    this.setCurrentUser(new User({
      ...currentUser,
      displayName: newName
    }));
  }

  /**
   * Helper method that performs all Firestore and cache updates for user name change.
   * 
   * @param userId The ID of the user to update.
   * @param newName The new display name.
   * @returns {Promise<void>}
   */
  private async performUserNameUpdates(userId: string, newName: string): Promise<void> {
    await this.firebaseService.updateUser(userId, { displayName: newName });
    await this.firebaseService.updateUserNameInMessages(userId, newName);
    const oldCtx = this.messageCacheService.getCurrentContext();
    if (oldCtx) {
      await this.messageCacheService.loadMessagesForContext(oldCtx, userId, 'updateUserNameInCache: reload after name update');
    }
    this.messageCacheService.updateUserNameInCache(userId, newName);
    if (this.authService.user) {
      this.authService.user.displayName = newName;
      this.authService.userSubject.next(this.authService.user);
    }
  }
}