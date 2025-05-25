import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-messages-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages-textarea.component.html',
  styleUrl: './messages-textarea.component.scss',
})
export class MessagesTextareaComponent {
  @Input() textInput: string = '';
  @Input() mainMessageBoxPadding: string = '2rem';
  @Input() toolbarWidth: string = '100%';
  @Input() placeholder: string = 'Nachricht an...';

  @Input() mode: 'thread' | 'message' = 'message';

  get isThread(): boolean {
    return this.mode === 'thread';
  }

  get isMessage(): boolean {
    return this.mode === 'message';
  }

  onInput(event: Event): void {
    const content = (event.target as HTMLElement).innerHTML;
    this.textInput = content;
  }
}
