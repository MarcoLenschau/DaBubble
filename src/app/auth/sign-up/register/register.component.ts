import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
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
  user: any = {};
  error = false;

  constructor(public router: RouterService, private auth: AuthService) { }

  acceptPrivacy() {
    document.getElementById("checkbox")?.classList.toggle("checked");
  }

  registerUser() {
    this.auth.register(this.user.email, this.user.password).then(user => {
      if (user) {
        this.sendData();
      } else {
        console.log("error");
      }
    });
  }

  setValue(eventValue: string, type: string) {
    if (type === 'email') {
      this.user.email = eventValue;
    } else if (type === 'password') {
      this.user.password = eventValue;
    } else if (type === 'name') {
      this.user.displayName = eventValue;
    }
  }

  sendData() {
    this.dataReady.emit(true);
    this.userData.emit(this.user);
  }

  validate(event: any, type: string) {
    if (type === 'name') {
      event.length === 0 ? validateError(this.name) : validateError(this.name, "remove");
    }else if (type === 'email') { 
      validateEmail(event) ? validateError(this.email, "remove") : validateError(this.email);
    } else if (type === 'password') {
      this.validatePassword(event);
    }
  }
  
  validatePassword(event: any) {
    event.length < 6 ? validateError(this.password) : validateError(this.password, "remove");
  }
}