import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterService } from '../../services/router.service';
import { InputComponent } from '../input/input.component';
import { DialogUserOptionsComponent } from '../../dialogs/dialog-user-options/dialog-user-options.component';
import {MatDialog} from '@angular/material/dialog'
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [CommonModule, InputComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  user: any;
  users: Subscription
  
  constructor(private dialog: MatDialog, public router: RouterService, private auth: AuthService) {
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
