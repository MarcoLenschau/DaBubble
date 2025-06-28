import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../shared/button/button.component';
import { AuthService } from '../../../core/services/auth.service';
import { RouterService } from '../../../core/services/router.service';
import { FirebaseService } from '../../../core/services/firebase.service';

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
  profilePicture = [ "elias", "elise", "frederik", "noah", "sofia", "steffen" ];
  private firebase = inject(FirebaseService);
  private router = inject(RouterService);


  async registerUser() {
    this.user.photoURL = "./assets/img/profilepic/" + this.currentProfilePicutre;
    const user: any = await this.firebase.searchUsersByEmail(this.user.email);
    this.firebase.updateUser(user.id, this.user).then(() => {
      this.router.switchRoute("");
    }); 
  }

  selectPicture(picture: any) {
    this.currentProfilePicutre = picture;
  }

  sendData() {
    this.dataReady.emit(false);
  }
}