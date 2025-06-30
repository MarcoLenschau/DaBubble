import { Component, EventEmitter, inject, Output, ViewChild } from '@angular/core';
import { InputComponent } from '../../../shared/input/input.component';
import { RouterService } from '../../../core/services/router.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { validateEmail, validateError } from '../../../core/utils/message-validate.utils';

@Component({
  selector: 'app-register',
  imports: [CommonModule, InputComponent, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  @ViewChild('name') name!: any;
  @ViewChild('email') email!: any;
  @ViewChild('password') password!: any;
  @Output() dataReady = new EventEmitter<boolean>();
  @Output() userData = new EventEmitter<any>();
  public router = inject(RouterService);
  private auth = inject(AuthService);
  user: any = {};
  error = false;

  /**
   * Toggles the "checked" class on the privacy checkbox element.
   *
   * @return {void} This function does not return a value.
   */
  acceptPrivacy(): void {
    document.getElementById("checkbox")?.classList.toggle("checked");
  }

  /**
   * Registers a new user using the provided email and password.
   * On success, it sends the user data; otherwise, logs an error.
   *
   * @return {void} This function does not return a value.
   */
  registerUser(): void {
    this.auth.register(this.user.email, this.user.password).then(user => {
      if (user) {
        this.sendData();
      } 
    });
  }

  /**
   * Updates a property of the user object based on the input type.
   *
   * @param {string} eventValue - The input value from the event.
   * @param {string} type - The type of input ('email', 'password', or 'name').
   * @return {void} This function does not return a value.
   */
  setValue(eventValue: string, type: string): void {
    if (type === 'email') {
      this.user.email = eventValue;
    } else if (type === 'password') {
      this.user.password = eventValue;
    } else if (type === 'name') {
      this.user.displayName = eventValue;
    }
  }

  /**
   * Emits the current user data and a readiness flag.
   *
   * @return {void} This function does not return a value.
   */
  sendData(): void {
    this.dataReady.emit(true);
    this.userData.emit(this.user);
  }

  /**
  * Validates user input based on the given type.
  *
  * @param {any} event - The input value to validate.
  * @param {string} type - The input type ('name', 'email', or 'password').
  * @return {void} This function does not return a value.
   */ 
  validate(event: any, type: string): void {
    if (type === 'name') {
      event.length === 0 ? validateError(this.name) : validateError(this.name, "remove");
    }else if (type === 'email') { 
      validateEmail(event) ? validateError(this.email, "remove") : validateError(this.email);
    } else if (type === 'password') {
      this.validatePassword(event);
    }
  }

  /**
   * Validates the password input by checking for minimum length.
   *
   * @param {any} event - The password string to validate.
   * @return {void} This function does not return a value.
   */
  validatePassword(event: any): void {
    event.length < 6 ? validateError(this.password) : validateError(this.password, "remove");
  }
}