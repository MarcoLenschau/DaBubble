import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterService } from '../../services/router.service';
import { InputComponent } from '../../input/input.component';
import { DialogUserOptionsComponent } from '../../dialogs/dialog-user-options/dialog-user-options.component';
import {MatDialog} from '@angular/material/dialog'

@Component({
  selector: 'app-header',
  imports: [CommonModule, InputComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(private dialog: MatDialog,public router: RouterService) {}

  openDialog() {
      this.dialog.open(DialogUserOptionsComponent);
  }
}
