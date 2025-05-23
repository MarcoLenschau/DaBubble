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
import { FormsModule } from '@angular/forms';
import { Message } from '../../models/message.model';
import { DialogUserDetailsComponent } from '../../dialogs/dialog-user-details/dialog-user-details.component';
import { MatDialog } from '@angular/material/dialog';
import { EMOJIS, Emoji } from '../../interfaces/emojis-interface';
import { Channel } from '../../models/channel.model';
import {
  users,
  currentUser,
  messages,
  channels,
  formatTime,
  getEmojiByName,
  getEmojiByUnicode,
  addEmojiToTextarea,
  addEmojiToMessage,
  getUserById,
  getUserNames,
  formatUserNames,
  isOwnMessage,
  trackByMessageId,
  buildNewMessage,
} from './../shared-functions';
import { timestamp } from 'rxjs';

@Component({
  selector: 'app-thread',
  imports: [NgClass, CommonModule, FormsModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent implements AfterViewInit, AfterViewChecked {
  @Input() starterMessage?: Message;
  @Input() userId?: string; //
  @Output() showThreadChange = new EventEmitter<boolean>(); //

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
  // TODO ************************************************************************************************* nicht löschen
  textareaContent: string = ''; // Emojis in Unicode umwandeln?
  private marked = false;
  threadSymbol: '#' | '@' = '#';
  threadTitle: string = '';
  replyToMessage: Message | null = null;
  threadId: string = '';

  constructor(private dialog: MatDialog) {}

  formatTime = formatTime;
  getUserNames = (userIds: string[]) =>
    getUserNames(this.users, userIds, this.currentUser);
  getUserById = (userId: string) => getUserById(this.users, userId);
  formatUserNames = (userIds: string[]) =>
    formatUserNames(this.users, userIds, this.currentUser);
  getEmojiByName = (name: string) => getEmojiByName(this.emojis, name);
  getEmojiByUnicode = (unicode: string) =>
    getEmojiByUnicode(this.emojis, unicode);
  addEmojiToTextarea = (unicodeEmoji: string) => {
    this.textareaContent = addEmojiToTextarea(
      this.textareaContent,
      unicodeEmoji
    );
  };
  handleEmojiClick(emojiName: string, msg: Message) {
    addEmojiToMessage(emojiName, msg, this.currentUser.id);
  }
  isOwnMessage = (msg: Message) => isOwnMessage(msg, this.currentUser.id);
  trackByMessageId = trackByMessageId;

  setReplyToMessage(msg: Message) {
    //Kommt nur in MessageComponent, nicht in ThreadComponent!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    this.replyToMessage = msg;
    this.starterMessage = msg;
    this.threadId = msg.id;
    msg.threadId = msg.id;
    this.messages = this.messages.filter((m) => m.threadId === msg.id);

    this.threadSymbol = msg.channelId ? '#' : '@';
    this.threadTitle = msg.channelId
      ? channels.find((c) => c.id === msg.channelId)?.name ??
        'Unbekannter Kanal'
      : msg.name;

    console.log(`Replying to message ${msg.id} from ${msg.name}`);
    this.replyToMessage = msg;
    console.log('Replying to Message' + msg.id + ' from ' + msg.name);
  }

  cancelReply() {
    this.replyToMessage = null;
  }

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

  clearTextarea() {
    this.textareaContent = '';
    this.replyToMessage = null;
  }

  // TODO ************************************************************************************************* nicht löschen
  postMessage() {
    //für MessageComponent !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    const tempId =
      this.currentUser.name +
      '_' +
      Date.now() +
      '_' +
      Math.floor(Math.random() * 1000);

    let newMessage: Message = {
      id: tempId,
      name: this.currentUser.name,
      timestamp: Date.now(),
      text: this.textareaContent,
      userId: this.currentUser.id,
      threadId: '',
      channelId: '',
      reactions: [],
    };
    this.messages.push(newMessage);
    // this.messages.addMessage(newMessage, 'message-collection');

    this.clearTextarea();
  }

  postThreadMessage() {
    if (!this.starterMessage || !this.currentUser) return;

    const newMessage = buildNewMessage(
      this.textareaContent,
      this.currentUser,
      this.starterMessage.id,
      this.starterMessage.channelId || ''
    );

    // const newMessage: Message = {
    //   id: tempId,
    //   name: this.currentUser.name,
    //   timestamp: Date.now(),
    //   text: this.textareaContent,
    //   userId: this.currentUser.id,
    //   threadId: threadId,
    //   channelId: this.starterMessage.channelId || '',
    //   reactions: [],
    // };

    this.messages.push(newMessage);
    this.clearTextarea();
  }

  get isTextareaFilled(): boolean {
    const textareaContent = this.textareaContent.trim();
    if (!textareaContent || textareaContent.length === 0) return false;

    return textareaContent.length >= 1 && textareaContent.length <= 500;
  }

  get isFormValid(): boolean {
    return this.isTextareaFilled;
  }

  // TODO ************************************************************************************************* nicht löschen
  // this.messageService.getMessages().subscribe((msgs) => {
  //   this.messages = msgs;
  //   this.emojiMenuOpen = this.messages.map(() => false);   // um emojiMenuOpen auf die richtige Länge zu bringen !!
  // });

  // TODO ************************************************************************************************* nicht löschen
  // Top-Emojis: Reihenfolge der genutzten Emojis (2 letztgenutzte zuerst); scrollbar?!
  //   "Standard-Emojis sollten ✅  & 👍  sein,
  // Maximale Anzahl der Emojis:-> Desktop: 20 Emojis max. sichtbar und hinzufügbar-> Mobil: 7 Emojis max. sichtbar + (falls mehr vorhanden sind) , als "8. Button", ein "13 mehr" Button anzeigen."
  // Bottom-Emojis: angezeigte Zahl begrenzen

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
