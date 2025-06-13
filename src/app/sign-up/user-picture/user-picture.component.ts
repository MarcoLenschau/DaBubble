import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../shared/button/button.component';
import { AuthService } from '../../core/services/auth.service';
import { RouterService } from '../../core/services/router.service';

@Component({
  selector: 'app-user-picture',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './user-picture.component.html',
  styleUrl: './user-picture.component.scss'
})
export class UserPictureComponent {
  @Input() user: any = {};
  @Output() dataReady = new EventEmitter<boolean>();
  currentProfilePicutre = "profile.svg"; 
  profilePicture = [
    "elias",
    "elise",
    "frederik",
    "noah",
    "sofia",
    "steffen"
  ];

  constructor(private auth: AuthService, private router: RouterService) { }

  registerUser() {
    const filename = "./assets/img/profilepic/" + this.currentProfilePicutre;
    this.auth.register(this.user.displayName, this.user.email, this.user.password, filename).then(user => {
      if (user) {
        this.router.switchRoute("message");
      } else {
        this.sendData();
      }
    });
  }

  selectPicture(picture: any) {
    this.currentProfilePicutre = picture;
  }

  sendData() {
    this.dataReady.emit(false);
  }
}
