import {Component} from '@angular/core';
import { DevspaceComponent } from './devspace/devspace.component';
import { ThreadComponent } from './thread/thread.component';
import { MessageComponent } from './message/message.component';

@Component({
  selector: 'app-main',
  imports: [DevspaceComponent, MessageComponent, ThreadComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {}
