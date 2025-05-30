import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent {
  @Input() placeholder: string = '';
  @Input() img: string = '';
  @Input() value: string = '';
  @Input() height: number = 32;
  @Input() reverse: boolean = false;
  @Input() prefix: string = '';
  @Output() valueChange = new EventEmitter<string>();

  constructor() {}

  addData(event: Event) {  
    const eventTarget = event.target as HTMLInputElement;
    this.valueChange.emit(eventTarget.value);
  }    
}