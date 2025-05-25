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
    email: '',
    password: ''
  }

  constructor(public router: RouterService, private auth: AuthService) {}

  acceptPrivacy() {
    document.getElementById("checkbox")?.classList.toggle("checked");
  }

  registerUser() {
    console.log('E-Mail:', this.user.email);
    console.log('Passwort:', this.user.password);
  }

  onValueChanged(newValue: string) {
    console.log('Wert vom Kind:', newValue);
  // Hier kannst du die value z.B. in eine Variable speichern
  }
}
