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
  @ViewChild('emailRef', {static: true}) emailRef!: any;
  email = "";
  emailSend = false;
  emailMessage = "";

  constructor(private auth: AuthService) {}
  
  async resetPassword() {
    await this.auth.resetPassword(this.email)
      .then(() =>{
        this.emailMessageShow();
        this.emailMessage = "Die E-Mail wurde gesendet prüffen sie auch ihren Spam Ordner.";
      })
      .catch(error => {
        this.emailMessageShow();
        this.emailMessage = error;
      });
  }

  emailMessageShow() {
    this.emailSend = true;
    setTimeout(() => {
      this.emailSend = false;
    }, 10000);
  }

  setValue(eventValue: string){
    this.email = eventValue;
  }

  validate(event: any) {
    if (this.auth.validateEmail(event)) {
      this.emailRef.inputRef.nativeElement.classList.remove('error');
    } else {
      this.emailRef.inputRef.nativeElement.classList.add('error');
    }
  }
}
