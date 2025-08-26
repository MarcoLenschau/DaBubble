import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Message } from '../../core/models/message.model';
import { MessagePanelComponent } from '../message-panel/message-panel.component';
import { MessageContext } from '../../core/interfaces/message-context.interface';
import { ViewMode } from '../../core/enums/view-mode.enum';
import { User } from '../../core/models/user.model';
import { Channel } from '../../core/models/channel.model';

@Component({
  selector: 'app-message-window',
  imports: [MessagePanelComponent],
  templateUrl: './message-window.component.html',
  styleUrl: './message-window.component.scss',
})
export class MessageWindowComponent {
  @Input() mode: 'message' | 'thread' = 'message';
  @Input() starterMessage?: Message;
  @Input() userId?: string;
  @Input() activeChannel: Channel | null = null;
  @Input() activeUser: User | null = null;
  @Input() messageContext?: MessageContext;
  @Input() viewMode!: ViewMode;
  // @Input() showMessage = true;

  @Output() windowContextSelected = new EventEmitter<MessageContext>();
  @Output() headerUserSelected = new EventEmitter<User>();
  @Output() threadStart = new EventEmitter<{
    starterMessage: Message;
    userId: string;
  }>();
  @Output() showThreadClosing = new EventEmitter<boolean>();

  /**
   * Emits an event to indicate that the thread window should be closed.
   */
  onInnerClose() {
    this.showThreadClosing.emit(false);
  }

  /**
   * Emits an event to open a thread with the given message and user ID.
   * @param message The starter message for the thread.
   * @param userId The ID of the user opening the thread.
   */
  threadOpen(message: Message, userId: string) {
    this.threadStart.emit({ starterMessage: message, userId });
  }

  /**
   * Emits an event when a message context is selected from the panel.
   * @param context The selected message context.
   */
  onContextSelectedFromPanel(context: MessageContext): void {
    this.windowContextSelected.emit(context);
  }

  onUserSelectedFromPanel(user: User) {
    this.headerUserSelected.emit(user);
  }
}
