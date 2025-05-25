import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, User, user } from '@angular/fire/auth';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Observable, Subscription } from 'rxjs';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<any>;
  users: any[] = [];

  constructor(private auth: Auth, private firebase: FirebaseService) {
    this.user$ = this.firebase.getColRef("users"); 
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
    .then(result => {
      this.isUserExists(result, userCreated);
      return result.user
    })
    .catch(error => {
        console.error('Login failed:', error);
        return null;
    });
  }

  isUserExists(result: any, userCreated: boolean) {
    this.users.forEach(user => {
      if (user.email === result.user.email) {
        userCreated = true;
      }       
    });
    if (!userCreated) {
      this.firebase.addUser(result.user);
    }
  }

  async register(name: string, email: string, password: string): Promise<User | null> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Registrierung fehlgeschlagen:', error);
      return null;
    }
  }
}
