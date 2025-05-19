import { Component, Input, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dialog-user-details',
  imports: [],
  templateUrl: './dialog-user-details.component.html',
  styleUrl: './dialog-user-details.component.scss',
})
export class DialogUserDetailsComponent {
  // @Input() user: any = {};

  constructor(
    @Inject(MAT_DIALOG_DATA) public user: User,
    private dialogRef: MatDialogRef<DialogUserDetailsComponent>
  ) {}

  closeProfilView() {
    this.dialogRef.close();
  }
}
