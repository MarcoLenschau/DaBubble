import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, User, user, GithubAuthProvider, sendPasswordResetEmail } from '@angular/fire/auth';
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

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    this.auth.signOut().then(() => {
      this.router.switchRoute('/');
    }).catch((error) => {
      console.error('Logout-Fehler:', error);
    });  
  }

  async loginWithGoogle(): Promise<User | null> {
    let userCreated = false;
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider)
      .then((result) => {
        this.isUserExists(result, userCreated);
        this.user = result.user;
        this.userSubject.next(this.user);
        return result.user;
      })
      .catch((error) => {
        console.error('Login failed:', error);
        return null;
      });
  }
  
  async loginWithGitHub() {
    let userCreated = false;
    const provider = new GithubAuthProvider();
    return signInWithPopup(this.auth, provider)
      .then((result) => {
        this.isUserExists(result, userCreated);
        this.user = result.user;
        this.userSubject.next(this.user);
        return result.user;
      })
      .catch((error) => {
        console.error('Login failed:', error);
        return null;
      });
  }
  
  resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email)
      .then(() => {
        console.log('Passwort-Reset-E-Mail gesendet!');
      })
      .catch((error) => {
        console.error('Fehler beim Senden der Reset-E-Mail:', error);
        throw error;
      });
  }  
  
  isUserExists(result: any, userCreated: boolean) {
    this.users.forEach((user) => {
      if (user.email === result.user.email) {
        userCreated = true;
      }
    });
    if (!userCreated) {
      this.firebase.addUser(result.user);
    }
  }

  async register( name: string, email: string, password: string ): Promise<User | null> {
    try {
      const result = await this.createUserWithEmail(email, password, name);
      return result;
    } catch (error) {
      console.error('Registrierung fehlgeschlagen:', error);
      return null;
    }
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

  // async createUserWithEmail(email: string, password: string, name: string) { //Originalcode
  //   const result = await createUserWithEmailAndPassword(
  //     this.auth,
  //     email,
  //     password
  //   );
  //   result.user = this.createValidUser(result.user, name);
  //   this.firebase.addUser(result.user);
  //       this.user = result.user;
  //   sessionStorage.setItem("currentUser", this.user.dispayName);
  //   return result.user;
  // }

  async createUserWithEmail(email: string, password: string, name: string) {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    result.user = this.createValidUser(result.user, name);
    await this.firebase.addUser(result.user);
    this.user = result.user;
    this.user.photoURL = "./assets/img/profilepic/frederik.png"
    this.userSubject.next(this.user);
    const allUsers = await firstValueFrom(this.firebase.getColRef('users'));
    const firestoreUser = allUsers.find( // besser: mit Abfrage suchen
      (u: any) => u.email === result.user.email
    );

    if (!firestoreUser) {
      throw new Error('User wurde in Firestore nicht gefunden.');
    }
    return result.user;
  }
}
