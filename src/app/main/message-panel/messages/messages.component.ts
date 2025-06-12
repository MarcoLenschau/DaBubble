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
import { Subscription, firstValueFrom, take, distinctUntilChanged } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { DialogUserDetailsComponent } from '../../../dialogs/dialog-user-details/dialog-user-details.component';
import { UserDataService } from '../../../core/services/user-data.service';
import { MessageDataService } from '../../../core/services/message-data.service';
import { MessageCacheService } from '../../../core/services/message-cache.service';

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
  detectRelevantChanges,
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
  private autoScrollEnabled = true;


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
  private messagesSubscription?: Subscription;
  private threadMessagesSubscription?: Subscription;
  private currentUserSubscription?: Subscription;
  private repliesUpdateTimeout?: ReturnType<typeof setTimeout>;
  private lastLoadedMessageIds: string[] | null = null;
  private isFirstEmission = true;


  constructor(
    private userDataService: UserDataService,
    private messageDataService: MessageDataService,
    private messageCacheService: MessageCacheService,
    private dialog: MatDialog,
  ) { }

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

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.scrollContainer && this.scrollContainer.nativeElement) {
        scrollToBottom(this.scrollContainer.nativeElement);
      }
    });
  }

  onScroll(): void {
    const container = this.scrollContainer.nativeElement;
    this.autoScrollEnabled = isUserScrolledToBottom(container);
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

    if (this.isThread &&
      changes['starterMessage'] &&
      this.starterMessage &&
      this.starterMessage.id !== this.lastThreadId) {
      this.setReplyToMessage(this.starterMessage);
      this.lastThreadId = this.starterMessage.id;
    }
  }

  private subscribeToMessages(): void {

    if (!this.messageContext || !this.currentUser?.id) return;
    console.debug('subscribeToMessages aufgerufen für Context:', this.messageContext);
    this.messagesSubscription?.unsubscribe();

    const messageSource$ = this.messageDataService.getMessagesForContext(this.messageContext, this.currentUser.id);

    this.isFirstEmission = true; // Kennzeichnung, dass beim nächsten emit initial ist
    this.lastLoadedMessageIds = null; // reset für neuen Kontext

    this.messagesSubscription = messageSource$.subscribe((loadedMessages) => {
      if (!Array.isArray(loadedMessages)) {
        this.messages = loadedMessages;
        return;
      }
      // IDs extrahieren (nachdem Service garantiert asc-sorted liefert)
      const currIds = loadedMessages.map(m => m.id);

      if (this.lastLoadedMessageIds) {
        debugger;
        const prevIds = this.lastLoadedMessageIds;
        if (prevIds.length === currIds.length && prevIds.every((id, idx) => id === currIds[idx])) {
          // IDs-Liste identisch
          if (!this.isFirstEmission) {
            // Prüfen, ob Inhalte sich geändert haben
            let contentChanged = false;
            for (let i = 0; i < loadedMessages.length; i++) {
              const oldMsg = this.messages[i];
              const newMsg = loadedMessages[i];
              if (detectRelevantChanges(oldMsg, newMsg)) {
                contentChanged = true;
                break;
              }
            }
            if (!contentChanged) {
              console.debug('subscribeToMessages: IDs gleich und keine relevanten Änderungen → überspringe Rendering');
              // Keine Änderung an IDs und Inhalten → nichts tun
              return;
            }
            console.debug('subscribeToMessages: IDs gleich, aber Inhalte geändert → update');
          }
          // Wenn isFirstEmission true, behandeln wir es wie neue Liste weiter unten
        }
        // andernfalls: IDs-Liste ungleich → neue/andere Nachrichten → übernehmen
      }




      // Erste Initial-Emission oder IDs unterschiedlich oder Inhalt geändert:
      this.lastLoadedMessageIds = currIds;
      this.messages = loadedMessages;

      // Scroll-Logik:
      setTimeout(() => {
        console.log('Height before scroll:', this.scrollContainer.nativeElement.scrollHeight);
        scrollToBottom(this.scrollContainer.nativeElement);
        setTimeout(() => {
          console.log('Height after scroll:', this.scrollContainer.nativeElement.scrollHeight);
          console.log('Loaded', loadedMessages.length, 'messages at', Date.now());
          this.messagesReady = true;
        }, 200);
      }, 300);

      this.isFirstEmission = false;
    });

    // this.messagesSubscription = messageSource$.pipe(distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))).subscribe((loadedMessages) => {
    //   const ids = loadedMessages.map(m => m.id);
    //   if (this.lastLoadedMessageIds) {
    //     // prüfen, ob identische ID-Liste
    //     const prev = this.lastLoadedMessageIds;
    //     if (prev.length === ids.length && prev.every((id, idx) => id === ids[idx])) {
    //       console.debug('Subscription: dieselben Nachrichten-IDs wie zuvor, überspringe Rendering');
    //       return;
    //     }
    //   }
    //   // sonst: neue oder längere Liste
    //   this.lastLoadedMessageIds = ids;
    //   this.messages = loadedMessages;
    //   setTimeout(() => {
    //     console.log('Height before scroll:', this.scrollContainer.nativeElement.scrollHeight);
    //     scrollToBottom(this.scrollContainer.nativeElement);
    //     setTimeout(() => {
    //       console.log('Height after scroll:', this.scrollContainer.nativeElement.scrollHeight);
    //       console.log('Loaded', loadedMessages.length, 'messages at', Date.now());

    //       this.messagesReady = true;
    //     }, 200);
    //   }, 300);

    // });

  }

  async setReplyToMessage(msg: Message) {
    this.replyToMessage = msg;

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
      this.threadMessages = loadedMessages;

      this.filteredMessages = [msg, ...this.threadMessages.filter(m => m.id !== msg.id)];

      if (!isFirst) {
        this.updateRepliesCountIfNeeded(msg);
      }
      isFirst = false;

      this.threadSymbol = msg.channelId ? '#' : '@';
      this.threadTitle = msg.channelId
        ? this.channels.find(c => c.id === msg.channelId)?.name ?? 'Unbekannter Kanal'
        : msg.name;
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

  saveEditedMessage(msg: Message): void {
    const trimmed = this.editedText.trim();
    if (!trimmed || trimmed === msg.text) {
      this.cancelEditing();
      return;
    }

    const updatedMessage = { ...msg, text: trimmed };
    this.messageDataService.updateMessage(updatedMessage).then(() => {
      this.cancelEditing();
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