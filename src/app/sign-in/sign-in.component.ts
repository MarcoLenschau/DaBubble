import { Component } from '@angular/core';
import { InputComponent } from '../shared/input/input.component';
import { RouterService } from '../services/router.service';
import { ButtonComponent } from '../shared/button/button.component';
import { AuthService } from '../services/auth.service';
import { HeaderComponent } from '../shared/header/header.component';
import { FirebaseService } from '../services/firebase.service';

@Component({
  selector: 'app-sign-in',
  imports: [InputComponent, ButtonComponent],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {

  constructor(public router: RouterService, private authService: AuthService, private firebase: FirebaseService) {}

  async googleLogin() {
    const user = await this.authService.loginWithGoogle();
    if (user) {
      this.authService.user = this.firebase.toObj(user);
      this.router.switchRoute("message");
    }
  }
}
