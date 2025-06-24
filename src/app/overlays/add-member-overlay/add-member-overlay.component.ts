import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-member-overlay',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-member-overlay.component.html',
  styleUrl: './add-member-overlay.component.scss'
})
export class AddMemberOverlayComponent {
  @Input() channel: any;
  @Output() close = new EventEmitter<void>;
  @Output() add = new EventEmitter<string>;

  username: string = '';

  addUser() {
    if (!this.username) return;
    this.add.emit(this.username);
    this.username = '';
  }
}
