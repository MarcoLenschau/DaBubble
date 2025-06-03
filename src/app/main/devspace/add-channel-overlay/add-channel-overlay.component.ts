import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../../app/shared/input/input.component';
import { ChannelDataService } from '../../../services/channel-data.service';
import { UserDataService } from '../../../services/user-data.service';
import { Channel } from '../../../models/channel.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-channel-overlay',
  imports: [FormsModule, InputComponent],
  templateUrl: './add-channel-overlay.component.html',
  styleUrl: './add-channel-overlay.component.scss'
})
export class AddChannelOverlayComponent {
  @Output() close = new EventEmitter<void>();
  channelName = '';
  description = '';

  constructor(private channelDataService: ChannelDataService, private userDataService: UserDataService) { }

  async createChannel() {
    if (!this.channelName.trim()) {
      return;
    }
    const currentUser = await firstValueFrom(this.userDataService.currentUser$);
    if (!currentUser) return;

    const newChannel = new Channel({
      name: this.channelName.trim(),
      description: this.description.trim(),
      members: [JSON.stringify(currentUser)],
      messages: [],
      createdBy: currentUser.displayName,
    });

    await this.channelDataService.addChannel(newChannel);
    this.close.emit();
  }
}
