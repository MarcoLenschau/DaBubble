import { Component, inject } from '@angular/core';
import { InputComponent } from '../../shared/input/input.component';
import { RouterService } from '../../core/services/router.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { AuthService } from '../../core/services/auth.service';
import { FirebaseService } from '../../core/services/firebase.service';
import { UserDataService } from '../../core/services/user-data.service';
import { deleteLocalStorage } from '../../core/utils/auth.utils';
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


  /**
   * Constructor for initializing the login component.
   * Clears local storage and logs out the current user if one is logged in.
   * Hides the loading screen after 1.5 seconds.
   */
  constructor() {
    deleteLocalStorage();
    if (this.authService.user) {
      this.authService.logout();
    }
    setTimeout(() => {
      document.getElementById("loader")?.classList.add("d_none");
    }, 1500);
  }

  /**
   * Logs in a user using email and password credentials.
   * If successful, fetches user data from Firebase and navigates to the message page.
   * Otherwise, displays an error message.
   *
   * @return {Promise<void>} A promise that resolves when the login process completes.
   */
  async loginWithEmail(): Promise<void> {
    const user = await this.authService.login(this.email, this.password);
    if (user) {
      const user = await this.firebase.searchUsersByEmail(this.email);
      this.authService.userSubject.next(user[0]);
      this.router.switchRoute("message");
    } else {
      this.showErrorMessage();
    }
  }

  /**
   * Displays an error message for a short duration.
   *
   * @return {void}
   */
  showErrorMessage(): void {
    this.error = true;
    setTimeout(() => {
      this.error = false;
    }, 5000);
  }

  /**
   * Logs in a user using Google authentication.
   * If successful, converts the user object and navigates to the message page.
   * Otherwise, displays an error message.
   *
   * @return {Promise<void>} A promise that resolves when the login process completes.
   */
  async googleLogin(): Promise<void> {
    const user = await this.authService.loginWithGoogle();
    if (user) {
      this.authService.user = this.firebase.toObj(user, true, true);
      this.router.switchRoute("message");
    } else {
      this.showErrorMessage();
    }
  }

  /**
   * Logs in a user using GitHub authentication.
   * If successful, converts the user object and navigates to the message page.
   * Otherwise, displays an error message.
   *
   * @return {Promise<void>} A promise that resolves when the login process completes.
   */
  async loginWithGithub(): Promise<void> {
    const user = await this.authService.loginWithGitHub();
    if (user) {
      this.authService.user = this.firebase.toObj(user, true, true);
      this.router.switchRoute("message");
    } else {
      this.showErrorMessage();
    }
  }

  /**
   * Logs in as a guest user.
   * Creates a guest user object, sets its state, updates the auth subject, and stores login state in localStorage.
   *
   * @return {void}
   */
  gastLogin(): void {
    const guestUser = this.userDataService.createGuestUser('guest');
    guestUser.state = true;
    this.authService.userSubject.next(guestUser);
    localStorage.setItem("loggedIn", "true");
  }

  /**
   * Sets the value of email or password based on the input type.
   *
   * @param {string} eventValue - The value from the input field.
   * @param {string} type - The type of the field ('email' or 'password').
   * @return {void}
   */
  setValue(eventValue: string, type: string): void {
    if (type === 'email') {
      this.email = eventValue;
    } else if (type === 'password') {
      this.password = eventValue;
    }
  }
}