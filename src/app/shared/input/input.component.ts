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

  private isActive: boolean = false;

  constructor() {}

  addData(event: Event) {  
    const eventTarget = event.target as HTMLInputElement;
    this.valueChange.emit(eventTarget.value);
  }    

  onFocus() {
  this.isActive = true;
}

onBlur() {
  this.isActive = false;
}

get currentIcon(): string {
  return this.isActive && this.activeImg ? this.activeImg : (this.img || '');
}
}