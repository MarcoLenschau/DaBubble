import { Component, Input } from '@angular/core';
import { InputComponent } from '../shared/input/input.component';
import { RouterService } from '../services/router.service';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sign-up',
  imports: [InputComponent, FormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  user = {
    displayName: '',
    email: '',
    password: ''
  }

  constructor(public router: RouterService, private auth: AuthService) {}

  acceptPrivacy() {
    document.getElementById("checkbox")?.classList.toggle("checked");
  }

  registerUser() {
    this.auth.register(this.user.displayName, this.user.email, this.user.password);
  }

  setValue(eventValue: string, type: string){
    if (type === 'email') {
      this.user.email = eventValue;  
    } else if (type === 'password') {
      this.user.password = eventValue;  
    } else if (type === 'name') {
      this.user.displayName = eventValue;  
    }
  }
}
