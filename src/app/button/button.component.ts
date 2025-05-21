import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterService } from '../services/router.service';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() text: string = "";
  @Input() color: "primary" | "secondary" = "primary";
  @Input() switchTo: string = "";
  @Output() clicked = new EventEmitter<void>();

  constructor(public router: RouterService) {}

  onClick() {
    this.clicked.emit();
  }
}
