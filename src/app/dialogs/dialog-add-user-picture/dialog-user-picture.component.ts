import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ButtonComponent } from '../../shared/button/button.component';

@Component({
  selector: 'app-dialog-add-user-picture',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './dialog-user-picture.component.html',
  styleUrl: './dialog-user-picture.component.scss'
})
export class DialogUserPictureComponent {
  @Input() username = "";

  profilePicture = [
    "elias", 
    "elise", 
    "frederik", 
    "noah", 
    "sofia", 
    "steffen"
  ];
}
