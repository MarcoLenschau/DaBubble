import { Component, inject } from '@angular/core';
import { InputComponent } from '../shared/input/input.component';
import { RouterService } from '../core/services/router.service';
import { ButtonComponent } from '../shared/button/button.component';
import { AuthService } from '../core/services/auth.service';
import { FirebaseService } from '../core/services/firebase.service';
import { UserDataService } from '../core/services/user-data.service';
import { deleteLocalStorage } from '../core/utils/auth-utils';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, InputComponent, ButtonComponent],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  private authService = inject(AuthService);
  private firebase = inject(FirebaseService);
  private userDataService = inject(UserDataService);
  public router = inject(RouterService);
  email = "";
  password = "";
  error = false;

  constructor() {
    deleteLocalStorage();
    if (this.authService.user) {
      this.authService.logout();
    }
    setTimeout(() => {
      document.getElementById("loader")?.classList.add("d_none")
    }, 1500);
  }

  async loginWithEmail() {
    const user = await this.authService.login(this.email, this.password);
    if (user) {
      const user = await this.firebase.searchUsersByEmail(this.email);
      this.authService.userSubject.next(user[0]);
      this.router.switchRoute("message");
    } else {
      this.showErrorMessage();
    }
  }

  showErrorMessage() {
    this.error = true;
    setTimeout(() => {
      this.error = false;
    }, 5000);
  }

  async googleLogin() {
    const user = await this.authService.loginWithGoogle();
    if (user) {
      this.authService.user = this.firebase.toObj(user, true, true);
      this.router.switchRoute("message");
    } else {
      this.showErrorMessage();
    }
  }

  async loginWithGithub() {
    const user = await this.authService.loginWithGitHub();
    if (user) {
      this.authService.user = this.firebase.toObj(user, true, true);
      this.router.switchRoute("message");
    } else {
      this.showErrorMessage();
    }
  }

  gastLogin() {
    const guestUser = this.userDataService.createGuestUser('guest');
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