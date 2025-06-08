import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../../../core/models/message.model';
import { FirebaseService } from '../../../core/services/firebase.service';
import { MessageContext } from '../../../core/interfaces/message-context.interface';
import { User } from '../../../core/models/user.model';
import { UserDataService } from '../../../core/services/user-data.service';
import { ChannelDataService } from '../../../core/services/channel-data.service';
import { Channel } from '../../../core/models/channel.model';
import { ChannelDetailsOverlayComponent } from './channel-details-overlay/channel-details-overlay.component';
import { emitContextSelected, emitDirectUserContext, emitChannelContext, emitMessageContextFromMessage } from '../../../core/utils/messages-utils';
import { Observable, Subscription } from 'rxjs';


@Component({
  selector: 'app-messages-header',
  standalone: true,
  imports: [NgIf, CommonModule, NgFor, FormsModule, ChannelDetailsOverlayComponent],
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

  arrowHover = false;
  showChannelOverlay = false;

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

mentionBoxPosition = { top: 0, left: 0 };

  async onSearch(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const term = (event.target as HTMLInputElement).value.trim();
    this.textInput = term;
    this.clearResults();

    if (!term) return;

      this.calculateMentionBoxPosition(inputElement);

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

  private calculateMentionBoxPosition(inputElement: HTMLInputElement) {
  const rect = inputElement.getBoundingClientRect();
  this.mentionBoxPosition = {
    top: rect.bottom + window.scrollY + 5, 
    left: rect.left + window.scrollX,
  };
}

  private validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  }

  selectUser(user: any) {
  const match = this.textInput.match(/@[\wäöüßÄÖÜ\-]+$/);
  if (match) {
    this.textInput = this.textInput.replace(/@[\wäöüßÄÖÜ\-]+$/, `@${user.displayName} `);
  } else {
    this.textInput += `@${user.displayName} `;
  }

  this.selectedRecipients.push({ id: user.id, displayName: user.displayName });

  emitDirectUserContext(this.contextSelected, this.currentUser.id, user.id);

  this.textInput = ''; 
  this.clearResults();
  this.closeThread();
}



  selectChannel(channel: Channel) {
  this.textInput += `#${channel.name} `;

  emitChannelContext(this.contextSelected, channel.id);

  this.textInput = ''; 
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

  openChannelOverlay() {
    this.showChannelOverlay = true;
  }

  closeChannelOverlay() {
    this.showChannelOverlay = false;
  }
}
