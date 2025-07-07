import {
  Component, Input, Output, EventEmitter, OnChanges, OnInit, ViewChildren, ViewChild, ElementRef, QueryList, OnDestroy, SimpleChanges,
} from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom, filter } from 'rxjs';
import { distinctUntilChanged, skip } from 'rxjs/operators';
import { FirebaseService } from '../../../core/services/firebase.service';
import { UserDataService } from '../../../core/services/user-data.service';
import { MessageDataService } from '../../../core/services/message-data.service';
import { MessageEventService } from '../../../core/services/message-event.service';
import { ViewMode } from '../../../core/enums/view-mode.enum';
import { User } from '../../../core/models/user.model';
import { Message } from '../../../core/models/message.model';
import { Channel } from '../../../core/models/channel.model';
import { MessageContext } from '../../../core/interfaces/message-context.interface';
import { Emoji, EMOJIS } from '../../../core/interfaces/emojis.interface';
import { formatDate, isNewDay, formatRelativeDayLowercaseNoTime } from '../../../core/utils/date.utils';
import { getUserNames, formatUserNames, trackByMessageId, areUsersEqual, updateRepliesCountIfNeeded, } from '../../../core/utils/messages.utils';
import { getEmojiByUnicode, getSortedEmojisForUser, mergeEmojiUsageMaps } from '../../../core/utils/emojis.utils';
import { scrollToBottom } from '../../../core/utils/scroll.utils';
import { SingleMessageComponent } from "./single-message/single-message.component";

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, SingleMessageComponent,],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent implements OnChanges, OnInit, OnDestroy {
  @Input() starterMessage?: Message;
  @Input() userId?: string;
  @Input() mode: 'thread' | 'message' = 'message';
  @Input() activeChannel: Channel | null = null;
  @Input() activeUser: User | null = null;
  @Input() messageContext?: MessageContext;
  @Input() viewMode: ViewMode = ViewMode.Desktop;
  @Output() showThreadChange = new EventEmitter<boolean>();
  @Output() threadStart = new EventEmitter<{ starterMessage: Message; userId: string }>();
  @Output() starterMessageChange = new EventEmitter<Message>();
  @Output() sortedEmojisChange = new EventEmitter<Emoji[]>();
  @Output() emojiStatsChanged = new EventEmitter<{ usage: { [emojiName: string]: number }; recent: string[]; }>();
  @ViewChildren('emojiTooltip') emojiTooltips!: QueryList<ElementRef>;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  users: User[] = [];
  currentUser!: User;
  messages: Message[] = [];
  threadMessages: Message[] = [];
  channels: Channel[] = [];
  emojis: Emoji[] = EMOJIS;
  sortedEmojis: Emoji[] = [];
  filteredMessages: Message[] = [];
  openEmojiIndex: number | null = null;
  textareaContent: string = '';
  threadSymbol: '#' | '@' = '#';
  threadTitle: string = '';
  replyToMessage: Message | null = null;
  threadId: string = '';
  channelId: string = '';
  messagesReady = false;
  private previousContextJson = '';
  private shouldScrollAfterUpdate: boolean = true;
  private threadShouldScrollAfterUpdate: boolean = false;
  private messagesSubscription?: Subscription;
  private threadMessagesSubscription?: Subscription;
  private currentUserSubscription?: Subscription;
  private localEmojiStats: { [emojiName: string]: number } = {};
  private localRecentEmojis: string[] = [];

  constructor(
    private userDataService: UserDataService,
    private firebaseService: FirebaseService,
    private messageDataService: MessageDataService,
    private messageEventService: MessageEventService,
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

  /**
   * Lifecycle hook that is called after data-bound properties are initialized.
   * Initializes the current user, emoji data, subscriptions, and loads user data.
   */
  async ngOnInit(): Promise<void> {
    await this.initCurrentUserAndEmojiData();
    this.subscribeToMessages();
    this.subscribeToCurrentUserChanges();
    this.loadAllUsers();
  }

  /**
   * Loads the current user once (skipping the 'default' placeholder),
   * and initializes emoji usage and sorting data.
   */
  private async initCurrentUserAndEmojiData(): Promise<void> {
    const firstUser = await firstValueFrom(
      this.userDataService.currentUser$.pipe(
        filter(user => !!user && user.id !== 'default')
      )
    );
    this.currentUser = firstUser;
    this.updateSortedEmojis();
    this.initializeLocalEmojiData();
  }

  /**
   * Subscribes to currentUser$ stream to detect and apply user changes
   * after the initial load. Uses shallow comparison to prevent unnecessary updates.
   */
  private subscribeToCurrentUserChanges(): void {
    this.currentUserSubscription = this.userDataService.currentUser$
      .pipe(skip(1), distinctUntilChanged((a, b) => areUsersEqual(a, b)))
      .subscribe(user => this.currentUser = user);
  }

  /**
   * Loads the list of all users from the backend (e.g., Firebase).
   * The result is assigned to the `users` array.
   */
  private async loadAllUsers(): Promise<void> {
    firstValueFrom(this.userDataService.getUsers()).then(users => this.users = users);
  }

  /**
   * Initializes the local emoji state based on the current user's data.
   * Fills localRecentEmojis and localEmojiStats from the current user object.
   */
  private initializeLocalEmojiData(): void {
    this.localRecentEmojis = [...(this.currentUser.recentEmojis ?? [])];
    this.localEmojiStats = { ...this.currentUser.emojiUsage ?? {} };
  }

  /**
   * Called when the scroll container is scrolled.
   */
  onScroll(): void {
    const container = this.scrollContainer.nativeElement;
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   * Cleans up all active subscriptions to avoid memory leaks.
   */
  ngOnDestroy() {
    this.messagesSubscription?.unsubscribe();
    this.threadMessagesSubscription?.unsubscribe();
    this.currentUserSubscription?.unsubscribe();
  }

  /**
   * Lifecycle hook that is called when any data-bound input properties change.
   * Reacts to changes in the message context and starter message to reload messages or update reply targets.
   * 
   * @param changes - Object containing the changed input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    const currentJson = JSON.stringify(this.messageContext ?? {});
    if (
      this.isMessage &&
      currentJson !== this.previousContextJson
    ) {
      this.previousContextJson = currentJson;
      this.subscribeToMessages();
    }
    if (this.isThread && changes['starterMessage'] && this.starterMessage) {
      this.setReplyToMessage(this.starterMessage);
    }
  }

  /**
   * Subscribes to the message stream for the current message context.
   * Unsubscribes from previous subscriptions and handles new incoming messages.
   */
  private subscribeToMessages(): void {
    if (!this.messageContext || !this.currentUser?.id) return;
    this.messagesSubscription?.unsubscribe();
    this.messagesReady = false;
    const messageSource$ = this.messageDataService.getMessagesForContext(
      this.messageContext, this.currentUser.id
    );
    this.messagesSubscription = messageSource$.subscribe((loadedMessages) => {
      this.handleLoadedMessages(loadedMessages);
    });
  }

  /**
   * Processes the loaded messages. If the data is valid, it updates the message list;
   * otherwise it logs a warning and resets the message state.
   * 
   * @param loadedMessages - The incoming message data to validate and apply.
   */
  private handleLoadedMessages(loadedMessages: unknown): void {
    if (!Array.isArray(loadedMessages)) {
      console.warn('[MessagesComponent] WARNING: loadedMessages ist kein Array:', loadedMessages);
      this.messages = [];
      this.messagesReady = true;
      return;
    }
    this.messages = loadedMessages;
    this.finalizeMessageHandling();
  }

  /**
   * Finalizes the message update process by setting scroll position
   * and marking the messages as ready for display.
   */
  private finalizeMessageHandling(): void {
    setTimeout(() => {
      if (this.shouldScrollAfterUpdate && this.scrollContainer?.nativeElement) {
        scrollToBottom(this.scrollContainer.nativeElement);
      }
      this.messagesReady = true;
    }, 0);
  }

  /**
   * Sets the given message as the reply target, ensures threadId,
   * unsubscribes previous thread subscription and starts a new one.
   * 
   * @param msg - The message that will become the root of the thread.
   */
  async setReplyToMessage(msg: Message) {
    this.replyToMessage = msg;
    this.messagesReady = false;
    await this.ensureThreadId(msg);

    this.threadMessagesSubscription?.unsubscribe();
    this.starterMessage = { ...msg };
    this.subscribeToThreadMessages(msg);
  }

  /**
   * Ensures that the given message has a valid threadId and sets it if missing.
   * 
   * @param msg - The message to verify or assign a threadId to.
   */
  private async ensureThreadId(msg: Message): Promise<void> {
    if (!msg.threadId) {
      msg.threadId = msg.id;
      await this.messageDataService.updateMessage(msg);
    }
    this.threadId = msg.threadId;
  }

  /**
   * Subscribes to messages in the thread and handles message updates, reply counts and auto-scrolling.
   * 
   * @param msg - The root message of the thread.
   */
  private subscribeToThreadMessages(msg: Message): void {
    let isFirst = true;
    this.threadMessagesSubscription = this.messageDataService.getMessagesForThread(this.threadId).subscribe(loadedMessages => {
      this.filteredMessages = loadedMessages;

      if (!isFirst) {
        updateRepliesCountIfNeeded(msg, this.filteredMessages, this.messageDataService);
      }
      isFirst = false;

      this.updateStarterMessageFromLoaded(msg);
      this.scheduleAutoScrollAndMarkReady();
    });
  }

  /**
   * Updates the local starterMessage if name or channelId have changed.
   * 
   * @param msg - The message to match against loaded messages.
   */
  private updateStarterMessageFromLoaded(msg: Message): void {
    const updatedRoot = this.filteredMessages.find(m => m.id === msg.id);
    if (!updatedRoot) return;

    const nameChanged = updatedRoot.name && updatedRoot.name !== this.starterMessage?.name;
    const channelChanged = updatedRoot.channelId && updatedRoot.channelId !== this.starterMessage?.channelId;

    if (nameChanged || channelChanged) {
      const newStarter: Message = { ...updatedRoot };
      this.starterMessage = newStarter;
      this.starterMessageChange.emit(newStarter);
    }
  }

  /**
   * Schedules auto-scrolling and marks the thread messages as ready to display.
   */
  private scheduleAutoScrollAndMarkReady(): void {
    setTimeout(() => {
      if (this.threadShouldScrollAfterUpdate && this.scrollContainer?.nativeElement) {
        scrollToBottom(this.scrollContainer.nativeElement);
      }
      this.messagesReady = true;
    }, 0);
  }

  /**
   * Emits the threadStart event to open a thread with the given message and user.
   * 
   * @param event - Contains the starter message and userId to open the thread.
   */
  openThread(event: { starterMessage: Message; userId: string }) {
    this.threadStart.emit(event);
  }

  /**
   * Emits an event to close the thread view and unsubscribes from thread messages.
   */
  closeThread() {
    this.showThreadChange.emit(false);
    this.threadMessagesSubscription?.unsubscribe();
  }

  /**
   * Updates the local emoji usage and recent emoji list, then persists the changes to the user data.
   * 
   * @param event - Contains updated emoji usage stats and recent emojis list.
   */
  onEmojiUsageChanged(event: { usage: any; recent: string[] }) {
    this.localEmojiStats = mergeEmojiUsageMaps(this.localEmojiStats, event.usage);
    this.localRecentEmojis = event.recent;

    const updatedUser = this.buildUpdatedUser();
    this.persistUpdatedUser(updatedUser);
  }

  /**
   * Creates a new User object with updated emoji usage and recent emojis.
   */
  private buildUpdatedUser(): User {
    return {
      ...this.currentUser,
      emojiUsage: this.localEmojiStats,
      recentEmojis: this.localRecentEmojis
    };
  }

  /**
   * Saves the updated user object locally and in Firebase, then updates the emoji sorting.
   * 
   * @param updatedUser - The user object with updated emoji data.
   */
  private persistUpdatedUser(updatedUser: User): void {
    this.userDataService.setCurrentUser(updatedUser);
    this.firebaseService.updateUser(this.currentUser.id, {
      emojiUsage: this.localEmojiStats,
      recentEmojis: this.localRecentEmojis
    });
    this.currentUser = updatedUser;
    this.updateSortedEmojis(updatedUser);
  }

  /**
   * Updates the sortedEmojis array based on the given user’s emoji data, or falls back to the 
   * current user if none is provided. The sorted emoji list is then emitted via the sortedEmojisChange output.
   *
   * @param user - The user whose emoji data should be used for sorting. Defaults to the current user.
   */
  private updateSortedEmojis(user: User = this.currentUser): void {
    this.sortedEmojis = getSortedEmojisForUser(user, this.emojis);
    this.sortedEmojisChange.emit(this.sortedEmojis);
  }

  /**
   * Updates the text of a message at the given index, depending on whether it's a thread or not.
   * 
   * @param index - Index of the message to update.
   * @param newText - New message content.
   * @param isThread - Whether the message is part of a thread.
   */
  onMessageEdited({ index, newText, isThread }: { index: number; newText: string; isThread: boolean }): void {
    if (isThread) {
      this.filteredMessages[index].text = newText;
    } else {
      this.messages[index].text = newText;
    }
  }

  formatDate = formatDate;
  isNewDay = isNewDay;
  formatRelativeDayLowercaseNoTime = formatRelativeDayLowercaseNoTime;
  getUserNames = (userIds: string[]) => getUserNames(this.users, userIds, this.currentUser);
  formatUserNames = (userIds: string[]) => formatUserNames(this.users, userIds, this.currentUser);
  getEmojiByUnicode = (unicode: string) => getEmojiByUnicode(this.emojis, unicode);
  trackByMessageId = trackByMessageId;
}