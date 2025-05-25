import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, User, user } from '@angular/fire/auth';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Observable, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<any>;
  userSubscription: Subscription;

  constructor(private auth: Auth) { 
    this.user$ = user(this.auth);
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
     console.log(aUser);
    })
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async loginWithGoogle(): Promise<User | null> {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider)
      .then(result => result.user)
      .catch(error => {
        console.error('Login failed:', error);
        return null;
      });
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  async register(email: string, password: string): Promise<User | null> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Registrierung fehlgeschlagen:', error);
      return null;
    }
  }
}
