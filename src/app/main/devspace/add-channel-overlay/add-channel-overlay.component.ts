import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../../app/shared/input/input.component';

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

    createChannel(){
      this.close.emit();
    }
}
