import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-devspace',
  imports: [CommonModule],
  templateUrl: './devspace.component.html',
  styleUrl: './devspace.component.scss'
})
export class DevspaceComponent {
  isChannelOpen: boolean = true;
  isMessageOpen: boolean = true;

  isChannelHovered: boolean = false;
  isMessageHovered: boolean = false;

  activeUser: string | null = null;

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

  users = [
    { name: 'Frederik Beck (Du)', img: './assets/img/profilepic/frederik.png' },
    { name: 'Sofia Müller', img: './assets/img/profilepic/sofia.png' },
    { name: 'Noah Braun', img: './assets/img/profilepic/noah.png' },
    { name: 'Elise Roth', img: './assets/img/profilepic/elise.png' },
    { name: 'Elias Neumann', img: './assets/img/profilepic/elias.png' },
    { name: 'Steffen Hoffmann', img: './assets/img/profilepic/steffen.png' },
  ]

}
