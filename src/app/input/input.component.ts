import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-input',
  imports: [CommonModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss'
})
export class InputComponent {
  @Input() type: string = '';

  getPlaceholder(): string {
    if (this.type === "email") {
      return "max-mustmann@mustermail.com";
    } else if (this.type === "password") {
      return "Password";
    } else if (this.type === "new-password") {
      return "New password";
    }  else if (this.type === "retry-password") {
      return "Retry password";
    } else if (this.type === "channel-name") {
      return "Project";
    } else if (this.type === "description") {
      return "Your text";
    } else {
      return "";
    }
  }
}
