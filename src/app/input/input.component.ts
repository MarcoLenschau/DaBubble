import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-input',
  imports: [CommonModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss'
})
export class InputComponent {
  @Input() placeholder: string = '';
  @Input() img: string = '';
  @Input() value: string = '';
  @Input() height: number = 32;
  @Input() reverse: boolean = false;

  constructor() {}
}