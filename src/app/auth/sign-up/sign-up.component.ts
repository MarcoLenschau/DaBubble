import { Component, inject } from '@angular/core';
import { RegisterComponent } from "./register/register.component";
import { UserPictureComponent } from "./user-picture/user-picture.component";
import { CommonModule } from '@angular/common';
import { deleteLocalStorage } from '../../core/utils/auth-utils';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, RegisterComponent, UserPictureComponent],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  private authService = inject(AuthService);
  dataReady = false;
  user: any = {};

  constructor() {
    deleteLocalStorage();
    if (this.authService.user) {
      this.authService.logout();
    }
  }

  loadData(data: boolean) {
    this.dataReady = data;
  }

  loadUserData(user: any) {
    this.user = user;
  }
}