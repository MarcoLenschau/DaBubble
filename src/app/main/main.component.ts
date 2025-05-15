import { Component } from '@angular/core';
import { DevspaceComponent } from './devspace/devspace.component';

@Component({
  selector: 'app-main',
  imports: [DevspaceComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

}
