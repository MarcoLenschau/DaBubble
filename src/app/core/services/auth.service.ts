import { inject, Injectable, Injector } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, User, GithubAuthProvider, sendPasswordResetEmail, UserCredential, reauthenticateWithCredential, updateEmail, sendEmailVerification, onAuthStateChanged, getAuth } from '@angular/fire/auth';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Observable, firstValueFrom, BehaviorSubject } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { RouterService } from './router.service';
import { UserDataService } from './user-data.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firebase = inject(FirebaseService);
  private router = inject(RouterService);
  private injector = inject(Injector);
  private get userDataService(): UserDataService {
    return this.injector.get(UserDataService);
  }
  userSubject = new BehaviorSubject<any>({});
  user$ = this.userSubject.asObservable();
  users$: Observable<any>;
  users: any[] = [];
  user: any = {};
  emailVerified = false;

  private authReadySubject = new BehaviorSubject<boolean>(false);
  authReady$ = this.authReadySubject.asObservable();
  
  /**
   * Initializes the AuthService by setting up the users observable,
   * subscribing to user data updates, checking if the user's email is verified,
   * and restoring the authentication state from storage or previous session.
   *
   * - Retrieves a reference to the 'users' collection from Firebase.
   * - Subscribes to changes in the users collection and updates the local users property.
   * - Checks if the currently authenticated user's email is verified.
   * - Restores the authentication state to maintain user session persistence.
   */
  constructor() {
    this.users$ = this.firebase.getColRef('users');
    this.users$.subscribe((users: any) => {
      this.users = users;
    });
    this.checkIfEmailVerified();
    this.restoreAuthState();
  }

  /**
   * Checks if the current user's email is verified and updates the state.
   */
  checkIfEmailVerified(): void {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.emailVerified = true;
      }
    });
  }

  /**
   * Restores the authentication state and updates the user subject accordingly.
   * @private
   */
  private async restoreAuthState(): Promise<void> {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.userSubject.next(user);
        this.user = user;
        user.displayName ? await this.restoreProviderAuth(user) : await this.restoreEmailAuth(user);
      } else {
        this.user = null;
        this.userSubject.next(null);
      }
      this.authReadySubject.next(true);
    });
  }

  /**
   * Restores authentication state for provider-based logins.
   * @param user The authenticated user object.
   */
  async restoreProviderAuth(user: any): Promise<void> {
    await this.userDataService.initCurrentUser();
  }

  /**
   * Restores authentication state for email-based logins.
   * @param user The authenticated user object.
   */
  async restoreEmailAuth(user: any): Promise<void> {
    if (user.email) {
      const userData = await this.firebase.searchUsersByEmail(user.email);
      this.userSubject.next(user);
    }
  }

  /**
   * Logs in a user with email and password.
   * @param email The user's email address.
   * @param password The user's password.
   * @returns The user credential or null if login fails.
   */
  async login(email: string, password: string): Promise<UserCredential | null> {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      this.saveCurrentUser(result.user);
      return result;
    }
    catch (error) {
      return null;
    }
  }

  /**
   * Logs out the current user and updates their state.
   */
  logout(): void {
    this.users.forEach(async (user) => {
      if (user.email === this.user.email) {
        await this.firebase.updateUserState(user, false);
        this.auth.signOut().then(() => {
            localStorage.setItem("loggedIn", "false");
          }).catch((error) => {
            localStorage.setItem("loggedIn", "false");
            
          });
        this.router.switchRoute('/');
      }
    });
  }

  /**
   * Logs out the current user by updating the local storage and navigating to the root route.
   *
   * Sets the "loggedIn" flag in local storage to "false" and redirects the user to the home page.
   */
  logoutUser(): void {
  
  }

  /**
   * Logs in a user using Google authentication.
   * @returns The authenticated user or null if login fails.
   */
  async loginWithGoogle(): Promise<User | null> {
    const userCreated = false;
    const provider = new GoogleAuthProvider();
    return this.loginWithProvider(provider, userCreated);
  }

  /**
   * Logs in a user using GitHub authentication.
   * @returns The authenticated user or null if login fails.
   */
  async loginWithGitHub(): Promise<User | null> {
    const userCreated = false;
    const provider = new GithubAuthProvider();
    return this.loginWithProvider(provider, userCreated);
  }

  /**
   * Logs in a user using the specified provider.
   * @param provider The authentication provider.
   * @param userCreated Indicates if the user was just created.
   * @returns The authenticated user or null if login fails.
   */
  async loginWithProvider(provider: any, userCreated: boolean): Promise<User | null> {
    return signInWithPopup(this.auth, provider)
      .then(async (result) => {
        this.isUserExists(result, userCreated);
        await this.saveCurrentUser({ ...result.user, provider: true });
        return result.user;
      })
      .catch((error) => {
        console.error(`Login with ${provider.providerId} failed :`, error);
        return null;
      });
  }

  /**
   * Saves the current user to the service and local storage.
   * @param user The user object to save.
   */
  async saveCurrentUser(user: any): Promise<void> {
    this.user = user;
    this.userSubject.next(this.user);
    localStorage.setItem("loggedIn", "true");
    await this.userDataService.initCurrentUser();
  }

  /**
   * Sends a password reset email to the specified address.
   * @param email The user's email address.
   * @returns A promise that resolves when the email is sent.
   */
  async resetPassword(email: string): Promise<any> {
    return sendPasswordResetEmail(this.auth, email)
      .then(() => {
        console.log('Passwort-Reset-E-Mail gesendet!');
      })
      .catch((error) => {
        console.error('Fehler beim Senden der Reset-E-Mail:', error);
        throw error;
      });
  }

  /**
   * Checks if a user exists in the users list and updates their state.
   * @param result The authentication result object.
   * @param userCreated Indicates if the user was just created.
   */
  isUserExists(result: any, userCreated: boolean): void {
    this.users.forEach((user) => {
      if (user.email === result.user.email) {
        this.firebase.updateUserState(user, true);
        userCreated = true;
      }
    });
    if (!userCreated) {
      result.user.state = true;
      this.firebase.addUser(result.user, true, true);
    }
  }

  /**
   * Registers a new user with email and password.
   * @param email The user's email address.
   * @param password The user's password.
   * @returns The created user or null if registration fails.
   */
  async register(email: string, password: string): Promise<User | null> {
    return this.createUserWithEmail(email, password)
      .catch(() => null);
  }

  /**
   * Creates a new user with email and password.
   * @param email The user's email address.
   * @param password The user's password.
   * @returns The created user.
   */
  async createUserWithEmail(email: string, password: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    let user: any = { ...result.user };
    user = this.firebase.toObj(user, false, false);
    await this.firebase.addUser(user, false);
    await this.saveCurrentUser(user);
    await this.checkAllUser(result);
    return result.user;
  }

  /**
   * Checks if the user exists in Firestore after registration.
   * @param result The authentication result object.
   * @returns A promise that resolves if the user is found.
   */
  async checkAllUser(result: any): Promise<any> {
    const allUsers = await firstValueFrom(this.firebase.getColRef('users'));
    const firestoreUser = allUsers.find(
      (u: any) => u.email === result.user.email
    );
    if (!firestoreUser) {
      throw new Error('User wurde in Firestore nicht gefunden.');
    }
  }

  /**
   * Updates the email address of the specified user.
   * @param email The new email address.
   * @param user The user object.
   */
  editEmail(email: string, user: any): void {
    updateEmail(user, email).then(() => {
      console.log("Email wurde geupdatet");
    });
  }

  /**
   * Sends an email verification to the current user.
   * @returns A promise that resolves when the email is sent.
   */
  sendEmailVerification() {
    return sendEmailVerification(this.user);
  };
}