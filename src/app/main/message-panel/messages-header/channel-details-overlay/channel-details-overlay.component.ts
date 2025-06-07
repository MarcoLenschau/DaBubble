import { Component, EventEmitter, Output } from '@angular/core';
import { Input } from '@angular/core';
import { ChannelDataService } from '../../../../core/services/channel-data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-channel-details-overlay',
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-details-overlay.component.html',
  styleUrl: './channel-details-overlay.component.scss'
})
export class ChannelDetailsOverlayComponent {
  @Input() channel: any;
  @Output() close = new EventEmitter<void>;

  editName = false;
  editDescription = false;

  newName = '';
  newDescription = '';

  constructor(private channelDataService: ChannelDataService) { }

  startEditName() {
    this.editName = true;
    this.newName = this.channel?.name || '';
  }

  saveName() {
    if (this.newName) {
      this.channelDataService.updateChannelName(this.channel.id, this.newName).then(() => {
        this.channel.name = this.newName;
        console.log(this.channel.name);
        this.editName = false;
      })
      console.log(this.newName);

    }
  }

  startsEditDescription() {
    this.editDescription = true;
    this.newDescription = this.channel?.description || '';
  }

  saveDescription() {
    if (this.newDescription) {
      this.channelDataService.updateChannelDescription(this.channel.id, this.newDescription).then(() => {
        this.channel.description = this.newDescription;
        console.log(this.channel.description);
        this.editDescription = false;
      })

    }
  }


}
