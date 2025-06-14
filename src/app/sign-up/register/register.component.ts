import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { InputComponent } from '../../shared/input/input.component';
import { RouterService } from '../../core/services/router.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [CommonModule, InputComponent, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  @ViewChild('name', { static: true }) name!: any;
  @ViewChild('email', { static: true }) email!: any;
  @ViewChild('password', { static: true }) password!: any;
  @Output() dataReady = new EventEmitter<boolean>();
  @Output() userData = new EventEmitter<any>();
  user = {
    displayName: '',
    email: '',
    password: ''
  };
  error = false;

  constructor(public router: RouterService, private auth: AuthService) { }

  acceptPrivacy() {
    document.getElementById("checkbox")?.classList.toggle("checked");
  }

  registerUser() {
    this.sendData();
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
      event.length === 0 ? this.validateError(this.name) : this.validateError(this.name, "remove");
    }else if (type === 'email') { 
      this.auth.validateEmail(event) ? this.validateError(this.email, "remove") : this.validateError(this.email);
    } else if (type === 'password') {
      this.validatePassword(event);
    }
  }

  validateError(element: any, action = "add") {
    if (action === "add") {
      element.inputRef.nativeElement.classList.add('error');
    } else {
      element.inputRef.nativeElement.classList.remove('error');
    }      
  }
  
  validatePassword(event: any) {
    event.length < 6 ? this.validateError(this.password) : this.validateError(this.password, "remove");
  }
}