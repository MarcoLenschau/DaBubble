import { Component, Input } from '@angular/core';
import { RouterService } from '../../services/router.service';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogUserDetailsComponent } from '../dialog-user-details/dialog-user-details.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dialog-user-options',
  imports: [],
  templateUrl: './dialog-user-options.component.html',
  styleUrl: './dialog-user-options.component.scss',
})
export class DialogUserOptionsComponent {
  @Input() user: any = {};

  constructor(public router: RouterService, private dialog: MatDialog, private dialogRef: MatDialogRef<DialogUserOptionsComponent>, private auth: AuthService) {}

  logOut() {
    this.auth.logout();
    this.dialogRef.close();
  }

  openDialog() {
    let dialogDetails = this.dialog.open(DialogUserDetailsComponent);
    dialogDetails.componentInstance.user = this.user;
    this.dialogRef.close();
  }
}
