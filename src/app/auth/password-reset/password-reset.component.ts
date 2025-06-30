import { Component, inject, ViewChild } from '@angular/core';
import { InputComponent } from '../../shared/input/input.component';
import { ButtonComponent } from '../../shared/button/button.component';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { validateEmail, validateError } from '../../core/utils/message-validate.utils';

@Component({
  selector: 'app-password-reset',
  imports: [CommonModule, InputComponent, ButtonComponent],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss'
})
export class PasswordResetComponent {
  @ViewChild('emailRef') emailRef!: any;
  email = "";
  emailSend = false;
  emailMessage = "";
  private auth = inject(AuthService);
  
  /**
   * Sends a password reset email to the provided email address.
   * On success, a confirmation message is shown.
   * On failure, the error message is shown.
   *
   * @return {Promise<void>} A promise that resolves when the process completes.
   */
  async resetPassword(): Promise<void> {
    await this.auth.resetPassword(this.email)
      .then(() =>{
        this.emailMessageShow("Die E-Mail wurde gesendet prüffen sie auch ihren Spam Ordner.");
      })
      .catch(error => {
        this.emailMessageShow(error);
      });
  }

  /**
   * Displays a message to the user for 10 seconds, usually after sending the reset email.
   *
   * @param {string} value - The message to be shown to the user.
   * @return {void}
   */
  emailMessageShow(value: string): void {
    this.emailSend = true;
    setTimeout(() => {
      this.emailSend = false;
    }, 10000);
    this.emailMessage = value;
  }

  /**
   * Sets the internal email value from input.
   *
   * @param {string} eventValue - The value entered by the user.
   * @return {void}
   */
  setValue(eventValue: string): void {
    this.email = eventValue;
  }

  /**
   * Validates the email format.
   * If invalid, triggers a visual validation error.
   *
   * @param {any} event - The current value to validate (usually the email string).
   * @return {void}
   */
  validate(event: any): void {
    validateEmail(event) ? validateError(this.emailRef, "remove") : validateError(this.emailRef);
  }
}