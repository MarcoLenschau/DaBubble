import { Component, Input, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../models/user.model';
import { DialogUserEditComponent } from '../dialog-user-edit/dialog-user-edit.component';

@Component({
  selector: 'app-dialog-user-details',
  imports: [],
  templateUrl: './dialog-user-details.component.html',
  styleUrl: './dialog-user-details.component.scss',
})
export class DialogUserDetailsComponent {
  // @Input() user: any = {};

  constructor(private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public user: User,
    private dialogRef: MatDialogRef<DialogUserDetailsComponent>
  ) {}

  closeProfilView() {
    this.dialogRef.close();
  }

  openEditDialog() {
    let dialogRef = this.dialog.open(DialogUserEditComponent);
    dialogRef.componentInstance.user = this.user;
    this.closeProfilView();
  }
}
