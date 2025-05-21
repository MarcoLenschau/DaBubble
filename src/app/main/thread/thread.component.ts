import { CommonModule, NgClass } from '@angular/common';
import {
  Component,
  Input,
  EventEmitter,
  Output,
  AfterViewInit,
  AfterViewChecked,
  HostListener,
} from '@angular/core';
import { Message } from '../../models/message.model';
import { DialogUserDetailsComponent } from '../../dialogs/dialog-user-details/dialog-user-details.component';
import { MatDialog } from '@angular/material/dialog';
import { EMOJIS, Emoji } from '../../interfaces/emojis-interface';

import {
  users,
  currentUser,
  messages,
  formatTime,
  getEmojiByName,
  getUserById,
  getUserNames,
  formatUserNames,
  isOwnMessage,
  trackByMessageId,
} from './../shared-functions';

@Component({
  selector: 'app-thread',
  imports: [NgClass, CommonModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent implements AfterViewInit, AfterViewChecked {
  @Input() starterMessage?: Message;
  @Input() userId?: string;
  @Output() showThreadChange = new EventEmitter<boolean>();

  users = users;
  currentUser = currentUser;
  messages = messages;
  emojis: Emoji[] = EMOJIS;
  showThread = true;
  emojiMenuOpen: boolean[] = [];
  hoveredIndex: number | null = null;
  tooltipHoveredIndex: number | null = null;
  formattedUserNames: string = '';
  tooltipText: string = '';
  private marked = false;

  constructor(private dialog: MatDialog) {}

  formatTime = formatTime;
  getUserNames = (userIds: string[]) =>
    getUserNames(this.users, userIds, this.currentUser);
  getUserById = (userId: string) => getUserById(this.users, userId);
  formatUserNames = (userIds: string[]) =>
    formatUserNames(this.users, userIds, this.currentUser);
  getEmojiByName = (name: string) => getEmojiByName(this.emojis, name);
  isOwnMessage = (msg: Message) => isOwnMessage(msg, this.currentUser.id);
  trackByMessageId = trackByMessageId;

  openUserDialog(userId?: string): void {
    if (!userId) return;
    const user = this.getUserById(userId);
    if (user) {
      this.dialog.open(DialogUserDetailsComponent, {
        data: user,
      });
    }
  }

  closeThread() {
    this.showThreadChange.emit(false);
  }

  setHoverState(index: number | null) {
    this.hoveredIndex = index;

    if (index === null) {
      this.emojiMenuOpen = this.emojiMenuOpen.map(() => false);
    }
  }

  setTooltipHoveredState(index: number | null, userIds: string[] | null): void {
    this.tooltipHoveredIndex = index;

    if (index !== null && userIds !== null) {
      const result = formatUserNames(this.users, userIds, this.currentUser);
      this.formattedUserNames = result.text;
      this.tooltipText = result.verb;
    }
  }

  toggleEmojiMenu(index: number): void {
    this.emojiMenuOpen[index] = !this.emojiMenuOpen[index];
  }

  closeEmojiRow(event: MouseEvent): void {
    this.emojiMenuOpen = this.emojiMenuOpen.map(() => false);
  }

  // TODO ************************************************************************************************* nicht löschen
  // this.messageService.getMessages().subscribe((msgs) => {
  //   this.messages = msgs;
  //   this.emojiMenuOpen = this.messages.map(() => false);   // um emojiMenuOpen auf die richtige Länge zu bringen !!
  // });

  // TODO ************************************************************************************************* nicht löschen
  // Reihenfolge der genutzten Emojis (2 letztgenutzte zuerst)

  // TODO ************************************************************************************************* nicht löschen
  // get visibleMessages(): Message[] {
  //muss erst umgesetzt werden
  // return this.messages.filter(
  //   (msg) => msg.privateWithSelf === true || msg.public === true
  // );
  // }
  // this.Message = new Message(activeThreadData);

  ngAfterViewInit() {
    this.markLastInRow();
    this.marked = true;
  }

  @HostListener('window:resize')
  onResize() {
    this.markLastInRow();
  }

  ngAfterViewChecked() {
    if (!this.marked) {
      this.markLastInRow();
      this.marked = true;
    }
  }

  markLastInRow() {
    const wrappers: HTMLElement[] = Array.from(
      document.querySelectorAll(
        '.reactions.reactions-left-aligned .bottom-emoji-wrapper'
      )
    );
    if (!wrappers.length) return;

    wrappers.forEach((w) => w.classList.remove('last-in-row'));

    const rowsMap = new Map<number, HTMLElement[]>();
    wrappers.forEach((el) => {
      const top = Math.round(el.getBoundingClientRect().top);
      if (!rowsMap.has(top)) rowsMap.set(top, []);
      rowsMap.get(top)!.push(el);
    });

    rowsMap.forEach((rowElements) => {
      if (rowElements.length < 4) return;
      let lastEl = rowElements[0];
      let maxRight = lastEl.getBoundingClientRect().right;

      for (const el of rowElements) {
        const right = el.getBoundingClientRect().right;
        if (right > maxRight) {
          maxRight = right;
          lastEl = el;
        }
      }
      lastEl.classList.add('last-in-row');
    });
  }
}
