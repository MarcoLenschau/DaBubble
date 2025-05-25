import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Message } from '../../models/message.model';
import { MessagePanelComponent } from '../message-panel/message-panel.component';

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
  @Output() showThreadChange = new EventEmitter<boolean>();

  closeThread() {
    this.showThreadChange.emit(false);
  }
}
