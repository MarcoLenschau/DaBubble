import { Component } from '@angular/core';
import { DevspaceComponent } from './devspace/devspace.component';
import { ThreadComponent } from './thread/thread.component';
import { MessageComponent } from './message/message.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main',
  imports: [DevspaceComponent, MessageComponent, ThreadComponent, CommonModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  showThread = true;

  // starterMessage?: Message;
  // userId?: string;
  // onThreadStart(event: { starterMessage: Message; userId: string }) {
  //   this.starterMessage = event.starterMessage;
  //   this.userId = event.userId;
  // }
}

// message.component.ts
// @Output() threadStart = new EventEmitter<{starterMessage: Message, userId: string}>();

// onMessageClick(msg: Message) {
//   const currentUserId = 'xyz'; // z.B. aus Auth-Service
//   this.threadStart.emit({ starterMessage: msg, userId: currentUserId });
// }

// export class MessageComponent {
//   @Output() threadStart = new EventEmitter<any>();

//   openThread() {
//     this.threadStart.emit(); // optional mit Daten emitten
//   }
// }
// <div (click)="openThread()">Nachricht öffnen</div>
