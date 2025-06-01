import { Component } from '@angular/core';
import { InputComponent } from '../shared/input/input.component';
import { ButtonComponent } from '../shared/button/button.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-password-reset',
  imports: [InputComponent, ButtonComponent],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss'
})
export class PasswordResetComponent {
  email = "";
  
  constructor(private auth: AuthService) {}
  
  resetPassword() {
    this.auth.resetPassword(this.email);
  }

  setValue(eventValue: string){
    this.email = eventValue;
  }
}
