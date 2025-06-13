import { inject, Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, User, GithubAuthProvider, sendPasswordResetEmail, UserCredential } from '@angular/fire/auth';
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
  private userDataService = inject(UserDataService);
  private router = inject(RouterService);
  userSubject = new BehaviorSubject<any>({});
  user$ = this.userSubject.asObservable();
  users$: Observable<any>;
  users: any[] = [];
  user: any = {};

  constructor() {
    this.users$ = this.firebase.getColRef('users');
    this.users$.forEach((users: any) => {

      // Mehrfache Subscriptions auf denselben Stream?

      this.users = users;
    });
    this.restoreAuthState();
  }

  private async restoreAuthState(): Promise<void> {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.user = user;
        this.userSubject.next(user);
        await this.userDataService.initCurrentUser();
      } else {
        this.userSubject.next(null);
      }
    });
  }

  async login(email: string, password: string): Promise<UserCredential | null> {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      this.saveCurrentUser(result);
      return result;
    }
    catch (error) {
      return null;
    }
  }

  logout() {
    this.users.forEach(async (user) => {
      if (user.email === this.user.email) {
        await this.firebase.updateUserState(user, false);
        this.auth.signOut()
          .then(() => {
            localStorage.setItem("loggedIn", "false");
            this.router.switchRoute('/');
          })
          .catch((error) => {
            console.error('Logout-Fehler:', error);
          });
      }
    });
  }

  async loginWithGoogle(): Promise<User | null> {
    const userCreated = false;
    const provider = new GoogleAuthProvider();
    return this.loginWithProvider(provider, userCreated);
  }

  async loginWithGitHub(): Promise<User | null> {
    const userCreated = false;
    const provider = new GithubAuthProvider();
    return this.loginWithProvider(provider, userCreated);
  }

  async loginWithProvider(provider: any, userCreated: boolean): Promise<User | null> {
    return signInWithPopup(this.auth, provider)
      .then(async (result) => {
        this.isUserExists(result, userCreated);
        await this.saveCurrentUser(result);
        return result.user;
      })
      .catch((error) => {
        console.error(`Login with ${provider.providerId} failed :`, error);
        return null;
      });
  }

  async saveCurrentUser(result: any, photoURL = ""): Promise<void> {
    this.user = result.user;
    if (photoURL) { this.user.photoURL = photoURL; }
    this.userSubject.next(this.user);
    localStorage.setItem("loggedIn", "true");
    await this.userDataService.initCurrentUser();
  }

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

  isUserExists(result: any, userCreated: boolean): void {
    this.users.forEach((user) => {
      if (user.email === result.user.email) {
        this.firebase.updateUserState(user, true);
        userCreated = true;
      }
    });
    if (!userCreated) {
      result.user.state = true;
      this.firebase.addUser(result.user);
    }
  }

  async register(name: string, email: string, password: string): Promise<User | null> {
    return this.createUserWithEmail(email, password, name)
      .catch(() => null);
  }

  createValidUser(user: any, name: string): any {
    return {
      uid: user.uid,
      email: user.email,
      photoURL: user.photoURL,
      displayName: name,
      state: true,
      stsTokenManager: user.stsTokenManager ?? null,
    };
  }

  async createUserWithEmail(email: string, password: string, name: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    result.user = this.createValidUser(result.user, name);
    await this.firebase.addUser(result.user);
    await this.saveCurrentUser(result, "./assets/img/profilepic/frederik.png");
    await this.checkAllUser(result);
    return result.user;
  }

  async checkAllUser(result: any): Promise<any> {
    const allUsers = await firstValueFrom(this.firebase.getColRef('users'));
    const firestoreUser = allUsers.find(
      (u: any) => u.email === result.user.email
    );
    if (!firestoreUser) {
      throw new Error('User wurde in Firestore nicht gefunden.');
    }
  }
}