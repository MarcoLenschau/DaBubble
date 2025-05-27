import {
  inject,
  Component,
  Input,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageDataService } from '../../../services/message-data.service';

import { EMOJIS, Emoji } from '../../../interfaces/emojis-interface';
import { Message } from '../../../models/message.model';
import { Channel } from '../../../models/channel.model';
import { Reaction } from '../../../interfaces/reaction.interface';
import {
  addEmojiToTextarea,
  currentUser,
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

  @ViewChild('editableDiv') editableDiv!: ElementRef<HTMLDivElement>;
  @ViewChild('emojiPicker') emojiPicker!: ElementRef<HTMLDivElement>;

  constructor(private messageDataService: MessageDataService) {}

  emojis: Emoji[] = EMOJIS;
  sortedEmojis: Emoji[] = [];
  reaction: Reaction[] = [];
  mainEmojiMenuOpen: boolean = false;
  currentUser = currentUser;

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
    this.textInput = editable.innerHTML;

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

    const message = new Message({
      text: text,
      userId: this.currentUser.id,
      name: this.currentUser.displayName,
      timestamp: Date.now(),
      channelId: this.channel?.id || this.starterMessage?.channelId || '',
      threadId: this.starterMessage?.id || '',
      reactions: this.reaction,
    });

    await this.messageDataService.addMessage(message);

    this.textInput = '';
    this.editableDiv.nativeElement.innerHTML = '';
  }
}
