import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../../../models/message.model';
import { channels } from '../../../utils/messages-utils';

@Component({
  selector: 'app-messages-header',
  imports: [NgIf, CommonModule, NgFor, CommonModule, FormsModule],
  templateUrl: './messages-header.component.html',
  styleUrl: './messages-header.component.scss',
})
export class MessagesHeaderComponent {
  @Input() mode: 'thread' | 'message' = 'message';
  @Input() starterMessage?: Message;
  @Output() closeThreadWindow = new EventEmitter<boolean>();

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

  // Dummy-Daten
  // currentUser = { id: 'u1', name: 'Anna' };
  allUsers = [
    { id: 'u2', name: 'Emrah', email: 'emrah@example.com' },
    { id: 'u3', name: 'Frederic', email: 'frederic@example.com' },
    { id: 'u4', name: 'Martin', email: 'martin@example.com' },
    { id: 'u5', name: 'Marco', email: 'marco@example.com' },
  ];
  allChannels = [
    { id: 'c1', channelName: 'Dev-News' },
    { id: 'c2', channelName: 'DaBubble-Support' },
  ];

  searchResultsUser: any[] = [];
  searchResultsEmail: any[] = [];
  searchResultsChannels: any[] = [];

  textInput = '';

  onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.clearResults();

    if (term.startsWith('@')) {
      this.searchResultsUser = this.allUsers.filter((user) =>
        user.name.toLowerCase().includes(term.slice(1))
      );
    } else if (term.startsWith('#')) {
      this.searchResultsChannels = this.allChannels.filter((channel) =>
        channel.channelName.toLowerCase().includes(term.slice(1))
      );
    } else if (term.length > 2 && term.includes('@')) {
      this.searchResultsEmail = this.allUsers.filter((user) =>
        user.email.toLowerCase().includes(term)
      );
    }
  }

  selectUser(user: any, input: HTMLInputElement) {
    this.textInput += `@${user.name} `;
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
