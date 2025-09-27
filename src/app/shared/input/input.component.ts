import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent {
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() img: string = '';
  @Input() value: string = '';
  @Input() height: number = 32;
  @Input() width: number = 350;
  @Input() reverse: boolean = false;
  @Input() prefix: string = '';
  @Input() prefixIcon: string = '';
  @Input() activeImg: string = '';
  @Output() valueChange = new EventEmitter<string>();
  @Input() inputEvent: string = '';

  private isActive: boolean = false;

  /**
   * Emits the value of the input field when the user types.
   * @param event The input event from the input field.
   */
  addData(event: Event) {
    const eventTarget = event.target as HTMLInputElement;
    this.valueChange.emit(eventTarget.value);
  }

  /**
   * Sets the input as active (focused).
   */
  onFocus() {
    this.isActive = true;
  }

  /**
   * Sets the input as inactive (blurred).
   */
  onBlur() {
    this.isActive = false;
  }

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.inputEvent = value;
  }

  /**
   * Returns the current icon to display based on the active state.
   */
  get currentIcon(): string {
    return this.isActive && this.activeImg ? this.activeImg : (this.img || '');
  }
}