import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Message } from '../../models/message.model';
import { MessagePanelComponent } from '../message-panel/message-panel.component';

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
  @Input() activeChannel: string | null = null;
  @Output() threadStart = new EventEmitter<{
    starterMessage: Message;
    userId: string;
  }>();

  threadOpen(message: Message, userId: string) {
    this.threadStart.emit({ starterMessage: message, userId });
  }
}
