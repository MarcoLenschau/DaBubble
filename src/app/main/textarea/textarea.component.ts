import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EMOJIS, Emoji } from '../../interfaces/emojis-interface';
import {
  addEmojiToTextarea,
  getSortedEmojisForUser,
  updateEmojiDataForUser,
} from '../../utils/messages-utils';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
})
export class TextareaComponent implements OnInit, OnDestroy {
  @Input() textInput: string = '';
  @Input() mainMessageBoxPadding: string = '2rem';
  @Input() toolbarWidth: string = '100%';
  @Input() placeholder: string = 'Nachricht an...';

  @ViewChild('editableDiv') editableDiv!: ElementRef<HTMLDivElement>;

  emojis: Emoji[] = EMOJIS;
  sortedEmojis: Emoji[] = [];
  mainEmojiMenuOpen: boolean = false;

  ngOnInit(): void {
    this.updateSortedEmojis();
    document.addEventListener('click', this.closeEmojiMenuOnOutsideClick);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.closeEmojiMenuOnOutsideClick);
  }

  onInput(event: Event): void {
    const content = (event.target as HTMLElement).innerHTML;
    this.textInput = content;
  }

  toggleMainEmojiMenu = (event: MouseEvent): void => {
    this.mainEmojiMenuOpen = !this.mainEmojiMenuOpen;
    event.stopPropagation();
  };

  addEmojiToMainMessage(unicodeEmoji: string): void {
    const editable = this.editableDiv.nativeElement;
    editable.focus();
    document.execCommand('insertText', false, unicodeEmoji);
    this.textInput = editable.innerHTML;

    // optional: Tracking & Sortierung aktualisieren
    updateEmojiDataForUser({ id: 'current-user' } as any, unicodeEmoji);
    this.updateSortedEmojis();
  }

  closeEmojiMenuOnOutsideClick = (): void => {
    this.mainEmojiMenuOpen = false;
  };

  updateSortedEmojis(): void {
    this.sortedEmojis = getSortedEmojisForUser(
      { id: 'current-user' } as any,
      this.emojis
    );
  }
}
