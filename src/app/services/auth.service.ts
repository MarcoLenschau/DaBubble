import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, User, user, GithubAuthProvider, sendPasswordResetEmail, UserCredential } from '@angular/fire/auth';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Observable, Subscription, firstValueFrom , BehaviorSubject} from 'rxjs';
import { FirebaseService } from './firebase.service';
import { RouterService } from './router.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userSubject = new BehaviorSubject<any>({});
  user$ = this.userSubject.asObservable();
  users$: Observable<any>;
  users: any[] = [];
  user: any = {};

  constructor(private auth: Auth, private firebase: FirebaseService, private router: RouterService) {
    this.users$ = this.firebase.getColRef('users');
    this.users$.forEach((users: any) => {
      this.users = users;
    });
  }

  login(email: string, password: string): Promise<UserCredential | null> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout(): void {
    this.auth.signOut()
      .then(() => {
        this.router.switchRoute('/');
      })
      .catch((error) => {
        console.error('Logout-Fehler:', error);
      });  
  }

  async loginWithGoogle(): Promise<User | null> {
    let userCreated = false;
    const provider = new GoogleAuthProvider();
    return this.loginWithProvider(provider, userCreated)
  }
  
  async loginWithGitHub(): Promise<User | null> {
    let userCreated = false;
    const provider = new GithubAuthProvider();
    return this.loginWithProvider(provider, userCreated);
  }
  
  async loginWithProvider(provider: any, userCreated: boolean): Promise<User | null> {
    return signInWithPopup(this.auth, provider)
      .then((result) => {
        this.isUserExists(result, userCreated);
        this.saveCurrentUser(result);
        return result.user;
      })
      .catch((error) => {
        console.error(`Login with ${provider.providerId} failed :`, error);
        return null;
      });
  }

  saveCurrentUser(result: any, photoURL = ""): void {
    this.user = result.user;
    if (photoURL) { this.user.photoURL = photoURL }
    this.userSubject.next(this.user);
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
        userCreated = true;
      }
    });
    if (!userCreated) {
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
      stsTokenManager: user.stsTokenManager ?? null,
    };
  }

  async createUserWithEmail(email: string, password: string, name: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    result.user = this.createValidUser(result.user, name);
    await this.firebase.addUser(result.user);
    this.saveCurrentUser(result, "./assets/img/profilepic/frederik.png");
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