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
import { emitContextSelected, emitDirectUserContext, emitChannelContext, emitMessageContextFromMessage } from '../../../utils/messages-utils';
import { Observable, Subscription } from 'rxjs';

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
  @Input() activeChannel: any = {};
  @Output() closeThreadWindow = new EventEmitter<boolean>();
  @Output() contextSelected = new EventEmitter<MessageContext>();
  @Output() searchResultSelected = new EventEmitter<Message>(); // TODO

  private currentUserSubscription?: Subscription;

  constructor(private firebaseService: FirebaseService, private userDataService: UserDataService, private channelDataService: ChannelDataService) {
  }

  textInput = '';
  currentUser!: User;
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
    });
    this.currentUserSubscription = this.userDataService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.currentUserSubscription?.unsubscribe();
  }

  async onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value.trim();
    this.textInput = term;
    this.clearResults();

    if (!term) return;

    if (term.startsWith('@')) {
      const query = term.slice(1).toLowerCase();

      if (this.validateEmail(query)) {
        // Suche nach E-Mail (z. B. @max@example.de)
        this.searchResultsEmail = await this.firebaseService.searchUsersByEmail(query);
      } else if (query.length >= 1) {
        // Suche nach Namen
        this.searchResultsUser = await this.firebaseService.searchUsersByNameFragment(query);
      }

    } else if (term.startsWith('#')) {
      const query = term.slice(1).toLowerCase();
      this.searchResultsChannels = this.allChannels.filter((channel) =>
        channel.name.toLowerCase().includes(query)
      );

    } else if (this.validateEmail(term)) {
      // Direkte E-Mail-Suche (ohne @ am Anfang)
      this.searchResultsEmail = await this.firebaseService.searchUsersByEmail(term);
    }
  }

  private validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
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

    emitDirectUserContext(this.contextSelected, this.currentUser.id, user.id);


    input.value = '';
    this.clearResults();
    this.closeThread();
  }


  selectChannel(channel: Channel, input: HTMLInputElement) {
    console.log(channel.name);
    console.log(channel.id);
    this.textInput += `#${channel.name} `;

    emitChannelContext(this.contextSelected, channel.id);

    input.value = '';
    this.clearResults();
    this.closeThread();
  }

  selectSearchResult(msg: Message) {
    emitMessageContextFromMessage(this.contextSelected, msg, this.currentUser.id);

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

  loadMember() {
    const members = JSON.parse(this.activeChannel.members);
    return members.photoURL;
  }
}
