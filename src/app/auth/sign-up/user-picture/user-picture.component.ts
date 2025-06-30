import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../shared/button/button.component';
import { AuthService } from '../../../core/services/auth.service';
import { RouterService } from '../../../core/services/router.service';
import { FirebaseService } from '../../../core/services/firebase.service';

@Component({
  selector: 'app-user-picture',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './user-picture.component.html',
  styleUrl: './user-picture.component.scss'
})
export class UserPictureComponent {
  @Input() user: any = {};
  @Output() dataReady = new EventEmitter<boolean>();
  currentProfilePicutre = "profile.svg"; 
  profilePicture = [ "elias", "elise", "frederik", "noah", "sofia", "steffen" ];
  private firebase = inject(FirebaseService);
  private router = inject(RouterService);

  /**
   * Registers the user by updating their profile with the selected picture.
   * Searches the user by email, then updates their information in Firebase.
   * On success, navigates to the main page. Logs an error on failure.
   *
   * @return {Promise<void>} A promise that resolves when the user registration process is complete.
   */
  async registerUser(): Promise<void> {
    this.user.photoURL = "./assets/img/profilepic/" + this.currentProfilePicutre;
    const user = await this.firebase.searchUsersByEmail(this.user.email);
    this.firebase.updateUser(user[0].id, this.user)
    .then(() => {
      this.router.switchRoute("");
    });
  }

  /**
   * Sets the selected profile picture for the user.
   *
   * @param {any} picture - The selected profile picture filename or object.
   * @return {void} This function does not return a value.
   */
  selectPicture(picture: any): void  {
    this.currentProfilePicutre = picture;
  }

  /**
   * Emits a signal indicating that the data is not ready (false).
   *
   * @return {void} This function does not return a value.
   */
  sendData(): void {
    this.dataReady.emit(false);
  }
}