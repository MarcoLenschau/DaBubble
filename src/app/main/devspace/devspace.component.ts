import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FirebaseService } from '../../core/services/firebase.service';
import { Observable, Subscription, filter } from 'rxjs';
import { AddChannelOverlayComponent } from '../../overlays/add-channel-overlay/add-channel-overlay.component';
import { ChannelDataService } from '../../core/services/channel-data.service';
import { UserDataService } from '../../core/services/user-data.service';
import { Channel } from '../../core/models/channel.model';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { MessageContext } from '../../core/interfaces/message-context.interface';
import { emitChannelContext, emitDirectUserContext } from '../../core/utils/messages.utils';
import { Router } from '@angular/router';

@Component({
  selector: 'app-devspace',
  imports: [CommonModule],
  templateUrl: './devspace.component.html',
  styleUrl: './devspace.component.scss'
})
export class DevspaceComponent {
  @Output() channelSelected = new EventEmitter<Channel>();
  @Output() userSelected = new EventEmitter<User>();
  @Output() contextSelected = new EventEmitter<MessageContext>();
  @Output() closeThreadWindow = new EventEmitter<void>();
  @Output() addChannelRequest = new EventEmitter<boolean>();

  isChannelOpen: boolean = true;
  isMessageOpen: boolean = true;

  isChannelHovered: boolean = false;
  isMessageHovered: boolean = false;

  hoveredChannel: string | null = null;
  activeChannel: Channel | null = null;
  activeUser: User | null = null;
  showAddChannel = false;

  isWorkspaceOpen: boolean = true;
  isWorkspaceHovered: boolean = false;
  channels: any = [];
  channels$!: Observable<Channel[]>;
  user$: Observable<any[]>;
  users: any;
  currentUser!: User;

  private firebase = inject(FirebaseService);
  private channelDataService = inject(ChannelDataService);
  private userDataService = inject(UserDataService);
  public auth = inject(AuthService);
  private router = inject(Router);
  private currentUserSubscription?: Subscription;


  /**
   * Constructor for initializing user and channel data.
   *
   * - Retrieves a reference to the "users" collection using Firebase service.
   * - Filters and stores valid users (with defined email addresses) into the `users` array.
   * - Subscribes to channel data from the `channelDataService` and stores it in the `channels` array.
   */
  constructor() {
    this.user$ = this.firebase.getColRef("users");
    this.users = [];
    this.user$.forEach((users) => {
      this.users = (users || []).filter(u => !!u && !!u.email);
      this.firebase.setContacts(this.users);
    });
  }

  /**
   * Angular lifecycle hook that subscribes to the current user observable.
   */
  async ngOnInit(): Promise<void> {
    this.currentUserSubscription = this.userDataService.currentUser$
      .subscribe(user => {
        this.currentUser = user;
        this.searchChannelForUser();

        this.user$.subscribe(users => {
          const filteredContacts = users.filter(u => !!u && !!u.email);
          console.log('Gefilterte Kontakte:', filteredContacts);
          this.firebase.setContacts(filteredContacts);
          console.log('setContacts wurde ausgeführt');
        });
      });
  }

  /**
   * Searches all available channels for the current user and adds matching channels to the `channels` array.
   *
   * This method subscribes to the observable `channels$` from the `channelDataService`, iterates over each
   * channel and its members (stored as JSON strings), parses them, and checks if the member's email matches
   * the current user's email. If a match is found, the channel is added to the `channels` array.
   */
  searchChannelForUser(): void {
    this.channelDataService.getChannels().subscribe(channels => {
      const userChannels: Channel[] = [];
      channels.forEach(channel => {
        if (this.isUserInChannel(channel)) {
          userChannels.push(channel);
        }
      });
      this.channels = userChannels;
      this.firebase.setChannels(this.channels); // <--- Channels setzen
    });
  }

  /**
   * Checks if the current user is a member of the given channel.
   *
   * @param {any} channel - The channel object containing a `members` array of JSON stringified user objects.
   * @returns {boolean} True if the user is in the channel, false otherwise.
   */
  isUserInChannel(channel: any): boolean {
    const members = channel.members.map((memberStr: string) => JSON.parse(memberStr));
    return members.some((member: any) => member.email === this.currentUser.email);
  }

  /**
   * Angular lifecycle hook that unsubscribes from the current user observable.
   */
  ngOnDestroy(): void {
    this.currentUserSubscription?.unsubscribe();
  }

  /**
   * Toggles the visibility of the channels section.
   */
  toggleChannels(): void {
    this.isChannelOpen = !this.isChannelOpen;
  }

  /**
   * Toggles the visibility of the messages section.
   */
  toggleMessage(): void {
    this.isMessageOpen = !this.isMessageOpen;
  }

  /**
   * Returns the appropriate arrow icon path for the channels section based on its state.
   * @returns The path to the arrow icon image.
   */
  getChannelArrowIcon() {
    if (this.isChannelOpen) {
      return this.isChannelHovered
        ? './assets/img/devspace/arrow_drop_down-hover.png'
        : './assets/img/devspace/arrow_drop_down.png';
    } else {
      return this.isChannelHovered
        ? './assets/img/devspace/arrow_drop_down-hover-default.png'
        : './assets/img/devspace/arrow_drop_down-default.png';
    }
  }

  /**
   * Returns the appropriate arrow icon path for the messages section based on its state.
   * @returns The path to the arrow icon image.
   */
  getMessageArrowIcon() {
    if (this.isMessageOpen) {
      return this.isMessageHovered
        ? './assets/img/devspace/arrow_drop_down-hover.png'
        : './assets/img/devspace/arrow_drop_down.png';
    } else {
      return this.isMessageHovered
        ? './assets/img/devspace/arrow_drop_down-hover-default.png'
        : './assets/img/devspace/arrow_drop_down-default.png';
    }
  }

  /**
   * Sets the active user and emits the corresponding events and context.
   * @param user The user to set as active.
   */
  setActiveUser(user: any): void {
    if (!user || !user.email) return;
    this.activeUser = user.id === this.currentUser?.id ? this.currentUser : { ...user };
    this.userSelected.emit(this.activeUser ?? undefined);
    this.activeChannel = null;
    emitDirectUserContext(this.contextSelected, this.currentUser.id, this.activeUser?.id ?? '');
    this.closeThread();
  }

  /**
   * Sets the active channel and emits the corresponding events and context.
   * @param channel The channel to set as active.
   */
  selectChannel(channel: any): void {
    this.activeChannel = channel;
    this.activeUser = null;
    this.channelSelected.emit(channel);
    emitChannelContext(this.contextSelected, channel.id);
    this.closeThread();
  }

  /**
   * Emits an event to close the thread window.
   */
  closeThread(): void {
    this.closeThreadWindow.emit();
  }

  /**
   * Toggles the visibility of the workspace section.
   */
  toggleWorkspace(): void {
    this.isWorkspaceOpen = !this.isWorkspaceOpen;
  }

  /**
   * Shows the add channel overlay by emitting an event.
   */
  showAddChannelOverlay(): void {
    this.addChannelRequest.emit(true);
  }

  /**
   * Determines whether the current user is a guest user.
   *
   * @returns {boolean} `true` if the current user's display name is 'Gast', otherwise `false`.
   */
  isGuestUser(): boolean {
    return this.currentUser?.displayName === 'Gast';
  }
}