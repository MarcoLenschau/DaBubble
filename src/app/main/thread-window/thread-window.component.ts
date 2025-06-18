import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Message } from '../../core/models/message.model';
import { MessagePanelComponent } from '../message-panel/message-panel.component';
import { ViewMode } from '../../core/enums/view-mode.enum';

@Component({
  selector: 'app-thread-window',
  imports: [MessagePanelComponent],
  templateUrl: './thread-window.component.html',
  styleUrl: './thread-window.component.scss',
})
export class ThreadWindowComponent {
  @Input() mode: 'message' | 'thread' = 'message';
  @Input() starterMessage?: Message;
  @Input() userId?: string;
  @Input() viewMode!: ViewMode;

  @Output() showThreadClosing = new EventEmitter<boolean>();
  @Output() starterMessageChange = new EventEmitter<Message>();

  onInnerClose() {
    this.showThreadClosing.emit(false);
  }

  onStarterMessageChangeFromPanel(updatedMessage: Message) {
    this.starterMessage = { ...updatedMessage };
    this.starterMessageChange.emit(this.starterMessage);
  }
}
