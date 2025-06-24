import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-channel-members-overlay',
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-members-overlay.component.html',
  styleUrl: './channel-members-overlay.component.scss'
})
export class ChannelMembersOverlayComponent {
  @Input() members: any;
  @Output() close = new EventEmitter<void>;
  @Output() addMembers = new EventEmitter<void>;
  
}
