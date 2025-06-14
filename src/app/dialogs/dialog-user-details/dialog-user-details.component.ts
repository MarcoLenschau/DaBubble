import { Component, Input } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogUserEditComponent } from '../dialog-user-edit/dialog-user-edit.component';
import { DialogEmailEditComponent } from '../dialog-email-edit/dialog-email-edit.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-user-details',
  imports: [CommonModule],
  templateUrl: './dialog-user-details.component.html',
  styleUrl: './dialog-user-details.component.scss',
})
export class DialogUserDetailsComponent {
  @Input() user: any = {};
  constructor(private dialog: MatDialog, private dialogRef: MatDialogRef<DialogUserDetailsComponent>) {}

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
}
