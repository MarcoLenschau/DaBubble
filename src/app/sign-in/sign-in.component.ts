import { Component, inject } from '@angular/core';
import { InputComponent } from '../shared/input/input.component';
import { RouterService } from '../services/router.service';
import { ButtonComponent } from '../shared/button/button.component';
import { AuthService } from '../services/auth.service';
import { FirebaseService } from '../services/firebase.service';
import { UserDataService } from '../services/user-data.service';
import { deleteLocalStorage } from '../utils/auth-utils'; 

@Component({
  selector: 'app-sign-in',
  imports: [InputComponent, ButtonComponent],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  private authService = inject(AuthService);
  private firebase = inject(FirebaseService);
  private userDataService = inject(UserDataService)
  public router = inject(RouterService);
  email = "";
  password = "";

  constructor() { 
    deleteLocalStorage();
    if (this.authService.user) {
      this.authService.logout();
    }
  }

  async loginWithEmail() {
    const user = await this.authService.login(this.email, this.password);;
    if (user) {
      let user = await this.firebase.searchUsersByEmail(this.email);
      this.authService.userSubject.next(user[0]);
      this.router.switchRoute("message");
    }
  }

  async googleLogin() {
    const user = await this.authService.loginWithGoogle();
    if (user) {
      this.authService.user = this.firebase.toObj(user);
      this.router.switchRoute("message");
    }
  }

  async loginWithGithub() {
    const user = await this.authService.loginWithGitHub();
    if (user) {
      this.authService.user = this.firebase.toObj(user);
      console.log(this.authService.user)
      this.router.switchRoute("message");
    }
  }

  gastLogin() {
    const guestUser = this.userDataService.createGuestUser();
    guestUser.state = true;
    this.authService.userSubject.next(guestUser);
    localStorage.setItem("loggedIn", "true");
  }

  setValue(eventValue: string, type: string) {
    if (type === 'email') {
      this.email = eventValue;
    } else if (type === 'password') {
      this.password = eventValue;
    }
  }
}