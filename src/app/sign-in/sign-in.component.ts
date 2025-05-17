import { Component } from '@angular/core';
import { InputComponent } from '../input/input.component';
import { RouterService } from '../services/router.service';

@Component({
  selector: 'app-sign-in',
  imports: [InputComponent],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {

  constructor(public router: RouterService) {}
}
