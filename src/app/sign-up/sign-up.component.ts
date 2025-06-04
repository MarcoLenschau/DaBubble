import { Component } from '@angular/core';
import { RegisterComponent } from "./register/register.component";
import { UserPictureComponent } from "./user-picture/user-picture.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, RegisterComponent, UserPictureComponent],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  dataReady = false;
  user: any = {};

  loadData(data: boolean) {
    this.dataReady = data;
  }

  loadUserData(user: any) {
    this.user = user;
  }
}