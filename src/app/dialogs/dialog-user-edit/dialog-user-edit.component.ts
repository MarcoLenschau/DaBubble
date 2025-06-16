import { Component, Input } from '@angular/core';
import { InputComponent } from '../../shared/input/input.component';
import { ButtonComponent } from '../../shared/button/button.component';
import { MatDialogRef } from '@angular/material/dialog';
import { FirebaseService } from '../../core/services/firebase.service';
import { UserDataService } from '../../core/services/user-data.service';

@Component({
  selector: 'app-dialog-user-edit',
  imports: [InputComponent, ButtonComponent],
  standalone: true,
  templateUrl: './dialog-user-edit.component.html',
  styleUrl: './dialog-user-edit.component.scss'
})
export class DialogUserEditComponent {
  @Input() user: any = {};

  constructor(private dialogRef: MatDialogRef<DialogUserEditComponent>, private firebase: FirebaseService, private userDataService: UserDataService) {
    console.log('DialogUserEditComponent initialized with user:', this.user);
  }

  dialogClose() {
    this.dialogRef.close();
  }

  async userSave() {

    const trimmedName = 'Fritz Fischer';
    // const trimmedName = this.user.displayName?.trim();
    // if (!trimmedName) return;

    try {
      await this.userDataService.updateUserName(this.user.id, trimmedName);

      this.dialogClose();
    } catch (err) {
      console.error('Error saving new username:', err);
    }
  }
}
