import { CommonModule, NgClass } from '@angular/common';
import {
  Component,
  Input,
  EventEmitter,
  Output,
  AfterViewInit,
  AfterViewChecked,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../../models/message.model';
import { TextareaComponent } from '../textarea/textarea.component';
import { DialogUserDetailsComponent } from '../../dialogs/dialog-user-details/dialog-user-details.component';
import { MatDialog } from '@angular/material/dialog';
import { EMOJIS, Emoji } from '../../interfaces/emojis-interface';
import { Channel } from '../../models/channel.model';
import {
  users,
  currentUser,
  messages,
  channels,
  formatTime,
  getEmojiByName,
  getEmojiByUnicode,
  addEmojiToTextarea,
  addEmojiToMessage,
  getUserById,
  getUserNames,
  formatUserNames,
  isOwnMessage,
  trackByMessageId,
  buildNewMessage,
} from './../shared-functions';
import { timestamp } from 'rxjs';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule, TextareaComponent, NgClass],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent {
  constructor(private dialog: MatDialog) {}
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

  @Output() threadStart = new EventEmitter<{
    starterMessage: Message;
    userId: string;
  }>();
  openThread(msg: Message) {
    this.threadStart.emit({ starterMessage: msg, userId: currentUser.id });
  }
  users = users;
  currentUser = currentUser;
  messages = messages;
  emojis: Emoji[] = EMOJIS;
  showThread = true;
  emojiMenuOpen: boolean[] = [];
  hoveredIndex: number | null = null;
  tooltipHoveredIndex: number | null = null;
  formattedUserNames: string = '';
  tooltipText: string = '';
  // TODO textareaContent an TextareaComponent anpassen
  textareaContent: string = '';
  private marked = false;
  threadSymbol: '#' | '@' = '#';
  threadTitle: string = '';
  replyToMessage: Message | null = null;
  threadId: string = '';
  // TODO: channelId aus aktuellem Channel ableiten
  channelId: string = '';

  formatTime = formatTime;
  getUserNames = (userIds: string[]) =>
    getUserNames(this.users, userIds, this.currentUser);
  getUserById = (userId: string) => getUserById(this.users, userId);
  formatUserNames = (userIds: string[]) =>
    formatUserNames(this.users, userIds, this.currentUser);
  getEmojiByName = (name: string) => getEmojiByName(this.emojis, name);
  getEmojiByUnicode = (unicode: string) =>
    getEmojiByUnicode(this.emojis, unicode);
  addEmojiToTextarea = (unicodeEmoji: string) => {
    this.textareaContent = addEmojiToTextarea(
      this.textareaContent,
      unicodeEmoji
    );
  };
  handleEmojiClick(emojiName: string, msg: Message) {
    addEmojiToMessage(emojiName, msg, this.currentUser.id);
  }
  isOwnMessage = (msg: Message) => isOwnMessage(msg, this.currentUser.id);
  trackByMessageId = trackByMessageId;

  cancelReply() {
    this.replyToMessage = null;
  }

  openUserDialog(userId?: string): void {
    if (!userId) return;
    const user = this.getUserById(userId);
    if (user) {
      this.dialog.open(DialogUserDetailsComponent, {
        data: user,
      });
    }
  }

  setHoverState(index: number | null) {
    this.hoveredIndex = index;

    if (index === null) {
      this.emojiMenuOpen = this.emojiMenuOpen.map(() => false);
    }
  }

  setTooltipHoveredState(index: number | null, userIds: string[] | null): void {
    this.tooltipHoveredIndex = index;

    if (index !== null && userIds !== null) {
      const result = formatUserNames(this.users, userIds, this.currentUser);
      this.formattedUserNames = result.text;
      this.tooltipText = result.verb;
    }
  }

  toggleEmojiMenu(index: number): void {
    this.emojiMenuOpen[index] = !this.emojiMenuOpen[index];
  }

  closeEmojiRow(event: MouseEvent): void {
    this.emojiMenuOpen = this.emojiMenuOpen.map(() => false);
  }

  clearTextarea() {
    this.textareaContent = '';
    this.replyToMessage = null;
  }

  postMessage() {
    if (!this.currentUser) return;

    const newMessage = buildNewMessage(
      this.textareaContent,
      this.currentUser,
      '',
      this.channelId || ''
    );

    this.messages.push(newMessage);
    this.clearTextarea();
  }

  get isTextareaFilled(): boolean {
    const textareaContent = this.textareaContent.trim();
    if (!textareaContent || textareaContent.length === 0) return false;

    return textareaContent.length >= 1 && textareaContent.length <= 500;
  }

  get isFormValid(): boolean {
    return this.isTextareaFilled;
  }
}
