import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterService } from '../../services/router.service';
import { InputComponent } from '../../input/input.component';
import { DialogUserOptionsComponent } from '../../dialogs/dialog-user-options/dialog-user-options.component';
import {MatDialog} from '@angular/material/dialog'
import { Observable } from 'rxjs';
import { FirebaseService } from '../../services/firebase.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-header',
  imports: [CommonModule, InputComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  user$: Observable<any[]>;
  user: User = {
    id: "0",
    name: 'Gast',
    email: 'gast@mail.com',
    img: './assets/img/profilepic/frederik.png'
  }
  
  constructor(private firebase: FirebaseService, private dialog: MatDialog, public router: RouterService) {
    this.user$ = this.firebase.getColRef("users"); 
      this.user$.forEach((users) => {
        if (users.length > 0) {
          
        }
    })
  }

  openDialog() {
    let dialogRef = this.dialog.open(DialogUserOptionsComponent);
    dialogRef.componentInstance.user = this.user; 
  }
}
