import { Component } from '@angular/core';
import { DevspaceComponent } from './devspace/devspace.component';
import { ThreadComponent } from './thread/thread.component';
import { MessageComponent } from './message/message.component';
import { CommonModule } from '@angular/common';
import { Message } from '../models/message.model';

@Component({
  selector: 'app-main',
  imports: [DevspaceComponent, MessageComponent, ThreadComponent, CommonModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  showThread = false;
  starterMessage?: Message;
  userId?: string;

  onThreadStart(event: { starterMessage: Message; userId: string }) {
    this.starterMessage = event.starterMessage;
    this.userId = event.userId;
    this.showThread = true;
  }
}
