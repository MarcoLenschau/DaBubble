import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dialog-user-details',
  imports: [],
  templateUrl: './dialog-user-details.component.html',
  styleUrl: './dialog-user-details.component.scss'
})
export class DialogUserDetailsComponent {
  @Input() user: any = {}
}
