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
  sendMailStatus = false;

  constructor() {
    
  }

  closeProfilView() {
    this.dialogRef.close();
  }

  openEditDialog() {
    const dialogRef = this.dialog.open(DialogUserEditComponent);
    dialogRef.componentInstance.user = this.user;
    this.closeProfilView();
  }

  openEmailDialog() {
    const dialogRef = this.dialog.open(DialogEmailEditComponent);
    this.closeProfilView();
  }

  sendMail() {
    if (!this.sendMailStatus) {
      this.sendMailStatus = !this.sendMailStatus;
      this.sendEmailVerfication();
      setTimeout(() => {
        this.sendMailStatus = !this.sendMailStatus;
      }, 10000);
    }
  }

  sendEmailVerfication()  {
    this.auth.sendEmailVerification()
    .catch((error) =>  {
      console.error(error);
    });
  }
}