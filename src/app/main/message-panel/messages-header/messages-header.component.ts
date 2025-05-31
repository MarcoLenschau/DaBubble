import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../../../models/message.model';
import { FirebaseService } from '../../../services/firebase.service';
import { MessageContext } from '../../../interfaces/message-context.interface';
import { User } from '../../../models/user.model';
import { UserDataService } from '../../../services/user-data.service';
import { ChannelDataService } from '../../../services/channel-data.service';
import { Channel } from '../../../models/channel.model';
import { emitContextSelected } from '../../../utils/messages-utils';

@Component({
  selector: 'app-messages-header',
  standalone: true,
  imports: [NgIf, CommonModule, NgFor, FormsModule],
  templateUrl: './messages-header.component.html',
  styleUrl: './messages-header.component.scss',
})
export class MessagesHeaderComponent {
  @Input() mode: 'thread' | 'message' = 'message';
  @Input() starterMessage?: Message;
  @Input() activeChannel: string | null = null;
  @Output() closeThreadWindow = new EventEmitter<boolean>();
  @Output() contextSelected = new EventEmitter<MessageContext>();
  @Output() searchResultSelected = new EventEmitter<Message>(); // TODO

  constructor(private firebaseService: FirebaseService, private userDataService: UserDataService, private channelDataService: ChannelDataService) {
    this.currentUser = this.userDataService.getCurrentUser();
  }

  textInput = '';
  currentUser: User;
  selectedRecipients: { id: string; displayName: string }[] = [];

  searchResultsUser: any[] = [];
  searchResultsEmail: any[] = [];
  searchResultsChannels: any[] = [];
  searchResultsMessages: Message[] = [];

  allChannels: Channel[] = [];

  get isThread(): boolean {
    return this.mode === 'thread';
  }

  get isMessage(): boolean {
    return this.mode === 'message';
  }

  get threadSymbol(): '#' | '@' {
    return this.starterMessage?.channelId ? '#' : '@';
  }

  get threadTitle(): string {
    if (!this.starterMessage) return '';
    if (this.starterMessage.channelId) {
      return (
        this.allChannels.find((c) => c.id === this.starterMessage!.channelId)?.name ??
        'Unbekannter Kanal'
      );
    }
    return this.starterMessage.name;
  }

  ngOnInit() {
    this.firebaseService.updateAllUsersWithLowercaseField();
    this.channelDataService.getChannels().subscribe((channels) => {
      this.allChannels = channels;
      console.log("Kanäle: ", channels);

    });
  }

  async onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    this.clearResults();

    if (term.startsWith('@')) {
      const query = term.slice(1).toLowerCase();
      if (query.length >= 1) {
        this.searchResultsUser = await this.firebaseService.searchUsersByNameFragment(query);
      }
    } else if (term.startsWith('#')) {
      const query = term.slice(1).toLowerCase();
      this.searchResultsChannels = this.allChannels.filter((channel) =>
        channel.name.toLowerCase().includes(query)
      );

    } else if (term.length > 2 && term.includes('@')) {
      this.searchResultsEmail = await this.firebaseService.searchUsersByEmail(term.toLowerCase());

    } else if (term.length >= 3) {
      // this.searchResultsMessages = await this.firebaseService.searchMessagesForUser(term, this.currentUser.id);
    }
  }

  selectUser(user: any, input: HTMLInputElement) {
    console.log('👤 User selected:', user);
    const match = this.textInput.match(/@[\wäöüßÄÖÜ\-]+$/);
    if (match) {
      this.textInput = this.textInput.replace(/@[\wäöüßÄÖÜ\-]+$/, `@${user.displayName} `);
    } else {
      this.textInput += `@${user.displayName} `;
    }

    this.selectedRecipients.push({ id: user.id, displayName: user.displayName });
    emitContextSelected(this.contextSelected, {
      type: 'direct',
      id: user.id,
      receiverId: this.currentUser.id,
    });

    input.value = '';
    this.clearResults();
    this.closeThread();
  }


  selectChannel(channel: Channel, input: HTMLInputElement) {
    console.log(channel.name);
    this.textInput += `#${channel.name} `;
    emitContextSelected(this.contextSelected, {
      type: 'channel',
      id: channel.id,
      receiverId: '',
    });
    input.value = '';
    this.clearResults();
    this.closeThread();
  }

  selectSearchResult(msg: Message) {
    const type = msg.channelId ? 'channel' : 'direct';
    const id = msg.channelId ?? msg.userId;
    const receiverId = msg.channelId ? '' : this.currentUser.id;


    emitContextSelected(this.contextSelected, {
      type,
      id,
      receiverId,
    });

    this.searchResultSelected.emit(msg);
    this.textInput = '';
    this.clearResults();
  }


  private clearResults() {
    this.searchResultsUser = [];
    this.searchResultsEmail = [];
    this.searchResultsChannels = [];
    this.searchResultsMessages = [];
  }

  closeThread() {
    this.closeThreadWindow.emit(false);
  }
}
