import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { Observable } from 'rxjs';
import { AddChannelOverlayComponent } from "./add-channel-overlay/add-channel-overlay.component";

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

  activeUser: string | null = null;
  user$: Observable<any[]>;
  users = [
    { displayName: 'Frederik Beck (Du)', photoURL: './assets/img/profilepic/frederik.png' },
    { displayName: 'Sofia Müller', photoURL: './assets/img/profilepic/sofia.png' },
    { displayName: 'Noah Braun', photoURL: './assets/img/profilepic/noah.png' },
    { displayName: 'Elise Roth', photoURL: './assets/img/profilepic/elise.png' },
    { displayName: 'Elias Neumann', photoURL: './assets/img/profilepic/elias.png' },
    { displayName: 'Steffen Hoffmann', photoURL: './assets/img/profilepic/steffen.png' },
  ]

  constructor(private firebase: FirebaseService) {
    this.user$ = this.firebase.getColRef("users"); 
      this.user$.forEach((users) => {
        if (users.length > 0) {
          this.users = users;
        }
    })
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
}