import { Component } from '@angular/core';
import { DevspaceComponent } from './devspace/devspace.component';
import { CommonModule } from '@angular/common';
import { Message } from '../models/message.model';
import { MessageWindowComponent } from './message-window/message-window.component';
import { ThreadWindowComponent } from './thread-window/thread-window.component';

@Component({
  selector: 'app-main',
  imports: [
    DevspaceComponent,
    MessageWindowComponent,
    ThreadWindowComponent,
    CommonModule,
    MessageWindowComponent,
    ThreadWindowComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  showThread = false;
  activeChannel: string | null = null;
  starterMessage?: Message;
  userId?: string;

  onThreadStart(event: { starterMessage: Message; userId: string }) {
    this.starterMessage = event.starterMessage;
    this.userId = event.userId;
    this.showThread = true;
  }

  onThreadClose() {
    this.showThread = false;
  }

  onChannelSelected(channel: string){
    this.activeChannel = channel;
  }
}
