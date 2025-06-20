import { Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-user-profile-overlay',
  imports: [],
  templateUrl: './user-profile-overlay.component.html',
  styleUrl: './user-profile-overlay.component.scss'
})
export class UserProfileOverlayComponent {
@Input() user: any;
@Output() close = new EventEmitter<void>();

}
