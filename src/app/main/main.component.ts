import { Component } from '@angular/core';
import { DevspaceComponent } from './devspace/devspace.component';
import { ThreadComponent } from './thread/thread.component';
import { MessageComponent } from './message/message.component';

@Component({
  selector: 'app-main',
  imports: [DevspaceComponent, MessageComponent, ThreadComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  // starterMessage?: ThreadMessage;
  // userId?: string;
  // onThreadStart(event: { starterMessage: ThreadMessage; userId: string }) {
  //   this.starterMessage = event.starterMessage;
  //   this.userId = event.userId;
  // }
}

// message.component.ts
// @Output() threadStart = new EventEmitter<{starterMessage: ThreadMessage, userId: string}>();

// onMessageClick(msg: ThreadMessage) {
//   const currentUserId = 'xyz'; // z.B. aus Auth-Service
//   this.threadStart.emit({ starterMessage: msg, userId: currentUserId });
// }
