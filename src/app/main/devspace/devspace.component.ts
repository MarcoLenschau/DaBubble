import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FirebaseService } from '../../core/services/firebase.service';
import { Observable, Subscription } from 'rxjs';
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
  @Output() channelSelected = new EventEmitter<string>();
  @Output() contextSelected = new EventEmitter<MessageContext>();
  @Output() closeThreadWindow = new EventEmitter<void>();

  isChannelOpen: boolean = true;
  isMessageOpen: boolean = true;

  isChannelHovered: boolean = false;
  isMessageHovered: boolean = false;

  hoveredChannel: string | null = null;
  activeChannel: string | null = null;
  showAddChannel = false;

  isWorkspaceOpen: boolean = true;
  isWorkspaceHovered: boolean = false;
  channels: any = [];
  channels$!: Observable<Channel[]>;
  activeUser: string | null = null;
  user$: Observable<any[]>;
  users: any;
  currentUser!: User;

  private currentUserSubscription?: Subscription;
  constructor(
    private firebase: FirebaseService,
    private channelDataService: ChannelDataService, public auth: AuthService, private userDataService: UserDataService,) {
    this.user$ = this.firebase.getColRef("users");
    this.user$.forEach((users) => {
      if (users.length > 0) {
        this.users = users;
      }
    });
    this.channels$ = this.channelDataService.getChannels();
    this.channels$.subscribe(channels => {
      this.channels = channels;
    });
  }

  async ngOnInit(): Promise<void> {
    this.currentUserSubscription = this.userDataService.currentUser$.subscribe(user => {
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

  setActiveUser(name: string, id: string) {
    this.activeUser = name;
    emitDirectUserContext(this.contextSelected, this.currentUser.id, id);
    this.closeThread();
  }

  selectChannel(id: string) {
    this.activeChannel = id;
    this.channelSelected.emit(id);
    emitChannelContext(this.contextSelected, id);
    this.closeThread();
  }

  closeThread() {
    this.closeThreadWindow.emit();
  }


  toggleWorkspace() {
    this.isWorkspaceOpen = !this.isWorkspaceOpen;
  }
}