import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterService } from '../../services/router.service';
import { InputComponent } from '../input/input.component';
import { DialogUserOptionsComponent } from '../../dialogs/dialog-user-options/dialog-user-options.component';
import {MatDialog} from '@angular/material/dialog'
import { User } from '../../models/user.model';

@Component({
  selector: 'app-header',
  imports: [CommonModule, InputComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  user: User = {
    id: 'user',
    name: 'Gast',
    email:  'gast@gmail.com',
    img: ''
  };
  
  constructor(private dialog: MatDialog, public router: RouterService) {}

  openDialog() {
    let dialogRef = this.dialog.open(DialogUserOptionsComponent);
    dialogRef.componentInstance.user = this.user; 
  }
}
