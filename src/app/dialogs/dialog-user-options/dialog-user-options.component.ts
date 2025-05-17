import { Component } from '@angular/core';
import { RouterService } from '../../services/router.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-user-options',
  imports: [],
  templateUrl: './dialog-user-options.component.html',
  styleUrl: './dialog-user-options.component.scss'
})
export class DialogUserOptionsComponent {
  constructor(private router: RouterService, private dialogRef: MatDialogRef<DialogUserOptionsComponent>) {}

  logOut() {
    this.router.switchRoute("");
    this.dialogRef.close();
  }
}
