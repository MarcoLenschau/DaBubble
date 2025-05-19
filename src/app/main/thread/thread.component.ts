import { CommonModule, NgClass } from '@angular/common';
import { Component, Input, EventEmitter, Output } from '@angular/core';
import { ThreadMessage } from '../../models/thread-message.model';
import { DialogUserDetailsComponent } from '../../dialogs/dialog-user-details/dialog-user-details.component';
import { MatDialog } from '@angular/material/dialog';
import { EMOJIS, Emoji } from '../../interfaces/emojis';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-thread',
  imports: [NgClass, CommonModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent {
  hoveredIndex: number | null = null;
  tooltipHoveredIndex: number | null = null;
  tooltipText = 'hat';

  showThread = true;
  emojiMenuOpen: boolean[] = [];

  users: User[] = [
    {
      id: 'user1',
      name: 'Noah Braun',
      email: 'noah@example.com',
      img: 'noah.jpg',
    },
    {
      id: 'user2',
      name: 'Sofia Müller',
      email: 'sofia@example.com',
      img: 'sofia.jpg',
    },
    {
      id: 'user3',
      name: 'Anna Müller',
      email: 'anna@example.com',
      img: 'anna.jpg',
    },
    {
      id: 'user4',
      name: 'Frederik Beck',
      email: 'frederik@example.com',
      img: 'frederik.jpg',
    },
    {
      id: 'user5',
      name: 'Lena Schmidt',
      email: 'lena@example.com',
      img: 'lena.jpg',
    },
    {
      id: 'user6',
      name: 'Martin Kurz',
      email: 'martin@example.com',
      img: 'martin.jpg',
    },
  ];

  currentUser: User = {
    id: 'user4',
    name: 'Frederik Beck',
    email: 'frederik@example.com',
    img: 'frederik.jpg',
  };

  @Input() starterMessage?: ThreadMessage;
  @Input() userId?: string;

  @Output() showThreadChange = new EventEmitter<boolean>();

  emojis: Emoji[] = EMOJIS;

  constructor(private dialog: MatDialog) {}

  // this.messageService.getMessages().subscribe((msgs) => {
  //   this.messages = msgs;
  //   this.emojiMenuOpen = this.messages.map(() => false);   // um emojiMenuOpen auf die richtige Länge zu bringen !!
  // });

  openUserDialog(userId?: string): void {
    if (!userId) return;
    const user = this.getUserById(userId);
    if (user) {
      this.dialog.open(DialogUserDetailsComponent, {
        data: user,
      });
    }
  }

  getUserById(userId: string): User | undefined {
    return this.users.find((user) => user.id === userId);
  }

  closeThread() {
    this.showThreadChange.emit(false);
  }

  // openUserDialog(msg: ThreadMessage): void {
  //   this.dialog.open(DialogUserDetailsComponent, {
  //     data: { name: msg.name, userId: msg.userId },
  //   });
  // }

  setHoverState(index: number | null) {
    this.hoveredIndex = index;

    if (index === null) {
      this.emojiMenuOpen = this.emojiMenuOpen.map(() => false);
    }
  }

  setTooltipHoveredState(index: number | null) {
    this.tooltipHoveredIndex = index;
  }

  closeEmojiRow(event: MouseEvent): void {
    this.emojiMenuOpen = this.emojiMenuOpen.map(() => false);
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

  getEmojiByName(name: string): Emoji | undefined {
    return this.emojis.find((e) => e.name === name);
  }

  toggleEmojiMenu(index: number): void {
    this.emojiMenuOpen[index] = !this.emojiMenuOpen[index];
  }

  getUserNames(userIds: string[]): string[] {
    if (!this.users) return [];

    const names = this.users
      .filter(
        (u): u is User => typeof u.id === 'string' && userIds.includes(u.id)
      )
      .map((u) => this.getDisplayName(u));

    return this.moveCurrentUserToEnd(names);
  }

  moveCurrentUserToEnd(names: string[]): string[] {
    const normalNames = names.filter((name) => name !== 'Du');
    const nameIsCurrentUser = names.includes('Du') ? ['Du'] : [];
    return [...normalNames, ...nameIsCurrentUser];
  }

  getDisplayName(user: User): string {
    return user.id === this.currentUser.id ? 'Du' : user.name;
  }

  formatUserNames(userIds: string[]): string {
    const names = this.getUserNames(userIds);
    if (names.length === 0) return '';
    if (names.length === 1) {
      this.tooltipText = 'hat';
      return names[0];
    }
    this.tooltipText = 'haben';
    return names.slice(0, -1).join(', ') + ' und ' + names[names.length - 1];
  }

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
        { emojiName: 'emoji-thumb', userIds: ['user1', 'user4', 'user6'] },
        { emojiName: 'check-mark', userIds: ['user3'] },
      ],
    },
    {
      id: 'msg2',
      name: 'Sofia Müller',
      timestamp: 1684413060000,
      text: 'Bei uns läuft alles gut.',
      isSelf: false,
      isThreadStarter: false,
      userId: 'user2',
      public: true,
      privateWithSelf: false,
      reactions: [{ emojiName: 'hands-up', userIds: ['user1', 'user6'] }],
    },
    {
      id: 'msg3',
      name: 'Anna Müller',
      timestamp: 1684413420000,
      text: 'Super, dann können wir ja bald mit dem Testing starten! Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      isSelf: false,
      isThreadStarter: false,
      userId: 'user3',
      public: true,
      privateWithSelf: false,
      reactions: [
        { emojiName: 'emoji-nerd', userIds: ['user1', 'user4', 'user6'] },
        { emojiName: 'emoji-rocket', userIds: ['user3'] },
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
      reactions: [
        {
          emojiName: 'emoji-thumb',
          userIds: ['user1', 'user3', 'user4', 'user6'],
        },
        { emojiName: 'hands-up', userIds: ['user3'] },
      ],
    },
    {
      id: 'msg5',
      name: 'Lena Schmidt',
      timestamp: 1684414000000,
      text: 'Könntest du bitte die Dokumentation noch einmal überprüfen? Ich habe einige Fehler gefunden, besonders bei den API-Endpunkten.',
      isSelf: false,
      isThreadStarter: false,
      userId: 'user5',
      public: true,
      privateWithSelf: false,
      reactions: [
        { emojiName: 'emoji-thumb', userIds: ['user4', 'user6'] },
        { emojiName: 'emoji-rocket', userIds: ['user3'] },
      ],
    },
    {
      id: 'msg6',
      name: 'Martin Kurz',
      timestamp: 1684414200000,
      text: 'Ich stimme Lena zu. Lorem ipsum.',
      isSelf: false,
      isThreadStarter: false,
      userId: 'user6',
      public: true,
      privateWithSelf: false,
      reactions: [
        { emojiName: 'check-mark', userIds: ['user3', 'user4', 'user6'] },
      ],
    },
    {
      id: 'msg7',
      name: 'Frederik Beck',
      timestamp: 1684414264000,
      text: 'Lorem ipsum dolor, sit amet. Lorem ipsum dolor sit amet consectetur adipisicing elit.',
      isSelf: true,
      isThreadStarter: false,
      userId: 'user4',
      public: true,
      privateWithSelf: false,
      reactions: [],
    },
  ];
}
