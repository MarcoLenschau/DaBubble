import { Component } from '@angular/core';
import { RouterService } from '../../services/router.service';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogUserDetailsComponent } from '../dialog-user-details/dialog-user-details.component';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dialog-user-options',
  imports: [],
  templateUrl: './dialog-user-options.component.html',
  styleUrl: './dialog-user-options.component.scss',
})
export class DialogUserOptionsComponent {
  user: User = {
    id: 'user0',
    name: 'Gast',
    email: 'gast@mail.com',
    img: './assets/img/profilepic/frederik.png',
  };

  constructor(
    public router: RouterService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<DialogUserOptionsComponent>
  ) {}

  logOut() {
    this.router.switchRoute('');
    this.dialogRef.close();
  }

  openDialog() {
    this.dialog.open(DialogUserDetailsComponent, {
      data: this.user,
    });
    // let dialogRef = this.dialog.open(DialogUserDetailsComponent);

    // dialogRef.componentInstance.user = this.user
    this.dialogRef.close();
  }
}
