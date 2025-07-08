import { Component, inject, Input, ViewChild } from '@angular/core';
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
  @ViewChild('input') input!: InputComponent;
  @Input() user: any = {};
  private dialogRef = inject(MatDialogRef<DialogUserEditComponent>);
  private userDataService = inject(UserDataService);
  
  /**
   * Closes the currently open dialog.
   *
   * @return {void}
   */
  dialogClose(): void {
    this.dialogRef.close();
  }
  
  /**
   * Initiates the user name saving process.
   * Trims the input and only proceeds if the result is non-empty.
   *
   * @return {Promise<void>}
   */
  async userSave(): Promise<void> {
    this.user.displayName = this.input.inputRef.nativeElement.value;
    this.saveChanges(this.user.displayName).catch(() => {});
  }

  /**
   * Compares the new trimmed name with the current user's name and updates it if different.
   * Closes the dialog afterward.
   *
   * @param {string} trimmedName - The cleaned and trimmed display name input.
   * @return {Promise<void>}
   */  
  async saveChanges(trimmedName: string): Promise<void> {
    const currentUser = await firstValueFrom(
      this.userDataService.currentUser$.pipe(
        filter(user => !!user && user.id !== 'default')
      )
    );
    if (trimmedName !== currentUser.displayName) {
      await this.userDataService.updateUserName(currentUser.id, trimmedName);
    }
    this.dialogClose();
  }
}