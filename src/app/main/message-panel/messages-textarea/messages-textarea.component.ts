import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MessageDataService } from '../../../core/services/message-data.service';
import { UserDataService } from '../../../core/services/user-data.service';
import { EMOJIS, Emoji } from '../../../core/interfaces/emojis-interface';
import { Message } from '../../../core/models/message.model';
import { Channel } from '../../../core/models/channel.model';
import { User } from '../../../core/models/user.model';
import { Reaction } from '../../../core/interfaces/reaction.interface';
import { MessageContext } from '../../../core/interfaces/message-context.interface';
import {
  getSortedEmojisForUser,
  updateEmojiDataForUser,
} from '../../../core/utils/messages-utils';

@Component({
  selector: 'app-messages-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages-textarea.component.html',
  styleUrl: './messages-textarea.component.scss',
})
export class MessagesTextareaComponent implements OnInit, OnDestroy {
  @Input() textInput: string = '';
  @Input() channel?: Channel;
  @Input() starterMessage?: Message;
  @Input() mainMessageBoxPadding: string = '2rem';
  @Input() toolbarWidth: string = '100%';
  @Input() placeholder: string = 'Nachricht an...';
  @Input() mode: 'thread' | 'message' = 'message';
  @Input() messageContext?: MessageContext;

  @Output() messageSent = new EventEmitter<void>();

  @ViewChild('editableDiv') editableDiv!: ElementRef<HTMLDivElement>;
  @ViewChild('emojiPicker') emojiPicker!: ElementRef<HTMLDivElement>;
  @ViewChild('chatDiv') chatDiv!: ElementRef;

  emojis: Emoji[] = EMOJIS;
  sortedEmojis: Emoji[] = [];
  reaction: Reaction[] = [];
  mainEmojiMenuOpen: boolean = false;
  currentUser!: User;

  // User & Mention-Funktion
  allUsers: User[] = [];
  filteredMentionUsers: User[] = [];
  showMentionDropdown = false;
  showUserDropdown = false;
  mentionQuery = '';
  mentionBoxPosition = { top: 0, left: 0 };

  private currentUserSubscription?: Subscription;

  constructor(
    private messageDataService: MessageDataService,
    private userDataService: UserDataService
  ) { }

  get isThread(): boolean {
    return this.mode === 'thread';
  }

  get isMessage(): boolean {
    return this.mode === 'message';
  }

  ngOnInit(): void {
    this.updateSortedEmojis();
    document.addEventListener('click', this.handleClickOutside);

    this.userDataService.getUsers().subscribe((users) => {
      this.allUsers = users;
    });
    this.currentUserSubscription = this.userDataService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside);
    this.currentUserSubscription?.unsubscribe();
  }

  onInput(event: Event): void {
    const text = this.getTextFromEditableDiv();
    this.textInput = text;

    const match = text.match(/@([\wäöüßÄÖÜ\-]*)$/);
    if (match) {
      this.mentionQuery = match[1].toLowerCase();
      this.filteredMentionUsers = this.allUsers.filter((user) =>
        user.displayName.toLowerCase().includes(this.mentionQuery)
      );
      this.showMentionDropdown = this.filteredMentionUsers.length > 0;
      this.setMentionBoxPosition();
    } else {
      this.showMentionDropdown = false;
    }
  }

  getTextFromEditableDiv(): string {
    return this.editableDiv.nativeElement.innerText;
  }

  setMentionBoxPosition() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(true);

    const rect = range.getBoundingClientRect();
    const containerRect = this.editableDiv.nativeElement.getBoundingClientRect();

    this.mentionBoxPosition = {
      top: rect.bottom - containerRect.top + 20,
      left: rect.left - containerRect.left,
    };
  }

  selectMentionUser(user: User) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    range.deleteContents();

    const mentionText = `@${user.displayName} `;
    const currentText = this.getTextFromEditableDiv();
    const newText = currentText.replace(/@[\wäöüßÄÖÜ\-]*$/, mentionText);

    this.editableDiv.nativeElement.innerText = newText;
    this.placeCursorAtEnd(this.editableDiv.nativeElement);

    this.textInput = newText;

    this.showMentionDropdown = false;
    this.filteredMentionUsers = [];

    this.messageContext = {
      type: 'direct',
      id: user.id,
      receiverId: this.currentUser.id,
    };
  }

  toggleUserDropdown(event: MouseEvent): void {
    this.showUserDropdown = !this.showUserDropdown;
    this.showMentionDropdown = false;
    this.mainEmojiMenuOpen = false;
    event.stopPropagation();
  }

  selectUserFromSmiley(user: User): void {
    const mentionText = `@${user.displayName} `;
    const editable = this.editableDiv.nativeElement;
    editable.focus();

    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false);

    const textNode = document.createTextNode(mentionText);
    range.insertNode(textNode);

    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    this.textInput = editable.innerText;
    this.showUserDropdown = false;

    this.messageContext = {
      type: 'direct',
      id: user.id,
      receiverId: this.currentUser.id,
    };
  }

  placeCursorAtEnd(el: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  toggleMainEmojiMenu = (event: MouseEvent): void => {
    this.mainEmojiMenuOpen = !this.mainEmojiMenuOpen;
    this.showUserDropdown = false;
    this.showMentionDropdown = false;
    event.stopPropagation();
  };

  addEmojiToMainMessage(unicodeEmoji: string): void {
    const editable = this.editableDiv.nativeElement;
    editable.focus();
    document.execCommand('insertText', false, unicodeEmoji);
    this.textInput = editable.innerText;

    updateEmojiDataForUser({ id: 'current-user' } as any, unicodeEmoji);
    this.updateSortedEmojis();

    this.mainEmojiMenuOpen = false;
  }

  updateSortedEmojis(): void {
    this.sortedEmojis = getSortedEmojisForUser(
      { id: 'current-user' } as any,
      this.emojis
    );
  }

  private handleClickOutside = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;

    const clickedInsidePicker = this.emojiPicker?.nativeElement?.contains(target);
    const clickedOnInput = this.editableDiv?.nativeElement?.contains(target);

    if (!clickedInsidePicker && !clickedOnInput) {
      this.mainEmojiMenuOpen = false;
      this.showMentionDropdown = false;
      this.showUserDropdown = false;
    }
  };

  async sendMessage(): Promise<void> {
    const text = this.textInput.trim();
    if (!text || !this.currentUser) return;

    const message = this.createMessage(text);

    try {
      await this.messageDataService.addMessage(message);
      this.resetInputField();
      this.messageSent.emit();
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }

    this.updateStarterMessage();
  }


  private createMessage(text: string): Message {
    const threadId = this.findThreadId();
    const channelId = this.findChannelId();
    return this.buildMessage(text, threadId, channelId);
  }

  private findThreadId() {
    if (this.mode === 'thread' && this.starterMessage) {
      return this.starterMessage.threadId || this.starterMessage.id;
    }
    return '';
  }

  private findChannelId() {
    console.log(this.messageContext?.id);
    if (
      this.mode === 'message' &&
      this.messageContext?.type === 'channel' &&
      this.messageContext.id
    ) {
      console.log(this.messageContext?.id);
      console.log(this.messageContext?.type);
      return this.messageContext.id;
    }
    return '';
  }

  private buildMessage(text: string, threadId: string, channelId: string): Message {
    console.log('buildMessage: this.messageContext?.type: ', this.messageContext?.type);

    const isDirect = this.messageContext?.type === 'direct';
    return new Message({
      name: this.currentUser.displayName,
      timestamp: Date.now(),
      text,
      userId: this.currentUser.id,
      receiverId: isDirect ? this.messageContext!.receiverId : '',
      isDirectMessage: isDirect,
      threadId,
      channelId,
      reactions: this.reaction || {},
      replies: 0,
    });
  }

  async updateStarterMessage() {

    if (this.mode === 'thread' && this.starterMessage) {
      this.starterMessage.replies++;
      console.log("Updating StarterMessage-Replies: Adding 1: ", this.starterMessage);


      await this.messageDataService.updateMessageFields(this.starterMessage.id, {
        replies: this.starterMessage.replies,
        lastReplyTimestamp: Date.now(),
      });
    }
  }

  private resetInputField(): void {
    this.textInput = '';
    this.editableDiv.nativeElement.innerHTML = '';
  }

  ngAfterViewInit() {
    this.chatDiv.nativeElement.focus();
  }
}

