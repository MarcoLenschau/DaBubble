import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../../../models/message.model';
import { channels } from '../../../utils/messages-utils';
import { FirebaseService } from '../../../services/firebase.service';

@Component({
  selector: 'app-messages-header',
  standalone: true,
  imports: [NgIf, CommonModule, NgFor, FormsModule],
  templateUrl: './messages-header.component.html',
  styleUrl: './messages-header.component.scss',
})
export class MessagesHeaderComponent {
  @Input() mode: 'thread' | 'message' = 'message';
  @Input() starterMessage?: Message;
  @Output() closeThreadWindow = new EventEmitter<boolean>();

  constructor(private firebaseService: FirebaseService) {}


ngOnInit() {
  this.firebaseService.updateAllUsersWithLowercaseField();
}
  textInput = '';
  selectedRecipients: { id: string; displayName: string }[] = [];

  searchResultsUser: any[] = [];
  searchResultsEmail: any[] = [];
  searchResultsChannels: any[] = [];

  allChannels = [
    { id: 'c1', channelName: 'Dev-News' },
    { id: 'c2', channelName: 'DaBubble-Support' },
  ];

  get isThread(): boolean {
    return this.mode === 'thread';
  }

  get isMessage(): boolean {
    return this.mode === 'message';
  }

  get threadSymbol(): '#' | '@' {
    return this.starterMessage?.channelId ? '#' : '@';
  }

  get threadTitle(): string {
    if (!this.starterMessage) return '';
    if (this.starterMessage.channelId) {
      return (
        channels.find((c) => c.id === this.starterMessage!.channelId)?.name ??
        'Unbekannter Kanal'
      );
    }
    return this.starterMessage.name;
  }

  async onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    this.clearResults();

    if (term.startsWith('@')) {
      const query = term.slice(1).toLowerCase();
      if (query.length >= 1) {
        this.searchResultsUser = await this.firebaseService.searchUsersByNameFragment(query);
      }
    } else if (term.startsWith('#')) {
      const query = term.slice(1).toLowerCase();
      this.searchResultsChannels = this.allChannels.filter((channel) =>
        channel.channelName.toLowerCase().includes(query)
      );
    } else if (term.length > 2 && term.includes('@')) {
      this.searchResultsEmail = await this.firebaseService.searchUsersByEmail(term.toLowerCase());
    }
  }

 selectUser(user: any, input: HTMLInputElement) {
  const match = this.textInput.match(/@[\wäöüßÄÖÜ\-]+$/);
  if (match) {
    this.textInput = this.textInput.replace(/@[\wäöüßÄÖÜ\-]+$/, `@${user.displayName} `);
  } else {
    this.textInput += `@${user.displayName} `;
  }

  this.selectedRecipients.push({ id: user.id, displayName: user.displayName });
  input.value = '';
  this.clearResults();
}


  selectChannel(channel: any, input: HTMLInputElement) {
    this.textInput += `#${channel.channelName} `;
    input.value = '';
    this.clearResults();
  }

  private clearResults() {
    this.searchResultsUser = [];
    this.searchResultsEmail = [];
    this.searchResultsChannels = [];
  }

  closeThread() {
    this.closeThreadWindow.emit(false);
  }
}
