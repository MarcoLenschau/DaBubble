import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TextareaComponent } from '../textarea/textarea.component';
import { DialogUserDetailsComponent } from '../../dialogs/dialog-user-details/dialog-user-details.component';
import { MatDialog } from '@angular/material/dialog';

import { EMOJIS, Emoji } from '../../interfaces/emojis-interface';
import { Message } from '../../models/message.model';
import {
  users,
  currentUser,
  messages,
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
  getSortedEmojisForUser,
  updateEmojiDataForUser,
} from './../shared-functions';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule, TextareaComponent, NgClass],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent implements OnInit {
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

  users = users;
  currentUser = currentUser;
  messages = messages;
  emojis: Emoji[] = EMOJIS;
  sortedEmojis: Emoji[] = [];
  emojiMenuOpen: boolean[] = [];
  hoveredIndex: number | null = null;
  tooltipHoveredIndex: number | null = null;
  formattedUserNames: string = '';
  tooltipText: string = '';
  textareaContent: string = '';
  threadSymbol: '#' | '@' = '#';
  threadTitle: string = '';
  replyToMessage: Message | null = null;
  threadId: string = '';
  channelId: string = '';

  get isTextareaFilled(): boolean {
    const textareaContent = this.textareaContent.trim();
    if (!textareaContent || textareaContent.length === 0) return false;

    return textareaContent.length >= 1 && textareaContent.length <= 500;
  }

  get isFormValid(): boolean {
    return this.isTextareaFilled;
  }

  ngOnInit() {
    this.updateSortedEmojis();
  }

  openThread(msg: Message) {
    this.threadStart.emit({ starterMessage: msg, userId: currentUser.id });
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

  handleEmojiClick(emojiName: string, msg: Message): void {
    const wasAlreadyReacted = this.userHasReactedToEmoji(
      msg,
      emojiName,
      this.currentUser.id
    );

    addEmojiToMessage(emojiName, msg, this.currentUser.id);

    const isReactedNow = this.userHasReactedToEmoji(
      msg,
      emojiName,
      this.currentUser.id
    );

    if (!wasAlreadyReacted && isReactedNow) {
      updateEmojiDataForUser(this.currentUser, emojiName);
    }

    this.updateSortedEmojis();
  }

  userHasReactedToEmoji(
    msg: Message,
    emojiName: string,
    userId: string
  ): boolean {
    return msg.reactions.some(
      (r) => r.emojiName === emojiName && r.userIds.includes(userId)
    );
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

  cancelReply() {
    this.replyToMessage = null;
  }

  clearTextarea() {
    this.textareaContent = '';
    this.replyToMessage = null;
  }

  addEmojiToTextarea = (unicodeEmoji: string) => {
    // TODO: im HTML implementieren
    this.textareaContent = addEmojiToTextarea(
      this.textareaContent,
      unicodeEmoji
    );
    this.updateSortedEmojis();
  };

  updateSortedEmojis(): void {
    this.sortedEmojis = getSortedEmojisForUser(this.currentUser, this.emojis);
    console.log('Updating, Order: ', this.sortedEmojis);
  }

  formatTime = formatTime;
  getUserNames = (userIds: string[]) =>
    getUserNames(this.users, userIds, this.currentUser);
  getUserById = (userId: string) => getUserById(this.users, userId);
  formatUserNames = (userIds: string[]) =>
    formatUserNames(this.users, userIds, this.currentUser);
  getEmojiByName = (name: string) => getEmojiByName(this.emojis, name);
  getEmojiByUnicode = (unicode: string) =>
    getEmojiByUnicode(this.emojis, unicode);
  isOwnMessage = (msg: Message) => isOwnMessage(msg, this.currentUser.id);
  trackByMessageId = trackByMessageId;
}
