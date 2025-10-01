import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-channel-members-overlay',
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-members-overlay.component.html',
  styleUrl: './channel-members-overlay.component.scss'
})
export class ChannelMembersOverlayComponent {
  @Input() members: any;
  @Output() close = new EventEmitter<void>;
  @Output() addMember = new EventEmitter<void>;
  
  public auth = inject(AuthService);

  ngOnInit() {
    this.members = this.members.map((member: any) => JSON.parse(member));
  }
}
