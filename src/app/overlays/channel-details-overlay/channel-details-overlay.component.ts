import { Component, EventEmitter, inject, Output } from '@angular/core';
import { Input } from '@angular/core';
import { ChannelDataService } from '../../core/services/channel-data.service';
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
  
  private channelDataService = inject(ChannelDataService);
  
  /**
   * Enables name editing mode and sets the input field to the current channel name.
   */
  startEditName() {
    this.editName = true;
    this.newName = this.channel?.name || '';
  }

  /**
   * Saves the new channel name by updating it via the channel data service.
   * If successful, updates the local channel name and exits editing mode.
   */
  saveName() {
    if (this.newName) {
      this.channelDataService.updateChannelName(this.channel.id, this.newName).then(() => {
        this.channel.name = this.newName;
        this.editName = false;
      });
    }
  }

  /**
   * Enables description editing mode and sets the input field to the current channel description.
   */
  startsEditDescription() {
    this.editDescription = true;
    this.newDescription = this.channel?.description || '';
  }

  /**
   * Saves the new channel description by updating it via the channel data service.
   * If successful, updates the local channel description and exits editing mode.
   */
  saveDescription() {
    if (this.newDescription) {
      this.channelDataService.updateChannelDescription(this.channel.id, this.newDescription).then(() => {
        this.channel.description = this.newDescription;
        this.editDescription = false;
      });
    }
  }
}