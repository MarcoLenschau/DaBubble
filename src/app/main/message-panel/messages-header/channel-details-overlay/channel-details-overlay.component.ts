import { Component, EventEmitter, Output } from '@angular/core';
import { Input } from '@angular/core';



@Component({
  selector: 'app-channel-details-overlay',
  imports: [],
  templateUrl: './channel-details-overlay.component.html',
  styleUrl: './channel-details-overlay.component.scss'
})
export class ChannelDetailsOverlayComponent {
  @Input() channel: any;

  @Output() close = new EventEmitter<void>;

}
