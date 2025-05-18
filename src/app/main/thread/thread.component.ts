import { CommonModule, NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ThreadMessage } from '../../models/thread-message.model';

@Component({
  selector: 'app-thread',
  imports: [NgClass, CommonModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent {
  hoveredIndex: number | null = null;
  @Input() starterMessage?: ThreadMessage;
  @Input() userId?: string;

  setHoverState(index: number | null) {
    this.hoveredIndex = index;
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m} Uhr`;
  }

  // get visibleMessages(): ThreadMessage[] {
  //muss erst umgesetzt werden
  // return this.messages.filter(
  //   (msg) => msg.privateWithSelf === true || msg.public === true
  // );
  // }

  // this.threadMessage = new ThreadMessage(activeThreadData);

  messages: ThreadMessage[] = [
    {
      id: 'msg1',
      name: 'Noah Braun',
      timestamp: 1684411440000,
      text: 'Hallo zusammen, wie läuft das aktuelle Projekt bei euch?',
      isSelf: false,
      isThreadStarter: true,
      userId: 'user1',
      public: true,
      privateWithSelf: false,
      reactions: [
        { emoji: '👍', count: 3 },
        { emoji: '❤️', count: 1 },
      ],
    },
    {
      id: 'msg2',
      name: 'Sofia Müller',
      timestamp: 1684413060000,
      text: 'Bei uns läuft alles gut, wir sind fast mit der neuen Funktion fertig.',
      isSelf: false,
      isThreadStarter: false,
      userId: 'user2',
      public: true,
      privateWithSelf: false,
      reactions: [{ emoji: '😊', count: 2 }],
    },
    {
      id: 'msg3',
      name: 'Anna Müller',
      timestamp: 1684413420000,
      text: 'Super, dann können wir ja bald mit dem Testing starten! Lorem ipsum dolor sit, amet consectetur adipisicing elit.',
      isSelf: false,
      isThreadStarter: false,
      userId: 'user3',
      public: true,
      privateWithSelf: false,
      reactions: [
        { emoji: '🔥', count: 4 },
        { emoji: '🎉', count: 1 },
      ],
    },
    {
      id: 'msg4',
      name: 'Frederik Beck',
      timestamp: 1684413840000,
      text: 'Ja genau.',
      isSelf: true,
      isThreadStarter: false,
      userId: 'user4',
      public: true,
      privateWithSelf: false,
      reactions: [],
    },
  ];
}
