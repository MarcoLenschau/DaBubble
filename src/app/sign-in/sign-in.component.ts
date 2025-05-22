import { Component } from '@angular/core';
import { InputComponent } from '../shared/input/input.component';
import { RouterService } from '../services/router.service';
import { ButtonComponent } from '../shared/button/button.component';

@Component({
  selector: 'app-sign-in',
  imports: [InputComponent, ButtonComponent],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {

  constructor(public router: RouterService) {}

  userLogIn() {}
}
