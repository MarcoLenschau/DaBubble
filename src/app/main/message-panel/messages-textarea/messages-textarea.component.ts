import {
  inject,
  Component,
  Input, Output, EventEmitter,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageDataService } from '../../../services/message-data.service';
import { UserDataService } from '../../../services/user-data.service';

import { EMOJIS, Emoji } from '../../../interfaces/emojis-interface';
import { Message } from '../../../models/message.model';
import { Channel } from '../../../models/channel.model';
import { User } from '../../../models/user.model';
import { Reaction } from '../../../interfaces/reaction.interface';
import { MessageContext } from '../../../interfaces/message-context.interface';
import {
  addEmojiToTextarea,
  // currentUser,
  getSortedEmojisForUser,
  updateEmojiDataForUser,
} from '../../../utils/messages-utils';

@Component({
  selector: 'app-messages-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages-textarea.component.html',
  styleUrl: './messages-textarea.component.scss',
})
export class MessagesTextareaComponent implements OnInit, OnDestroy {
  @Input() textInput: string = '';
  @Input() channel?: Channel; // TODO - entweder channel oder nur channel.id holen
  @Input() starterMessage?: Message;
  @Input() mainMessageBoxPadding: string = '2rem';
  @Input() toolbarWidth: string = '100%';
  @Input() placeholder: string = 'Nachricht an...';
  @Input() mode: 'thread' | 'message' = 'message';
  @Input() messageContext?: MessageContext;

  @Output() messageSent = new EventEmitter<void>();

  @ViewChild('editableDiv') editableDiv!: ElementRef<HTMLDivElement>;
  @ViewChild('emojiPicker') emojiPicker!: ElementRef<HTMLDivElement>;


  emojis: Emoji[] = EMOJIS;
  sortedEmojis: Emoji[] = [];
  reaction: Reaction[] = [];
  mainEmojiMenuOpen: boolean = false;
  currentUser: User;

  constructor(private messageDataService: MessageDataService, private userDataService: UserDataService) {
    this.currentUser = this.userDataService.getCurrentUser();
  }

  get isThread(): boolean {
    return this.mode === 'thread';
  }

  get isMessage(): boolean {
    return this.mode === 'message';
  }
  ngOnInit(): void {
    this.updateSortedEmojis();
    document.addEventListener('click', this.handleClickOutside);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside);
  }

  onInput(event: Event): void {
    const content = (event.target as HTMLElement).innerText;
    this.textInput = content;
  }

  toggleMainEmojiMenu = (event: MouseEvent): void => {
    this.mainEmojiMenuOpen = !this.mainEmojiMenuOpen;
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

    const clickedInsidePicker =
      this.emojiPicker?.nativeElement?.contains(target);
    const clickedOnSmiley = this.editableDiv?.nativeElement?.contains(target);

    if (!clickedInsidePicker && !clickedOnSmiley) {
      this.mainEmojiMenuOpen = false;
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
    if (this.mode === 'message' && this.messageContext?.type === 'channel' && this.messageContext.id) {
      return this.messageContext.id;
    }
    return '';
  }

  private buildMessage(
    text: string,
    threadId: string,
    channelId: string
  ): Message {
    const isDirect = this.messageContext?.type === 'direct';
    return new Message({
      name: this.currentUser!.displayName,
      timestamp: Date.now(),
      text,
      userId: this.currentUser!.id,
      receiverId: isDirect ? this.messageContext!.id : '',
      isDirectMessage: isDirect,
      threadId,
      channelId,
      reactions: this.reaction || {},
    });
  }

  private resetInputField(): void {
    this.textInput = '';
    this.editableDiv.nativeElement.innerHTML = '';
  }
}
