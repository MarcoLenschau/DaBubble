import { Component, inject, Input } from '@angular/core';
import { RouterService } from '../../core/services/router.service';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogUserDetailsComponent } from '../dialog-user-details/dialog-user-details.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dialog-user-options',
  imports: [],
  templateUrl: './dialog-user-options.component.html',
  styleUrl: './dialog-user-options.component.scss',
})
export class DialogUserOptionsComponent {
  @Input() user: any = {};
  private dialogRef = inject(MatDialogRef<DialogUserOptionsComponent>);
  private dialog = inject(MatDialog);
  private auth = inject(AuthService);
  public router = inject(RouterService);
  
  /**
   * Logs the user out via the authentication service and closes the current dialog.
   *
   * @return {void}
   */
  logOut(): void {
    this.auth.logout();
    this.dialogRef.close();
  }

  /**
   * Opens the user details dialog, passes the current user to it,
   * and closes the current dialog.
   *
   * @return {void}
   */
  openDialog(): void {
    const dialogDetails = this.dialog.open(DialogUserDetailsComponent);
    dialogDetails.componentInstance.user = this.user;
    this.dialogRef.close();
  }
}