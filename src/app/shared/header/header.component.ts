import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterService } from '../../core/services/router.service';
import { InputComponent } from '../input/input.component';
import { DialogUserOptionsComponent } from '../../dialogs/dialog-user-options/dialog-user-options.component';
import { MatDialog } from '@angular/material/dialog'
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../../core/services/firebase.service';
import { onSnapshot } from '@angular/fire/firestore';

@Component({
  selector: 'app-header',
  imports: [CommonModule, InputComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  user = {
    displayName: "Gast",
    photoURL: ""
  };

  users: Subscription

  constructor(private dialog: MatDialog, public router: RouterService, private auth: AuthService, private firebase: FirebaseService) {
    this.users = this.auth.user$.subscribe(user => {
      this.user = user;
    });
  }

  ngOnDestroy() {
    this.users.unsubscribe();
  }

  openDialog() {
    let dialogRef = this.dialog.open(DialogUserOptionsComponent);
    dialogRef.componentInstance.user = this.user;
  }
}
