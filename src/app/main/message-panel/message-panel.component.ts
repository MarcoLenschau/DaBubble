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
  @Output() contextSelected = new EventEmitter<MessageContext>();
  @Output() threadStart = new EventEmitter<{
    starterMessage: Message;
    userId: string;
  }>();
  @Output() closeThreadPanelWindow = new EventEmitter<void>();
  @Output() starterMessageChange = new EventEmitter<Message>();

  textInput = '';

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
}
