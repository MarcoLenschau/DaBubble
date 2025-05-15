import { Component, inject } from '@angular/core';
import { InputComponent } from '../input/input.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  imports: [InputComponent],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
 router = inject(Router);

 goToMain(){
  this.router.navigate(['/message']);
 }
}
