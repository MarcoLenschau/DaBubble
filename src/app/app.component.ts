import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InputComponent } from './input/input.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, InputComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'dabubble';
}
