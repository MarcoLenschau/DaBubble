import { Component } from '@angular/core';
import { InputComponent } from '../input/input.component';
import { RouterService } from '../services/router.service';

@Component({
  selector: 'app-sign-up',
  imports: [InputComponent],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  constructor(public router: RouterService) {}

  acceptPrivacy() {
    document.getElementById("checkbox")?.classList.toggle("checked");
  }
}
