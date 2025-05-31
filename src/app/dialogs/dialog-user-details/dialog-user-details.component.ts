import { Component, Input } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogUserEditComponent } from '../dialog-user-edit/dialog-user-edit.component';


@Component({
  selector: 'app-dialog-user-details',
  imports: [],
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
    let dialogRef = this.dialog.open(DialogUserEditComponent);
    dialogRef.componentInstance.user = this.user;
    this.closeProfilView();
  }
}
