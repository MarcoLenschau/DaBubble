import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { UserDataService } from '../../../../core/services/user-data.service';
import { FirebaseService } from '../../../../core/services/firebase.service';
import { MessageDataService } from '../../../../core/services/message-data.service';
import { MessageEventService } from '../../../../core/services/message-event.service';

import { DialogUserDetailsComponent } from '../../../../dialogs/dialog-user-details/dialog-user-details.component';
import { AudioMessageComponent } from '../audio-message/audio-message.component';


import { Message } from '../../../../core/models/message.model';
import { User } from '../../../../core/models/user.model';
import { Emoji } from '../../../../core/interfaces/emojis.interface';
import { ViewMode } from '../../../../core/enums/view-mode.enum';
import { Reaction } from '../../../../core/interfaces/reaction.interface';

import { isOwnMessage, getUserById, setTooltipHoveredState, } from '../../../../core/utils/messages.utils';
import { formatRelativeTimeSimple, formatTime } from '../../../../core/utils/date.utils';
import { addEmojiToMessage, getVisibleReactions, getHiddenReactionCount, shouldShowCollapseButton, getEmojiByName, applyTooltipOverflowAdjustment, } from '../../../../core/utils/emojis.utils';

@Component({
  selector: 'app-single-message',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, AudioMessageComponent],
  templateUrl: './single-message.component.html',
  styleUrl: './single-message.component.scss'
})
export class SingleMessageComponent {

  @Input() currentUser!: User;
  @Input() msg!: Message;
  @Input() i!: number;
  @Input() users!: User[];
  @Input() isThread!: boolean;
  @Input() isMessage!: boolean;
  @Input() messages!: Message[];
  @Input() emojis: Emoji[] = [];
  @Input() sortedEmojis: Emoji[] = [];
  @Input() viewMode: ViewMode = ViewMode.Desktop;
  @Input() openEmojiIndex!: number | null;



  @Output() messageEdited = new EventEmitter<{ index: number; newText: string; isThread: boolean }>();
  @Output() threadStart = new EventEmitter<{ starterMessage: Message; userId: string }>();
  @Output() emojiUsageChanged = new EventEmitter<{ usage: { [emojiName: string]: number }; recent: string[]; }>();
  // @Output() emojiToggle = new EventEmitter<number>();

  localEmojiStats: { [emojiName: string]: number } = {};
  localRecentEmojis: string[] = [];
  emojiMenuOpen = false;
  // hoveredIndex: number | null = null;
  hovered = false;
  editingMessageId: string | null = null;
  editedText: string = '';
  editMenuOpenIndex: number | null = null; // In SingleMessageComponent
  showAllReactions: { [messageId: string]: boolean } = {};
  tooltipHoveredIndex: number | null = null;
  formattedUserNames: string = '';// In SingleMessageComponent
  tooltipText: string = '';

  private emojiTouched = false;

  constructor(
    private userDataService: UserDataService,
    private firebaseService: FirebaseService,
    private messageDataService: MessageDataService,
    private messageEventService: MessageEventService,
    private dialog: MatDialog, // In SingleMessageComponent
  ) { }

  // get emojiMenuOpen(): boolean {
  //   return this.i === this.openEmojiIndex;
  // }





  // setHoverState(index: number | null) { // In SingleMessageComponent
  //   this.hoveredIndex = index;
  //   if (index === null) {
  //     this.emojiMenuOpen = false;
  //   }
  // }

  onMouseEnter(): void {
    this.hovered = true;
  }

  onMouseLeave(): void {
    this.hovered = false;
    this.closeEmojiMenu();
  }

  closeEmojiMenu(): void {
    this.emojiMenuOpen = false;
  }

  onTouchStart(): void {
    this.hovered = !this.hovered;
    // !this.hovered ? this.closeEmojiMenu() : null;
  }

  // onTouchStart(event: TouchEvent): void {
  //   event.stopPropagation();
  //   this.touchOnMessage.emit();
  // }

  toggleEmojiMenu(): void { // In SingleMessageComponent
    this.emojiMenuOpen = !this.emojiMenuOpen;
  }

  // toggleEmojiMenu(): void {
  //   this.emojiToggle.emit(this.i);
  // }

  // closeEmojiRow(event: MouseEvent): void { // In SingleMessageComponent
  //   this.emojiMenuOpen = false;
  // }

  handleEmojiTouch(emojiName: string, msg: Message, event: TouchEvent): void {
    event.preventDefault();
    this.emojiTouched = true;
    this.handleEmojiClick(emojiName, msg);
    this.onEmojiRowMouseLeave();
  }

  async handleEmojiClick(emojiName: string, msg: Message, reactionIndex?: number): Promise<void> {
    if (this.emojiTouched) {
      this.emojiTouched = false;
      return;
    }
    this.messageEventService.disableAutoScroll();
    const wasAlreadyReacted = this.userHasReactedToEmoji(msg, emojiName, this.currentUser.id);
    const updatedMsg = addEmojiToMessage(emojiName, msg, this.currentUser.id);
    const isReactedNow = this.userHasReactedToEmoji(updatedMsg, emojiName, this.currentUser.id);

    if (!wasAlreadyReacted && isReactedNow) {

      this.localEmojiStats[emojiName] = (this.localEmojiStats[emojiName] ?? 0) + 1;
      if (this.localRecentEmojis[0] !== emojiName) {
        this.localRecentEmojis = [
          emojiName,
          ...this.localRecentEmojis.filter((e) => e !== emojiName)
        ];
      }
    }
    await this.messageDataService.updateMessage(msg);
    if (reactionIndex !== undefined) {
      const reaction = updatedMsg.reactions.find(r => r.emojiName === emojiName);

      if (reaction) {
        this.setTooltipHoveredState(reactionIndex, reaction.userIds, this);
      } else {
        this.setTooltipHoveredState(null, null, this);
      }
    }
  }

  userHasReactedToEmoji(msg: Message, emojiName: string, userId: string): boolean {
    return msg.reactions.some((r) => r.emojiName === emojiName && r.userIds.includes(userId));
  }

  async onEmojiRowMouseLeave(): Promise<void> {
    const hasEmojiUpdates =
      Object.keys(this.localEmojiStats).length > 0 ||
      this.localRecentEmojis.length > 0;

    if (hasEmojiUpdates) {
      this.emojiUsageChanged.emit({
        usage: this.localEmojiStats,
        recent: this.localRecentEmojis,
      });
    }

    this.emojiMenuOpen = false;
  }





  openUserDialog(userId?: string): void { // In SingleMessageComponent
    if (!userId) return;
    const user = this.getUserById(userId);
    if (user) {
      this.dialog.open(DialogUserDetailsComponent, { data: user });
    }
  }






  handleEditClick(msg: Message, index: number): void { // In SingleMessageComponent
    this.startEditing(msg);
    this.editMenuOpenIndex = null;
  }

  toggleEditMenu(index: number): void { // In SingleMessageComponent
    this.editMenuOpenIndex = this.editMenuOpenIndex === index ? null : index;
  }

  startEditing(msg: Message): void { // In SingleMessageComponent
    this.editingMessageId = msg.id;
    this.editedText = msg.text;
  }

  cancelEditing(): void { // In SingleMessageComponent
    this.editingMessageId = null;
    this.editedText = '';
  }

  saveEditedMessage(msg: Message, index: number): void { // In SingleMessageComponent
    const trimmed = this.editedText.trim();
    if (!trimmed || trimmed === msg.text) {
      this.cancelEditing();
      return;
    }

    const updatedMessage = { ...msg, text: trimmed };
    // this.messages[index] = { ...this.messages[index], text: trimmed };
    this.messageEdited.emit({ index, newText: trimmed, isThread: this.isThread });
    this.cancelEditing();
    this.messageEventService.disableAutoScroll();
    this.messageDataService.updateMessage(updatedMessage).catch(err => {
      console.error('Error saving edited message:', err);
    });
  }

  openThread(msg: Message) {
    this.threadStart.emit({ starterMessage: msg, userId: this.currentUser.id });
  }

  getVisibleReactions(message: Message): Reaction[] {
    return getVisibleReactions(message, !!this.showAllReactions[message.id], this.viewMode, this.isThread);
  }

  getHiddenReactionCount(message: Message): number {
    return getHiddenReactionCount(message, !!this.showAllReactions[message.id], this.viewMode, this.isThread);
  }

  shouldShowCollapseButton(message: Message): boolean {
    return shouldShowCollapseButton(message, this.showAllReactions, this.viewMode, this.isThread);
  }

  toggleShowAll(messageId: string): void { // In SingleMessageComponent
    this.showAllReactions[messageId] = !this.showAllReactions[messageId];
  }

  onMouseEnterEmojiWrapper(event: MouseEvent, reactionIndex: number) { // In SingleMessageComponent
    const wrapper = event.currentTarget as HTMLElement;
    setTimeout(() => {
      const tooltip = wrapper.querySelector('.bottom-emoji-tooltip');
      const threadMessages = wrapper.closest('.thread-messages');
      if (tooltip && threadMessages) {
        applyTooltipOverflowAdjustment(tooltip as HTMLElement, threadMessages as HTMLElement);
      }
    }, 60);
  }

  isOwnMessage = (msg: Message) => isOwnMessage(msg, this.currentUser.id);
  getUserById = (userId: string) => getUserById(this.users, userId);
  formatRelativeTimeSimple = formatRelativeTimeSimple;
  formatTime = formatTime;
  setTooltipHoveredState = setTooltipHoveredState;
  getEmojiByName = (name: string) => getEmojiByName(this.emojis, name);
}
