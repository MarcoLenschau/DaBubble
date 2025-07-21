import { Component, inject, Input } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogUserEditComponent } from '../dialog-user-edit/dialog-user-edit.component';
import { DialogEmailEditComponent } from '../dialog-email-edit/dialog-email-edit.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dialog-user-details',
  imports: [CommonModule],
  templateUrl: './dialog-user-details.component.html',
  styleUrl: './dialog-user-details.component.scss',
})
export class DialogUserDetailsComponent {
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<DialogUserDetailsComponent>);
  @Input() user: any = {};
  @Input() directMessage = false;
  sendMailStatus = false;

  /**
   * Closes the profile view dialog.
   *
   * @return {void}
   */
  closeProfilView(): void {
    this.dialogRef.close();
  }

  /**
   * Opens the user edit dialog, sets the user data in the component instance,
   * and closes the current profile view.
   *
   * @return {void}
   */
  openEditDialog(): void {
    const dialogRef = this.dialog.open(DialogUserEditComponent);
    dialogRef.componentInstance.user = this.user;
    this.closeProfilView();
  }

  /**
   * Opens the email edit dialog and closes the current profile view.
   *
   * @return {void}
   */
  openEmailDialog(): void {
    const dialogRef = this.dialog.open(DialogEmailEditComponent);
    this.closeProfilView();
  }

  /**
   * Sends an email verification if not already in the sending state.
   * Prevents multiple sends by disabling the status for 10 seconds.
   *
   * @return {void}
   */
  sendMail(): void {
    if (!this.sendMailStatus) {
      this.sendMailStatus = !this.sendMailStatus;
      this.sendEmailVerfication();
      setTimeout(() => {
        this.sendMailStatus = !this.sendMailStatus;
      }, 10000);
    }
  }

  /**
   * Triggers the email verification process through the authentication service.
   *
   * @return {void}
   */
  sendEmailVerfication(): void {
    this.auth.sendEmailVerification();
  }

  selectUserForDirectMessage(): void {
    this.dialogRef.close(this.user);
  }
}