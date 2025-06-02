import { Component } from '@angular/core';
import { DevspaceComponent } from './devspace/devspace.component';
import { CommonModule } from '@angular/common';
import { Message } from '../models/message.model';
import { MessageWindowComponent } from './message-window/message-window.component';
import { ThreadWindowComponent } from './thread-window/thread-window.component';
import { FirebaseService } from '../services/firebase.service';
import { Observable } from 'rxjs';
import { MessageContext } from '../interfaces/message-context.interface';

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
  channels$: Observable<any>;
  channels = [];
  messageContext?: MessageContext

  constructor(private firebase: FirebaseService) {
    this.channels$ = this.firebase.getColRef("channels");
    this.channels$.subscribe((channels) => {
      this.channels = channels;
    })
  }

  onThreadStart(event: { starterMessage: Message; userId: string }) {
    this.starterMessage = { ...event.starterMessage };
    this.userId = event.userId;
    this.showThread = true;
  }

  onThreadClose() {
    this.showThread = false;
    console.log("Close Output has reached MainComponent");

  }

  onChannelSelected(channel: string) {
    this.channels.forEach((channelFromBackend: any) => {
      if (channelFromBackend.id === channel) {
        this.activeChannel = channelFromBackend;
      }
    })
  }

  onContextSelected(context: MessageContext): void {
    this.messageContext = context;
    console.log("MainComponent: Logging MessageContext: ", context);

  }
}
