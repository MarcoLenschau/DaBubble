import { Component, Input } from '@angular/core';
import { InputComponent } from '../../shared/input/input.component';
import { ButtonComponent } from '../../shared/button/button.component';
import { MatDialogRef } from '@angular/material/dialog';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-dialog-user-edit',
  imports: [InputComponent, ButtonComponent],
  standalone: true,
  templateUrl: './dialog-user-edit.component.html',
  styleUrl: './dialog-user-edit.component.scss'
})
export class DialogUserEditComponent {
  @Input() user: any = {};

  constructor(private dialogRef: MatDialogRef<DialogUserEditComponent>, private firebase: FirebaseService) {
    console.log('DialogUserEditComponent initialized with user:', this.user);
  }

  dialogClose() {
    this.dialogRef.close();
  }

  userSave() {}
}
