import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

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
  styleUrls: ['./single-message.component.scss']
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
  @Input() activeUser: User | null = null;
  @Output() messageEdited = new EventEmitter<{ index: number; newText: string; isThread: boolean }>();
  @Output() threadStart = new EventEmitter<{ starterMessage: Message; userId: string }>();
  @Output() emojiUsageChanged = new EventEmitter<{ usage: { [emojiName: string]: number }; recent: string[]; }>();

  localEmojiStats: { [emojiName: string]: number } = {};
  localRecentEmojis: string[] = [];
  emojiMenuOpen = false;
  hovered = false;
  editingMessageId: string | null = null;
  editedText: string = '';
  editMenuOpenIndex: number | null = null;
  showAllReactions: { [messageId: string]: boolean } = {};
  tooltipHoveredIndex: number | null = null;
  formattedUserNames: string = '';
  tooltipText: string = '';

  private emojiTouched = false;
  private emojiClicked = false;

  constructor(
    private messageDataService: MessageDataService,
    private messageEventService: MessageEventService,
    private dialog: MatDialog,
  ) { }

  /**
   * Sets hovered state to true.
   * This triggers background highlight on the message and makes the emoji row visible.
   */
  onMouseEnter(): void {
    this.hovered = true;
  }

  /**
   * Sets hovered state to false and closes the emoji menu if open.
   * This removes the background highlight and hides the emoji row.
   */
  onMouseLeave(): void {
    this.hovered = false;
    this.closeEmojiMenu();
  }

  /**
   * Toggles hovered state on touch start.
   * This toggles background highlight and emoji row visibility,
   * adapting for touch devices without mouse events.
   */
  onTouchStart(): void {
    this.hovered = !this.hovered;
  }

  /**
   * Closes the emoji menu by setting emojiMenuOpen to false.
   */
  closeEmojiMenu(): void {
    this.emojiMenuOpen = false;
  }

  /**
 * Toggles the emoji menu open/close state.
 */
  toggleEmojiMenu(): void {
    this.emojiMenuOpen = !this.emojiMenuOpen;
  }

  /**
   * Handles touch event on an emoji. Prevents default behavior, sets emojiTouched flag,
   * processes emoji click logic, and triggers emoji row mouse leave handling.
   * 
   * @param emojiName - Name of the emoji clicked.
   * @param msg - The message object.
   * @param event - The touch event triggering this handler.
   */
  handleEmojiTouch(emojiName: string, msg: Message, event: TouchEvent): void {
    event.preventDefault();
    this.emojiTouched = true;
    this.handleEmojiClick(emojiName, msg);
    this.onEmojiRowMouseLeave();
  }

  /**
   * Handles a click on an emoji.
   * Prevents duplicate handling when touched.
   * Updates message reactions and disables auto-scroll.
   * Updates tooltip if reaction index is given.
   *
   * @param emojiName Name of the emoji clicked
   * @param msg The message being reacted to
   * @param reactionIndex Optional index of the reaction for tooltip update
   */
  async handleEmojiClick(emojiName: string, msg: Message, reactionIndex?: number): Promise<void> {
    this.emojiClicked = true;
    if (this.emojiTouched) {
      this.emojiTouched = false;
      return;
    }
    this.messageEventService.disableAutoScroll();
    const updatedMsg = this.processEmojiReaction(emojiName, msg);
    await this.messageDataService.updateMessage(updatedMsg);

    if (reactionIndex !== undefined) {
      this.updateReactionTooltip(updatedMsg, emojiName, reactionIndex);
    }
  }

  /**
   * Processes a user’s emoji reaction on a message.
   * Adds the emoji to the message and updates local stats if it’s a new reaction by the user.
   * 
   * @param emojiName - The emoji name reacted with.
   * @param msg - The message to react to.
   * @returns The updated message including the new emoji reaction.
   */
  private processEmojiReaction(emojiName: string, msg: Message): Message {
    const userId = this.currentUser.id;
    const wasAlreadyReacted = this.userHasReactedToEmoji(msg, emojiName, userId);
    const updatedMsg = addEmojiToMessage(emojiName, msg, userId);
    const isReactedNow = this.userHasReactedToEmoji(updatedMsg, emojiName, userId);

    if (!wasAlreadyReacted && isReactedNow) {
      this.updateLocalEmojiStats(emojiName);
    }
    return updatedMsg;
  }

  /**
   * Updates local emoji statistics and the order of recent emojis.
   * 
   * @param emojiName - The name of the emoji that was added.
   */
  private updateLocalEmojiStats(emojiName: string): void {
    this.localEmojiStats[emojiName] = (this.localEmojiStats[emojiName] ?? 0) + 1;
    if (this.localRecentEmojis[0] !== emojiName) {
      this.localRecentEmojis = [
        emojiName,
        ...this.localRecentEmojis.filter((e) => e !== emojiName)
      ];
    }
  }

  /**
   * Updates the reaction tooltip based on the updated message.
   *
   * @param updatedMsg The message after emoji reaction update
   * @param emojiName The emoji name to update tooltip for
   * @param reactionIndex Index of the reaction to show tooltip on
   */
  private updateReactionTooltip(updatedMsg: Message, emojiName: string, reactionIndex: number): void {
    const reaction = updatedMsg.reactions.find(r => r.emojiName === emojiName);

    if (reaction) {
      this.setTooltipHoveredState(reactionIndex, reaction.userIds, this);
    } else {
      this.setTooltipHoveredState(null, null, this);
    }
  }

  /**
   * Checks if the user has already reacted with the given emoji on the message.
   *
   * @param msg The message to check
   * @param emojiName The emoji name to check for reaction
   * @param userId The user ID to check reaction from
   * @returns True if user reacted with emoji, otherwise false
   */
  userHasReactedToEmoji(msg: Message, emojiName: string, userId: string): boolean {
    return msg.reactions.some((r) => r.emojiName === emojiName && r.userIds.includes(userId));
  }

  /**
   * Emits emoji usage changes if any local updates exist and closes the emoji menu.
   */
  async onEmojiRowMouseLeave(): Promise<void> {
    // const hasEmojiUpdates =
    //   Object.keys(this.localEmojiStats).length > 0 ||
    //   this.localRecentEmojis.length > 0;

    if (this.emojiClicked) {
      this.emojiUsageChanged.emit({
        usage: this.localEmojiStats,
        recent: this.localRecentEmojis,
      });
    }
    this.emojiClicked = false;
    this.emojiMenuOpen = false;
  }

  /**
   * Opens a dialog to show user details by user ID.
   */
  openUserDialog(): void {
    const dialogDetails = this.dialog.open(DialogUserDetailsComponent);
    dialogDetails.componentInstance.directMessage = true;
    dialogDetails.componentInstance.user = this.activeUser;
  }

  /**
   * Starts editing the given message and closes the edit menu.
   */
  handleEditClick(msg: Message, index: number): void {
    this.startEditing(msg);
    this.editMenuOpenIndex = null;
  }

  /**
   * Toggles the visibility of the edit menu for a message.
   */
  toggleEditMenu(index: number): void {
    this.editMenuOpenIndex = this.editMenuOpenIndex === index ? null : index;
  }

  /**
   * Starts editing by setting the editing message ID and initializing edited text.
   */
  startEditing(msg: Message): void {
    this.editingMessageId = msg.id;
    this.editedText = msg.text;
  }

  /**
   * Cancels the current editing operation.
   */
  cancelEditing(): void {
    this.editingMessageId = null;
    this.editedText = '';
  }

  /**
   * Saves the edited message if the text was changed and not empty.
   * Emits an event to update the message and disables auto-scroll.
   * Logs an error if update fails.
   */
  saveEditedMessage(msg: Message, index: number): void {
    const trimmed = this.editedText.trim();
    if (!trimmed || trimmed === msg.text) {
      this.cancelEditing();
      return;
    }
    const updatedMessage = { ...msg, text: trimmed };
    this.messageEdited.emit({ index, newText: trimmed, isThread: this.isThread });
    this.cancelEditing();
    this.messageEventService.disableAutoScroll();
    this.messageDataService.updateMessage(updatedMessage).catch(err => {
      console.error('Error saving edited message:', err);
    });
  }

  /**
   * Emits an event to open a thread starting from the given message.
   */
  openThread(msg: Message) {
    this.threadStart.emit({ starterMessage: msg, userId: this.currentUser.id });
  }

  /**
   * Returns the visible reactions for a message.
   */
  getVisibleReactions(message: Message): Reaction[] {
    return getVisibleReactions(message, !!this.showAllReactions[message.id], this.viewMode, this.isThread);
  }

  /**
   * Returns the count of hidden reactions for a message.
   */
  getHiddenReactionCount(message: Message): number {
    return getHiddenReactionCount(message, !!this.showAllReactions[message.id], this.viewMode, this.isThread);
  }

  /**
   * Determines if the collapse button should be shown for a message's reactions.
   */
  shouldShowCollapseButton(message: Message): boolean {
    return shouldShowCollapseButton(message, this.showAllReactions, this.viewMode, this.isThread);
  }

  /**
   * Toggles whether all reactions for a message are shown or collapsed.
   */
  toggleShowAll(messageId: string): void {
    this.showAllReactions[messageId] = !this.showAllReactions[messageId];
  }

  /**
   * Adjusts tooltip overflow on mouse enter for emoji wrappers.
   */
  onMouseEnterEmojiWrapper(event: MouseEvent, reactionIndex: number) {
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
