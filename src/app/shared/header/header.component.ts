import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterService } from '../../services/router.service';
import { InputComponent } from '../../input/input.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule, InputComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(public router: RouterService) {}

}
