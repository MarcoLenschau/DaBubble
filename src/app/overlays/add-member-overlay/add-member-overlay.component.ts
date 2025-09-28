import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-add-member-overlay',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-member-overlay.component.html',
  styleUrl: './add-member-overlay.component.scss'
})
export class AddMemberOverlayComponent {
  firebase = inject(FirebaseService);
  @Input() channel: any;
  @Output() close = new EventEmitter<void>;
  @Output() add = new EventEmitter<string>;

  username: string = '';
  
  /**
   * Emits the entered username if it is not empty,
   * then resets the input field.
   */
  addUser() {
    if (!this.username) return;
    this.firebase.getContactsObservable().subscribe(contacts => {
      const user = contacts.find((contact: any) => contact.displayName === this.username);
      this.channel.members.push(JSON.stringify(user));
      this.firebase.updateChannel(this.channel.id, this.channel);
    });
    this.add.emit(this.username);
    this.username = '';
  }
}
