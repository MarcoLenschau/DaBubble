import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { Observable } from 'rxjs';
import { AddChannelOverlayComponent } from "./add-channel-overlay/add-channel-overlay.component";
import { ChannelDataService } from '../../services/channel-data.service';
import { Channel } from '../../models/channel.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-devspace',
  imports: [CommonModule, AddChannelOverlayComponent],
  templateUrl: './devspace.component.html',
  styleUrl: './devspace.component.scss'
})
export class DevspaceComponent {
  @Output() channelSelected = new EventEmitter<string>();

  isChannelOpen: boolean = true;
  isMessageOpen: boolean = true;

  isChannelHovered: boolean = false;
  isMessageHovered: boolean = false;

  hoveredChannel: string | null = null;
  activeChannel: string | null = null;
  showAddChannel = false;

  isWorkspaceOpen: boolean = true;
  isWorkspaceHovered: boolean = true;

  channels$!: Observable<Channel[]>;
  activeUser: string | null = null;
  user$: Observable<any[]>;
  users: any;
  
  constructor(
    private firebase: FirebaseService,
    private channelDataService: ChannelDataService, public auth: AuthService) {
    this.user$ = this.firebase.getColRef("users"); 
      this.user$.forEach((users) => {
        if (users.length > 0) {
          this.users = users;
        }
    })
    this.channels$ = this.channelDataService.getChannels();
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

  setActiveUser(name: string) {
    this.activeUser = name;
  }

  selectChannel(channelName : string){
    this.activeChannel = channelName;
    this.channelSelected.emit(channelName);
  }

  toggleWorkspace() {
    this.isWorkspaceOpen = !this.isWorkspaceOpen;
  }
}