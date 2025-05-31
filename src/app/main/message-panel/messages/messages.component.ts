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
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DialogUserDetailsComponent } from '../../../dialogs/dialog-user-details/dialog-user-details.component';
import { MatDialog } from '@angular/material/dialog';
import { UserDataService } from '../../../services/user-data.service';
import { MessageDataService } from '../../../services/message-data.service';
import { User } from '../../../models/user.model';
import { Message } from '../../../models/message.model';
import { Emoji, EMOJIS } from '../../../interfaces/emojis-interface';
import {
  // currentUser,
  // users,
  // messages,
  // channels,
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
  // currentUser,
} from '../../../utils/messages-utils';
import { user } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { Channel } from '../../../models/channel.model';
import { MessageContext } from '../../../interfaces/message-context.interface';

@Component({
  selector: 'app-messages',
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
  @Output() threadStart = new EventEmitter<{
    starterMessage: Message;
    userId: string;
  }>();
  @ViewChildren('emojiTooltip') emojiTooltips!: QueryList<ElementRef>;

  users: User[] = [];
  currentUser: User;
  // currentUser = currentUser;
  messages: Message[] = [];
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
  // messageContext: MessageContext = {
  //   type: 'channel',
  //   id: '',
  //   receiverId: ''
  // };



  private lastThreadId: string | null = null;
  private messagesSubscription?: Subscription;

  constructor(
    private userDataService: UserDataService,
    private messageDataService: MessageDataService,
    private dialog: MatDialog,

  ) {
    this.currentUser = this.userDataService.getCurrentUser();
  }

  get isThread(): boolean {
    return this.mode === 'thread';
  }

  get isMessage(): boolean {
    return this.mode === 'message';
  }

  // ngOnInit() {
  //   this.loadUsers();
  //   this.loadMessages();
  //   this.updateSortedEmojis();
  // }

  async ngOnInit() {
    this.users = await firstValueFrom(this.userDataService.getUsers());
    await this.completeMissingUserFieldsInFirebase();
    this.subscribeToMessages();
    this.updateSortedEmojis();


  }


  ngOnDestroy() {
    this.messagesSubscription?.unsubscribe();
  }

  // private subscribeToMessages(): void {
  //   this.messagesSubscription?.unsubscribe();
  //   this.messagesSubscription = this.messageDataService.getMessages().subscribe((loadedMessages) => {
  //     this.messages = loadedMessages.sort((a, b) => a.timestamp - b.timestamp);

  //     if (this.isThread && this.starterMessage) {
  //       this.setReplyToMessage(this.starterMessage)
  //     }
  //     console.log("Messages: ", this.messages);
  //     console.log("Filtered Messages: ", this.filteredMessages);
  //   });

  // }





  private subscribeToMessages(): void {
    if (!this.messageContext || !this.currentUser?.id) return;
    this.messagesSubscription?.unsubscribe();

    const messageSource$ = this.messageDataService.getMessagesForContext(this.messageContext, this.currentUser.id)

    this.messagesSubscription = messageSource$.subscribe((loadedMessages) => {
      this.messages = loadedMessages;
      if (this.isMessage) {
        console.log("this.isMessage: Messages: ", this.messages);
      }
      if (this.isThread) {
        console.log("this.isThreade: Messages: ", this.messages);
      }
      console.log("Messages: ", this.messages);
      console.log("Filtered Messages: ", this.filteredMessages);
    });
  }


  reloadMessages(): void {
    this.subscribeToMessages();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isMessage && (changes['messageContext'] || changes['currentUserId'])) {
      this.subscribeToMessages();
    }

    if (this.isThread &&
      changes['starterMessage'] &&
      this.starterMessage &&
      this.starterMessage.id !== this.lastThreadId
    ) {
      this.setReplyToMessage(this.starterMessage);
      this.lastThreadId = this.starterMessage.id;
    }
  }
  // private loadUsers(): void {
  //   this.userDataService.getUsers().subscribe((loadedUsers) => {
  //     this.users = loadedUsers;
  //     console.log('Users: ', this.users);
  //   });
  // }

  async completeMissingUserFieldsInFirebase(): Promise<void> {
    for (const user of this.users) {
      await this.userDataService.updateUser(user);
      console.log(`User ${user.displayName} aktualisiert`);
    }
    console.log('Alle fehlenden Felder wurden hinzugefügt.');
  }

  // private loadMessages(): void {
  //   this.messageDataService.getMessages().subscribe((loadedMessages) => {
  //     this.messages = loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
  //     console.log('Messages: ', this.messages);
  //   });
  // }

  saveMessage(msg: Message) {
    this.messageDataService.updateMessage(msg);
  }

  openThread(msg: Message) {
    this.threadStart.emit({ starterMessage: msg, userId: this.currentUser.id });
    console.log(msg, this.currentUser.id);
  }

  openUserDialog(userId?: string): void {
    console.log('USerId: ', userId);

    if (!userId) return;
    const user = this.getUserById(userId);
    console.log('USer: ', user);
    console.log('USers: ', this.users);
    if (user) {
      this.dialog.open(DialogUserDetailsComponent, {
        data: user,
      });
    }
  }

  closeThread() {
    this.showThreadChange.emit(false);
  }

  // postThreadMessage() {
  //   if (!this.starterMessage || !this.currentUser) return;

  //   const newMessage = buildNewMessage(
  //     this.textareaContent,
  //     this.currentUser,
  //     this.starterMessage.id,
  //     this.starterMessage.channelId || ''
  //   );

  //   this.messages.push(newMessage);
  //   this.filteredMessages = this.messages.filter(
  //     (m) => m.threadId === this.starterMessage!.id
  //   );
  //   this.clearTextarea();
  // }

  // postMessage() {
  //   if (!this.currentUser) return;

  //   const newMessage = buildNewMessage(
  //     this.textareaContent,
  //     this.currentUser,
  //     '',
  //     this.channelId || ''
  //   );

  //   this.messages.push(newMessage);
  //   this.clearTextarea();
  // }

  setReplyToMessage(msg: Message) {
    this.replyToMessage = msg;

    if (!msg.threadId) {
      msg.threadId = msg.id;
      this.saveMessage(msg);
    }

    this.threadId = msg.threadId;
    this.messagesSubscription?.unsubscribe();

    this.messagesSubscription = this.messageDataService.getMessagesForThread(this.threadId).subscribe((loadedMessages) => {
      this.messages = loadedMessages;
      console.log("Messages setReplyToMessage: ", this.messages);
      this.filteredMessages = [
        msg,
        ...this.messages.filter((m) => m.id !== msg.id
        ),
      ];

      this.threadSymbol = msg.channelId ? '#' : '@';
      this.threadTitle = msg.channelId
        ? this.channels.find((c) => c.id === msg.channelId)?.name ??
        'Unbekannter Kanal'
        : msg.name;

      console.log("Filtered Messages setReplyToMessage: ", this.filteredMessages);

    });


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

    // this.updateSortedEmojis();
    this.saveMessage(msg);
  }

  onEmojiRowMouseLeave(index: number): void {
    this.updateSortedEmojis();
    this.emojiMenuOpen = this.emojiMenuOpen.map(() => false);
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
