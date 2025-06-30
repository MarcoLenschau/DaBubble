import { Component, inject, ViewChild } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { InputComponent } from "../../shared/input/input.component";
import { ButtonComponent } from "../../shared/button/button.component";
import { EmailAuthProvider, getAuth, reauthenticateWithCredential } from '@angular/fire/auth';
import { validateEmail, validateError } from '../../core/utils/message-validate.utils';
@Component({
  selector: 'app-dialog-email-edit',
  imports: [InputComponent, ButtonComponent],
  templateUrl: './dialog-email-edit.component.html',
  styleUrl: './dialog-email-edit.component.scss'
})
export class DialogEmailEditComponent {
  @ViewChild('email') email!: any;
  private auth = inject(AuthService);
  newEmail = "";
  password = "";

  /**
   * Attempts to update the current user's email address after reauthentication.
   * Requires the user to provide their current password for verification.
   *
   * @return {void}
   */
  editEmail(): void {
    const auth = getAuth();
    if (auth.currentUser) {
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, this.password);
      reauthenticateWithCredential(auth.currentUser, credential)
      .then(() => this.auth.editEmail(this.newEmail, auth.currentUser));
    }
  }
 
  /**
   * Validates the new email address input.
   * Shows or removes error indication based on format.
   *
   * @param {any} event - The email input value to validate.
   * @return {void}
   */
  validate(event: any): void {
    validateEmail(event) ? validateError(this.email, "remove") : validateError(this.email);
  }

  /**
   * Updates internal state for email or password depending on the input type.
   *
   * @param {string} eventValue - The input value entered by the user.
   * @param {string} type - Specifies whether the value is for 'email' or 'password'.
   * @return {void}
   */
  setValue(eventValue: string, type: string): void {
    if (type === "email") {
      this.newEmail = eventValue;
    } else {
      this.password = eventValue;
    }
  }
}