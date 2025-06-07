import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Message } from '../../core/models/message.model';
import { MessagesComponent } from './messages/messages.component';
import { MessagesHeaderComponent } from './messages-header/messages-header.component';
import { MessagesTextareaComponent } from './messages-textarea/messages-textarea.component';
import { MessageContext } from '../../core/interfaces/message-context.interface';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-message-panel',
  imports: [
    MessagesComponent,
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
  @Input() activeChannel: string | null = null;
  @Input() messageContext?: MessageContext;
  @Output() contextSelected = new EventEmitter<MessageContext>();
  @Output() threadStart = new EventEmitter<{
    starterMessage: Message;
    userId: string;
  }>();
  @Output() closeThreadPanelWindow = new EventEmitter<void>();

  @ViewChild(MessagesComponent) messagesComponent!: MessagesComponent;

  textInput = '';

  get isThread(): boolean {
    return this.mode === 'thread';
  }

  get isMessage(): boolean {
    return this.mode === 'message';
  }

  onStartThread(message: Message, userId: string) {
    this.threadStart.emit({ starterMessage: message, userId });
  }

  onCloseClick() {
    this.closeThreadPanelWindow.emit();
  }

  onMessageSent() {
    this.messagesComponent.reloadMessages();
  }

  onContextSelectedFromHeader(context: MessageContext): void {
    this.contextSelected.emit(context);
  }
}
