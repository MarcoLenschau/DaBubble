import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../shared/input/input.component';
import { ChannelDataService } from '../../core/services/channel-data.service';
import { UserDataService } from '../../core/services/user-data.service';
import { Channel } from '../../core/models/channel.model';
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
  private channelDataService = inject(ChannelDataService);
  private userDataService = inject(UserDataService);

  /**
   * Creates a new channel if a valid name is provided.
   * Retrieves the current user, creates a new channel object including a guest user,
   * adds it to the channel data service, and emits a close event.
   */
  async createChannel(): Promise<void> {
    if (!this.channelName.trim()) {
      return;
    }
    const currentUser = await firstValueFrom(this.userDataService.currentUser$);
    if (!currentUser) return;
    const newChannel = this.createNewChannel(currentUser);
    await this.channelDataService.addChannel(newChannel);
    this.close.emit();
  }

  /**
   * Constructs a new Channel object using the current user and a guest user.
   *
   * @param {any} currentUser - The current user object, used as the channel creator and member.
   */
  createNewChannel(currentUser: any): any {
    const guestUser = this.userDataService.createGuestUser('guest');
    return new Channel({
      name: this.channelName.trim(),
      description: this.description.trim(),
      members: [JSON.stringify(currentUser), JSON.stringify(guestUser)],
      messages: [],
      createdBy: currentUser.displayName,
      createdById: currentUser.id,
      createdAt: Date.now(),
    });
  }
}
