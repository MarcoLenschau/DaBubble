import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../../../core/models/message.model';
import { MessageContext } from '../../../core/interfaces/message-context.interface';
import { User } from '../../../core/models/user.model';
import { UserDataService } from '../../../core/services/user-data.service';
import { ChannelDataService } from '../../../core/services/channel-data.service';
import { Channel } from '../../../core/models/channel.model';
import { emitDirectUserContext, emitChannelContext, emitMessageContextFromMessage } from '../../../core/utils/messages-utils';
import { Subscription, filter } from 'rxjs';
import { ChannelMembersOverlayComponent } from '../../../overlays/channel-members-overlay/channel-members-overlay.component';
import { AddMemberOverlayComponent } from '../../../overlays/add-member-overlay/add-member-overlay.component';
import { MatDialog } from '@angular/material/dialog';
import { DialogUserDetailsComponent } from '../../../dialogs/dialog-user-details/dialog-user-details.component';
import { ChannelDetailsOverlayComponent } from './channel-details-overlay/channel-details-overlay.component';

@Component({
  selector: 'app-messages-header',
  standalone: true,
  imports: [
    NgIf,
    CommonModule,
    NgFor,
    FormsModule,
    ChannelDetailsOverlayComponent,
    ChannelMembersOverlayComponent,
    AddMemberOverlayComponent
  ],
  templateUrl: './messages-header.component.html',
  styleUrl: './messages-header.component.scss',
})
export class MessagesHeaderComponent {
  @Input() mode: 'thread' | 'message' = 'message';
  @Input() starterMessage?: Message;
  @Input() activeChannel: Channel | null = null;
  @Input() activeUser: User | null = null;
  @Output() closeThreadWindow = new EventEmitter<boolean>();
  @Output() contextSelected = new EventEmitter<MessageContext>();
  @Output() searchResultSelected = new EventEmitter<Message>();

  arrowHover = false;
  showChannelOverlay = false;
  showMembersOverlay = false;
  showAddMemberOverlay = false;
  showUserProfileOverlay = false;

  private currentUserSubscription?: Subscription;

  constructor(
    private userDataService: UserDataService,
    private channelDataService: ChannelDataService,
    private dialog: MatDialog
  ) { }

  textInput = '';
  currentUser!: User;
  selectedRecipients: { id: string; displayName: string }[] = [];

  searchResultsUser: User[] = [];
  searchResultsEmail: any[] = [];
  searchResultsChannels: Channel[] = [];
  searchResultsMessages: Message[] = [];
  allChannels: Channel[] = [];
  allUsers: User[] = [];

  mentionBoxPosition = { top: 0, left: 0 };
  private searchDebounceTimer?: any;

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

  get hasSearchResults(): boolean {
    return (
      this.searchResultsUser.length > 0 ||
      this.searchResultsEmail.length > 0 ||
      this.searchResultsChannels.length > 0 ||
      this.searchResultsMessages.length > 0
    );
  }

  get viewUser(): User | null {
    if (this.activeUser) {
      if (!this.currentUser) return this.activeUser;
      return this.activeUser.id === this.currentUser.id
        ? this.currentUser
        : this.activeUser;
    }
    return null;
  }


  ngOnInit() {
    this.channelDataService.getChannels().subscribe((channels) => {
      this.allChannels = channels;
      this.searchResultsChannels = [];
    });

    this.currentUserSubscription = this.userDataService.currentUser$
      .pipe(
        filter(user => !!user && user.id !== 'default')
      )
      .subscribe((user) => {
        this.currentUser = user;
      });

    this.userDataService.getUsers().subscribe((users) => {
      this.allUsers = users;
    });
  }

  ngOnDestroy(): void {
    this.currentUserSubscription?.unsubscribe();
  }

  onSearch(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const term = inputElement.value.trim();
    this.textInput = term;

    this.calculateMentionBoxPosition(inputElement);

    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      if (!term) {
        this.clearResults();
        return;
      }

      if (term.startsWith('@')) {
        const query = term.slice(1).toLowerCase();

        if (this.validateEmail(query)) {
          this.searchResultsEmail = this.allUsers.filter((u) =>
            u.email?.toLowerCase().includes(query)
          );
          this.searchResultsUser = [];
          this.searchResultsChannels = [];
        } else {
          this.searchResultsUser =
            query.length === 0
              ? this.allUsers
              : this.allUsers.filter((user) =>
                user.displayName.toLowerCase().includes(query)
              );
          this.searchResultsEmail = [];
          this.searchResultsChannels = [];
        }
      } else if (term.startsWith('#')) {
        if (this.allChannels.length === 0) return;

        const query = term.slice(1).toLowerCase();
        this.searchResultsChannels = this.allChannels.filter((channel) =>
          channel.name.toLowerCase().includes(query)
        );
        this.searchResultsUser = [];
        this.searchResultsEmail = [];
      } else if (this.validateEmail(term)) {
        this.searchResultsEmail = this.allUsers.filter((u) =>
          u.email?.toLowerCase().includes(term.toLowerCase())
        );
        this.searchResultsUser = [];
        this.searchResultsChannels = [];
      }
    }, 100);
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

  selectUser(user: User) {
    const match = this.textInput.match(/@[\wäöüßÄÖÜ\-]+$/);
    if (match) {
      this.textInput = this.textInput.replace(/@[\wäöüßÄÖÜ\-]+$/, `@${user.displayName} `);
    } else {
      this.textInput += `@${user.displayName} `;
    }

    this.selectedRecipients.push({ id: user.id, displayName: user.displayName });

    emitDirectUserContext(this.contextSelected, this.currentUser.id, user.id);

    setTimeout(() => {
      this.textInput = '';
      this.clearResults();
      this.closeThread();
    }, 1);
  }

  selectChannel(channel: Channel) {
    this.textInput += `#${channel.name} `;
    emitChannelContext(this.contextSelected, channel.id);

    setTimeout(() => {
      this.textInput = '';
      this.clearResults();
      this.closeThread();
    }, 1);
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
    if (this.activeChannel) {
      const members = JSON.parse(this.activeChannel.members);
      return members.photoURL || './assets/img/profilepic/frederik.png';
    }
  }

  openChannelOverlay() {
    this.showChannelOverlay = true;
  }

  closeChannelOverlay() {
    this.showChannelOverlay = false;
  }

  openMembersOverlay() {
    this.showMembersOverlay = true;
  }

  openAddMemberOverlay() {
    this.showAddMemberOverlay = true;
  }

  openUserProfileOverlay() {
    const dialogDetails = this.dialog.open(DialogUserDetailsComponent);
    dialogDetails.componentInstance.directMessage = true;
    dialogDetails.componentInstance.user = this.activeUser;
  }

  closeUserProfileOverlay() {
    this.showUserProfileOverlay = false;
  }
}
