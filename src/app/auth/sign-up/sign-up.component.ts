import { Component, inject } from '@angular/core';
import { RegisterComponent } from "./register/register.component";
import { UserPictureComponent } from "./user-picture/user-picture.component";
import { CommonModule } from '@angular/common';
import { deleteLocalStorage } from '../../core/utils/auth.utils';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, RegisterComponent, UserPictureComponent],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  private authService = inject(AuthService);
  dataReady = false;
  user: any = {};

  /**
   * Constructor for initializing the component.
   * Clears local storage and logs out the current user if one is logged in.
   */
  constructor() {
    deleteLocalStorage();
    if (this.authService.user) {
      this.authService.logout();
    }
  }

  /**
   * Sets the internal state flag indicating whether the data is ready.
   *
   * @param {boolean} data - Indicates if the data is ready.
   * @return {void} This function does not return a value.
   */  
  loadData(data: boolean): void {
    this.dataReady = data;
  }

  /**
   * Loads the user data into the component.
   *
   * @param {any} user - The user object to load.
   * @return {void} This function does not return a value.
   */
  loadUserData(user: any): void {
    this.user = user;
  }
}