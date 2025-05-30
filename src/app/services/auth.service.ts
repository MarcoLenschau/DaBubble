import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  user,
} from '@angular/fire/auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '@angular/fire/auth';
import { Observable, Subscription } from 'rxjs';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<any>;
  users: any[] = [];
  user: any = {};

  constructor(private auth: Auth, private firebase: FirebaseService) {
    this.user$ = this.firebase.getColRef('users');
    this.user$.forEach((users: any) => {
      this.users = users;
    });
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async loginWithGoogle(): Promise<User | null> {
    let userCreated = false;
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider)
      .then((result) => {
        this.isUserExists(result, userCreated);
        this.user = result.user;
        sessionStorage.setItem('currentUser', this.user.displayName);
        console.log('Login successful:', this.user);
        return result.user;
      })
      .catch((error) => {
        console.error('Login failed:', error);
        return null;
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

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<User | null> {
    try {
      const result = await this.createUserWithEmail(email, password, name);
      return result;
    } catch (error) {
      console.error('Registrierung fehlgeschlagen:', error);
      return null;
    }
  }

  // createValidUser(result: any, name: string): any { // Originalcode
  //   return { ...result.user, displayName: name };
  // }

  createValidUser(user: any, name: string): any {
    // Testcode
    return {
      uid: user.uid,
      email: user.email,
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
    // Testcode
    const result = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    result.user = this.createValidUser(result.user, name);
    await this.firebase.addUser(result.user);
    this.user = result.user;

    const currentUser = {
      id: result.user.uid,
      displayName: result.user.displayName,
      email: result.user.email,
      img: './assets/img/profilepic/default.png',
    };

    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    return result.user;
  }
}
