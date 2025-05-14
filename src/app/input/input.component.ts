import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterService } from '../services/router.service';

@Component({
  selector: 'app-input',
  imports: [CommonModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss'
})
export class InputComponent {
  @Input() placeholder: string = '';
  @Input() img: string = '';
  @Input() reverse: boolean = false;

  constructor(public router: RouterService) {}
}