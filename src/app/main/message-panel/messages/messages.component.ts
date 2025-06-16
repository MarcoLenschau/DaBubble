import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnInit,
  ViewChildren,
  ViewChild,
  ElementRef,
  QueryList,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { DialogUserDetailsComponent } from '../../../dialogs/dialog-user-details/dialog-user-details.component';
import { UserDataService } from '../../../core/services/user-data.service';
import { MessageDataService } from '../../../core/services/message-data.service';
import { MessageCacheService } from '../../../core/services/message-cache.service';
import { MessageEventService } from '../../../core/services/message-event.service';
import { User } from '../../../core/models/user.model';
import { Message } from '../../../core/models/message.model';
import { Channel } from '../../../core/models/channel.model';
import { MessageContext } from '../../../core/interfaces/message-context.interface';
import { Emoji, EMOJIS } from '../../../core/interfaces/emojis.interface';
import {
  formatTime,
  formatDate,
  isNewDay,
  formatRelativeTimeSimple
} from '../../../core/utils/date-utils';
import {
  getEmojiByName,
  getEmojiByUnicode,
  addEmojiToTextarea,
  addEmojiToMessage,
  getUserById,
  getUserNames,
  formatUserNames,
  isOwnMessage,
  trackByMessageId,
  getSortedEmojisForUser,
  updateEmojiDataForUser,
} from '../../../core/utils/messages-utils';
import { scrollToBottom, isUserScrolledToBottom } from '../../../core/utils/scroll-utils';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent implements OnChanges, OnInit, OnDestroy {

  @Input() starterMessage?: Message;
  @Input() userId?: string;
  @Input() mode: 'thread' | 'message' = 'message';
  @Input() activeChannel: string | null = null;
  @Input() messageContext?: MessageContext;
  @Output() showThreadChange = new EventEmitter<boolean>();
  @Output() threadStart = new EventEmitter<{ starterMessage: Message; userId: string }>();
  @ViewChildren('emojiTooltip') emojiTooltips!: QueryList<ElementRef>;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  users: User[] = [];
  currentUser!: User;
  messages: Message[] = [];
  threadMessages: Message[] = [];
  channels: Channel[] = [];
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
  editingMessageId: string | null = null;
  editedText: string = '';
  messagesReady = false;

  private lastThreadId: string | null = null;
  private shouldScrollAfterUpdate: boolean = true;
  private threadShouldScrollAfterUpdate: boolean = true;
  private messagesSubscription?: Subscription;
  private threadMessagesSubscription?: Subscription;
  private currentUserSubscription?: Subscription;

  constructor(
    private userDataService: UserDataService,
    private messageDataService: MessageDataService,
    private messageCacheService: MessageCacheService,
    private messageEventService: MessageEventService,
    private dialog: MatDialog,
  ) {
    this.messageEventService.messageWindowScroll$.subscribe(scroll => {
      this.shouldScrollAfterUpdate = scroll;
    });

    this.messageEventService.threadWindowScroll$.subscribe(scroll => {
      this.threadShouldScrollAfterUpdate = scroll;
    });
  }

  get isThread(): boolean {
    return this.mode === 'thread';
  }

  get isMessage(): boolean {
    return this.mode === 'message';
  }

  async ngOnInit(): Promise<void> {
    this.userDataService.currentUser$
      .pipe(take(1))
      .subscribe(user => {
        this.currentUser = user;
        this.subscribeToMessages();
        this.updateSortedEmojis();
      });
    firstValueFrom(this.userDataService.getUsers()).then(users => {
      this.users = users;
    });
  }

  onScroll(): void {
    const container = this.scrollContainer.nativeElement;
  }

  handleEditClick(msg: Message, index: number): void {
    this.startEditing(msg);
    this.editMenuOpenIndex = null;
  }

  ngOnDestroy() {
    this.messagesSubscription?.unsubscribe();
    this.threadMessagesSubscription?.unsubscribe();
    this.currentUserSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      this.isMessage &&
      changes['messageContext'] &&
      !changes['messageContext'].firstChange) {
      this.subscribeToMessages();
    }

    if (this.isThread && changes['starterMessage'] && this.starterMessage) {
      this.messageEventService.notifyScrollIntent('thread', true);
      this.setReplyToMessage(this.starterMessage);
    }
  }

  private subscribeToMessages(): void {
    if (!this.messageContext || !this.currentUser?.id) return;

    this.messagesSubscription?.unsubscribe();
    this.messagesReady = false;

    const messageSource$ = this.messageDataService.getMessagesForContext(
      this.messageContext, this.currentUser.id
    );

    this.messagesSubscription = messageSource$.subscribe((loadedMessages) => {
      if (!Array.isArray(loadedMessages)) {
        this.messages = loadedMessages;
        this.messagesReady = true;
        return;
      }
      this.messages = loadedMessages;

      setTimeout(() => {
        if (this.shouldScrollAfterUpdate && this.scrollContainer?.nativeElement) {
          scrollToBottom(this.scrollContainer.nativeElement);
        }
        this.messagesReady = true;
      }, 0);
    });
  }

  async setReplyToMessage(msg: Message) {
    this.replyToMessage = msg;
    this.messagesReady = false;

    await this.ensureThreadId(msg);

    this.threadMessagesSubscription?.unsubscribe();

    this.subscribeToThreadMessages(msg);
  }

  private async ensureThreadId(msg: Message): Promise<void> {
    if (!msg.threadId) {
      msg.threadId = msg.id;
      await this.saveMessage(msg);
    }
    this.threadId = msg.threadId;
  }

  private subscribeToThreadMessages(msg: Message): void {
    let isFirst = true;
    this.threadMessagesSubscription = this.messageDataService.getMessagesForThread(this.threadId).subscribe(loadedMessages => {

      this.filteredMessages = loadedMessages;

      if (!isFirst) {
        this.updateRepliesCountIfNeeded(msg);
      }
      isFirst = false;

      this.threadSymbol = msg.channelId ? '#' : '@';

      const threadRootMsg = this.filteredMessages.find(m => m.id === msg.id) ?? msg;
      console.log('Root message in filteredMessages:', threadRootMsg);
      console.log('Original msg:', msg);
      this.threadTitle = threadRootMsg.channelId
        ? this.channels.find(c => c.id === threadRootMsg.channelId)?.name ?? 'Unbekannter Kanal'
        : threadRootMsg.name;


      // this.threadTitle = msg.channelId
      //   ? this.channels.find(c => c.id === msg.channelId)?.name ?? 'Unbekannter Kanal'
      //   : msg.name;

      setTimeout(() => {
        if (this.threadShouldScrollAfterUpdate && this.scrollContainer?.nativeElement) {
          scrollToBottom(this.scrollContainer.nativeElement);
        }
        this.messagesReady = true;
      }, 0);
    });
  }

  private updateRepliesCountIfNeeded(msg: Message): void {
    const newCount = this.filteredMessages.length - 1;
    if (newCount !== msg.replies) {
      msg.replies = newCount;
      this.messageDataService.updateMessageFields(msg.id, { replies: newCount })
        .catch(error =>
          console.error('Error updating replies count:', error));
    }
  }

  async saveMessage(msg: Message) {
    await this.messageDataService.updateMessage(msg);
  }

  openThread(msg: Message) {
    this.threadStart.emit({ starterMessage: msg, userId: this.currentUser.id });
  }

  openUserDialog(userId?: string): void {
    if (!userId) return;
    const user = this.getUserById(userId);
    if (user) {
      this.dialog.open(DialogUserDetailsComponent, { data: user });
    }
  }

  closeThread() {
    this.showThreadChange.emit(false);
    this.threadMessagesSubscription?.unsubscribe();
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

  async handleEmojiClick(emojiName: string, msg: Message): Promise<void> {
    this.messageEventService.notifyScrollIntent('message', false);
    this.messageEventService.notifyScrollIntent('thread', false);
    const wasAlreadyReacted = this.userHasReactedToEmoji(msg, emojiName, this.currentUser.id);
    const updatedMsg = addEmojiToMessage(emojiName, msg, this.currentUser.id);
    const isReactedNow = this.userHasReactedToEmoji(updatedMsg, emojiName, this.currentUser.id);

    if (!wasAlreadyReacted && isReactedNow) {
      const updatedUser = updateEmojiDataForUser(this.currentUser, emojiName);
      this.userDataService.setCurrentUser(updatedUser);
      this.currentUser = updatedUser;
    }

    await this.saveMessage(updatedMsg);
  }

  userHasReactedToEmoji(msg: Message, emojiName: string, userId: string): boolean {
    return msg.reactions.some((r) => r.emojiName === emojiName && r.userIds.includes(userId));
  }

  onEmojiRowMouseLeave(index: number): void {
    this.updateSortedEmojis();
    this.emojiMenuOpen = this.emojiMenuOpen.map(() => false);
  }

  onMouseEnterEmojiWrapper(event: MouseEvent, reactionIndex: number) {
    const wrapper = event.currentTarget as HTMLElement;
    setTimeout(() => {
      const tooltip = wrapper.querySelector('.bottom-emoji-tooltip');
      const threadMessages = wrapper.closest('.thread-messages');
      if (tooltip && threadMessages) {
        this.adjustTooltipPosition(tooltip as HTMLElement, threadMessages as HTMLElement);
      }
    }, 60);
  }

  adjustTooltipPosition(tooltipElement: HTMLElement, threadMessages: HTMLElement) {
    if (!tooltipElement) return;

    const rect = tooltipElement.getBoundingClientRect();
    const threadRect = threadMessages.getBoundingClientRect();

    const overflowRight = rect.right - threadRect.right;

    if (overflowRight > 0) {
      tooltipElement.style.transform = `translateX(-${overflowRight + 4}px)`;

    } else {
      tooltipElement.style.transform = '';
    }
  }

  editMenuOpenIndex: number | null = null;

  toggleEditMenu(index: number): void {
    this.editMenuOpenIndex = this.editMenuOpenIndex === index ? null : index;
  }


  startEditing(msg: Message): void {
    this.editingMessageId = msg.id;
    this.editedText = msg.text;
  }

  cancelEditing(): void {
    this.editingMessageId = null;
    this.editedText = '';
  }

  saveEditedMessage(msg: Message, index: number): void {
    const trimmed = this.editedText.trim();
    if (!trimmed || trimmed === msg.text) {
      this.cancelEditing();
      return;
    }

    const updatedMessage = { ...msg, text: trimmed };
    this.messages[index] = { ...this.messages[index], text: trimmed };
    this.cancelEditing();
    this.messageEventService.notifyScrollIntent('message', false);
    this.messageEventService.notifyScrollIntent('thread', false);
    this.messageDataService.updateMessage(updatedMessage).catch(err => {
      console.error('Error saving edited message:', err);
    });
  }

  formatTime = formatTime;
  formatDate = formatDate;
  isNewDay = isNewDay;
  formatRelativeTimeSimple = formatRelativeTimeSimple;
  getUserNames = (userIds: string[]) => getUserNames(this.users, userIds, this.currentUser);
  getUserById = (userId: string) => getUserById(this.users, userId);
  formatUserNames = (userIds: string[]) => formatUserNames(this.users, userIds, this.currentUser);
  getEmojiByName = (name: string) => getEmojiByName(this.emojis, name);
  getEmojiByUnicode = (unicode: string) => getEmojiByUnicode(this.emojis, unicode);
  addEmojiToTextarea = (unicodeEmoji: string) => {
    this.textareaContent = addEmojiToTextarea(this.textareaContent, unicodeEmoji);
    this.updateSortedEmojis();
  };

  updateSortedEmojis(): void {
    this.sortedEmojis = getSortedEmojisForUser(this.currentUser, this.emojis);
  }

  isOwnMessage = (msg: Message) => isOwnMessage(msg, this.currentUser.id);
  trackByMessageId = trackByMessageId;
}