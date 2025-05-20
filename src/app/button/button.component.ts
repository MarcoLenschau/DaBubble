import { Component, Input } from '@angular/core';
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

  constructor(public router: RouterService) {}
}
