import { Component, Input } from '@angular/core';
import { InputComponent } from '../../shared/input/input.component';
import { ButtonComponent } from '../../shared/button/button.component';
import { MatDialogRef } from '@angular/material/dialog';
import { FirebaseService } from '../../core/services/firebase.service';
import { UserDataService } from '../../core/services/user-data.service';
import { firstValueFrom, filter } from 'rxjs';

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
    console.log('user: ', this.user);

    const trimmedName = this.user.displayName?.trim();
    if (!trimmedName) return;

    try {
      const currentUser = await firstValueFrom(
        this.userDataService.currentUser$.pipe(
          filter(user => !!user && user.id !== 'default')
        )
      );
      // await this.userDataService.updateUserName(this.user.id, trimmedName);
      if (trimmedName !== currentUser.displayName) {
        await this.userDataService.updateUserName(currentUser.id, trimmedName);

        const updatedUser = await firstValueFrom(this.userDataService.currentUser$); // löschen
        console.log('src/app/dialogs/dialog-user-edit/dialog-user-edit.component.ts: updatedUser: ', updatedUser);
      }
      console.log('src/app/dialogs/dialog-user-edit/dialog-user-edit.component.ts:user: ', this.user);
      console.log('src/app/dialogs/dialog-user-edit/dialog-user-edit.component.ts: Former currentUser: ', currentUser);

      this.dialogClose();
    } catch (err) {
      console.error('Error saving new username:', err);
    }
  }
}
