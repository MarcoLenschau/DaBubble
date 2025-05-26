import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnInit,
  ViewChildren,
  ElementRef,
  QueryList,
} from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogUserDetailsComponent } from '../../../dialogs/dialog-user-details/dialog-user-details.component';
import { MatDialog } from '@angular/material/dialog';
import { UserDataService } from '../../../services/user-data.service';
import { MessageDataService } from '../../../services/message-data.service';
import { User } from '../../../models/user.model';
import { Message } from '../../../models/message.model';
import { Emoji, EMOJIS } from '../../../interfaces/emojis-interface';
import {
  currentUser,
  // users,
  // messages,
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
  getSortedEmojisForUser,
  updateEmojiDataForUser,
} from '../../../utils/messages-utils';
import { user } from '@angular/fire/auth';

@Component({
  selector: 'app-messages',
  imports: [CommonModule, FormsModule, NgClass],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent implements OnChanges, OnInit {
  @Input() starterMessage?: Message;
  @Input() userId?: string;
  @Input() mode: 'thread' | 'message' = 'message';
  @Output() showThreadChange = new EventEmitter<boolean>();
  @Output() threadStart = new EventEmitter<{
    starterMessage: Message;
    userId: string;
  }>();
  @ViewChildren('emojiTooltip') emojiTooltips!: QueryList<ElementRef>;

  users: User[] = [];
  currentUser = currentUser;
  messages: Message[] = [];
  emojis: Emoji[] = EMOJIS;
  sortedEmojis: Emoji[] = [];
  emojiMenuOpen: boolean[] = [];
  filteredMessages: Message[] = [];
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

  constructor(
    private userDataService: UserDataService,
    private messageDataService: MessageDataService,
    private dialog: MatDialog
  ) {}

  get isThread(): boolean {
    return this.mode === 'thread';
  }

  get isMessage(): boolean {
    return this.mode === 'message';
  }

  ngOnInit() {
    this.loadUsers();
    this.loadMessages();
    this.updateSortedEmojis();
  }

  ngOnChanges() {
    if (this.starterMessage) {
      this.setReplyToMessage(this.starterMessage);
    }
  }

  private loadUsers(): void {
    this.userDataService.getUsers().subscribe((loadedUsers) => {
      this.users = loadedUsers;
      console.log('Users: ', this.users);
    });
  }

  private loadMessages(): void {
    this.messageDataService.getMessages().subscribe((loadedMessages) => {
      this.messages = loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
      console.log('Messages: ', this.messages);
    });
  }

  openThread(msg: Message) {
    this.threadStart.emit({ starterMessage: msg, userId: this.currentUser.id });
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

  closeThread() {
    this.showThreadChange.emit(false);
  }

  postThreadMessage() {
    if (!this.starterMessage || !this.currentUser) return;

    const newMessage = buildNewMessage(
      this.textareaContent,
      this.currentUser,
      this.starterMessage.id,
      this.starterMessage.channelId || ''
    );

    this.messages.push(newMessage);
    this.filteredMessages = this.messages.filter(
      (m) => m.threadId === this.starterMessage!.id
    );
    this.clearTextarea();
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

  setReplyToMessage(msg: Message) {
    this.replyToMessage = msg;
    this.threadId = msg.id;
    msg.threadId = msg.id;
    this.filteredMessages = this.messages.filter((m) => m.threadId === msg.id);

    this.threadSymbol = msg.channelId ? '#' : '@';
    this.threadTitle = msg.channelId
      ? channels.find((c) => c.id === msg.channelId)?.name ??
        'Unbekannter Kanal'
      : msg.name;
  }

  cancelReply() {
    this.replyToMessage = null;
  }

  clearTextarea() {
    this.textareaContent = '';
    this.replyToMessage = null;
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

  onMouseEnterEmojiWrapper(event: MouseEvent, reactionIndex: number) {
    const wrapper = event.currentTarget as HTMLElement;
    setTimeout(() => {
      const tooltip = wrapper.querySelector('.bottom-emoji-tooltip');
      const threadMessages = wrapper.closest('.thread-messages');

      if (tooltip && threadMessages) {
        this.adjustTooltipPosition(
          tooltip as HTMLElement,
          threadMessages as HTMLElement
        );
      }
    }, 60);
  }

  adjustTooltipPosition(
    tooltipElement: HTMLElement,
    threadMessages: HTMLElement
  ) {
    if (!tooltipElement) return;

    const rect = tooltipElement.getBoundingClientRect();
    const threadRect = threadMessages.getBoundingClientRect();

    if (rect.right > threadRect.right) {
      tooltipElement.classList.add('overflowing-right');
    } else {
      tooltipElement.classList.remove('overflowing-right');
    }
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
  }

  isOwnMessage = (msg: Message) => isOwnMessage(msg, this.currentUser.id);
  trackByMessageId = trackByMessageId;
}
