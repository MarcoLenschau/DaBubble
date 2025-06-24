import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FirebaseService } from '../../core/services/firebase.service';
import { Observable, Subscription, filter } from 'rxjs';
import { AddChannelOverlayComponent } from "./add-channel-overlay/add-channel-overlay.component";
import { ChannelDataService } from '../../core/services/channel-data.service';
import { UserDataService } from '../../core/services/user-data.service';
import { Channel } from '../../core/models/channel.model';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { MessageContext } from '../../core/interfaces/message-context.interface';
import { emitChannelContext, emitDirectUserContext } from '../../core/utils/messages-utils';

@Component({
  selector: 'app-devspace',
  imports: [CommonModule, AddChannelOverlayComponent],
  templateUrl: './devspace.component.html',
  styleUrl: './devspace.component.scss'
})
export class DevspaceComponent {
  @Output() channelSelected = new EventEmitter<Channel>();
  @Output() userSelected = new EventEmitter<User>();
  @Output() contextSelected = new EventEmitter<MessageContext>();
  @Output() closeThreadWindow = new EventEmitter<void>();

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

  private currentUserSubscription?: Subscription;
  constructor(
    private firebase: FirebaseService,
    private channelDataService: ChannelDataService, public auth: AuthService, private userDataService: UserDataService,) {
    this.user$ = this.firebase.getColRef("users");
    this.users = [];
    this.user$.forEach((users) => {
      this.users = (users || []).filter(u => !!u && !!u.email);
    });
    this.channels$ = this.channelDataService.getChannels();
    this.channels$.subscribe(channels => {
      this.channels = channels;
    });
  }

  async ngOnInit(): Promise<void> {
    this.currentUserSubscription = this.userDataService.currentUser$
      .pipe(filter(user => !!user && user.id !== 'default'))
      .subscribe(user => {
        this.currentUser = user;
      });
  }
  ngOnDestroy() {
    this.currentUserSubscription?.unsubscribe();
  }

  toggleChannels() {
    this.isChannelOpen = !this.isChannelOpen;
  }

  toggleMessage() {
    this.isMessageOpen = !this.isMessageOpen;
  }


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

  setActiveUser(user: any) {
    if (!user || !user.email) return;
    // this.userSelected.emit(user);
    // this.activeUser = { ...user };
    // this.activeChannel = null;
    this.activeUser = user.id === this.currentUser?.id ? this.currentUser : { ...user };
    this.userSelected.emit(this.activeUser ?? undefined);
    this.activeChannel = null;
    emitDirectUserContext(this.contextSelected, this.currentUser.id, this.activeUser?.id ?? '');
    this.closeThread();
  }

  selectChannel(channel: any) {
    this.activeChannel = channel;
    this.activeUser = null;
    this.channelSelected.emit(channel);
    emitChannelContext(this.contextSelected, channel.id);
    this.closeThread();
  }

  closeThread() {
    this.closeThreadWindow.emit();
  }


  toggleWorkspace() {
    this.isWorkspaceOpen = !this.isWorkspaceOpen;
  }
}