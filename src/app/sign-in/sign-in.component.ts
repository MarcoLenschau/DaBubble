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
  email = "";
  password = "";

  constructor(public router: RouterService, private authService: AuthService, private firebase: FirebaseService) {}

  async loginWithEmail() {
    const user = await this.authService.login(this.email, this.password);;
    if (user) {
      let user = await this.firebase.searchUsersByEmail(this.email);
      this.authService.userSubject.next(user[0]);
      console.log(this.authService.user)
      this.router.switchRoute("message");
    }
  }

  async googleLogin() {
    const user = await this.authService.loginWithGoogle();
    if (user) {
      this.authService.user = this.firebase.toObj(user);
      this.router.switchRoute("message");
    }
  }

  gastLogin() {
    this.authService.userSubject.next({
        displayName: "Gast",
        photoURL: "/assets/img/profilepic/frederik.png"
    });
  }

  setValue(eventValue: string, type: string){
    if (type === 'email') {
      this.email = eventValue;  
    } else if (type === 'password') {
      this.password = eventValue;  
    }
  }
}
