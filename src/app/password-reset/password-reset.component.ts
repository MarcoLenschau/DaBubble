import { Component, ViewChild } from '@angular/core';
import { InputComponent } from '../shared/input/input.component';
import { ButtonComponent } from '../shared/button/button.component';
import { AuthService } from '../core/services/auth.service';
import { CommonModule } from '@angular/common';

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

  constructor(private auth: AuthService) {}
  
  async resetPassword() {
    await this.auth.resetPassword(this.email)
      .then(() =>{
        this.emailMessageShow("Die E-Mail wurde gesendet prüffen sie auch ihren Spam Ordner.");
      })
      .catch(error => {
        this.emailMessageShow(error);
      });
  }

  emailMessageShow(value: string) {
    this.emailSend = true;
    setTimeout(() => {
      this.emailSend = false;
    }, 10000);
    this.emailMessage = value;
  }

  setValue(eventValue: string){
    this.email = eventValue;
  }

  validate(event: any) {
    this.auth.validateEmail(event) ? this.auth.validateError(this.emailRef, "remove") : this.auth.validateError(this.emailRef);
  }
}