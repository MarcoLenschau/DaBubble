import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Message } from '../../core/models/message.model';
import { MessagesComponent } from './messages/messages.component';
import { MessagesHeaderComponent } from './messages-header/messages-header.component';
import { MessagesTextareaComponent } from './messages-textarea/messages-textarea.component';
import { MessageContext } from '../../core/interfaces/message-context.interface';
import { NgClass } from '@angular/common';
import { ViewMode } from '../../core/enums/view-mode.enum';
import { User } from '../../core/models/user.model';
import { Channel } from '../../core/models/channel.model';
import { Emoji } from '../../core/interfaces/emojis.interface';

@Component({
  selector: 'app-message-panel',
  imports: [
    MessagesHeaderComponent,
    MessagesComponent,
    MessagesTextareaComponent,
    NgClass,
  ],
  templateUrl: './message-panel.component.html',
  styleUrl: './message-panel.component.scss',
})
export class MessagePanelComponent {
  @Input() starterMessage?: Message;
  @Input() userId?: string;
  @Input() mode: 'thread' | 'message' = 'message';
  @Input() activeChannel: Channel | null = null;
  @Input() activeUser: User | null = null;
  @Input() messageContext?: MessageContext;
  @Input() viewMode!: ViewMode;
  // @Input() sortedEmojis: Emoji[] = [];
  @Output() contextSelected = new EventEmitter<MessageContext>();
  @Output() threadStart = new EventEmitter<{
    starterMessage: Message;
    userId: string;
  }>();
  @Output() closeThreadPanelWindow = new EventEmitter<void>();
  @Output() starterMessageChange = new EventEmitter<Message>();
  // @Output() emojiUsageChanged = new EventEmitter<{
  //   usage: {
  //     [key: string]: number
  //   };
  //   recent: string[]
  // }>();

  @ViewChild(MessagesComponent) messagesComponent!: MessagesComponent;


  textInput = '';
  sortedEmojis: Emoji[] = [];
  emojiUsage: { [emojiName: string]: number } = {};
  recentEmojis: string[] = [];

  get isThread(): boolean {
    return this.mode === 'thread';
  }

  get isMessage(): boolean {
    return this.mode === 'message';
  }

  /**
   * Emits the threadStart event when a message should start a thread.
   * @param message - The message to start the thread from.
   * @param userId - ID of the current user.
   */
  onStartThread(message: Message, userId: string) {
    this.threadStart.emit({ starterMessage: message, userId });
  }

  /**
   * Updates the starter message and emits the change.
   * @param updatedMessage - The new message object.
   */
  onStarterMessageChange(updatedMessage: Message) {
    this.starterMessage = { ...updatedMessage };
    this.starterMessageChange?.emit(this.starterMessage);
  }

  /**
   * Emits the event to close the thread panel.
   */
  onCloseClick() {
    this.closeThreadPanelWindow.emit();
  }

  /**
   * Emits the selected context from the header component.
   * @param context - The selected message context.
   */
  onContextSelectedFromHeader(context: MessageContext): void {
    this.contextSelected.emit(context);
  }

  /**
   * Updates the list of sorted emojis used for rendering the emoji picker.
   *
   * @param emojis - The updated list of sorted emojis.
   */
  onSortedEmojisChange(emojis: Emoji[]): void {
    this.sortedEmojis = [...emojis];
  }

  /**
   * Forwards the updated emoji usage and recent emoji data to the parent MessagesComponent.
   * Called when a child component (e.g., MessagesTextareaComponent) emits updated emoji stats.
   *
   * @param event - Contains the full emoji usage map and a list of recently used emoji names
   */
  onEmojiUsageChanged(event: { usage: { [emojiName: string]: number }; recent: string[] }) {
    this.messagesComponent.onEmojiUsageChanged(event);
  }

  /**
   * Updates the local emoji usage and recent emoji list.
   * Called when the parent component emits updated emoji stats to synchronize with this child.
   *
   * @param event - Contains the updated emoji usage and recent emoji names for the current user
   */
  onEmojiStatsChanged(event: { usage: any; recent: string[] }) {
    this.emojiUsage = event.usage;
    this.recentEmojis = event.recent;
  }

}
