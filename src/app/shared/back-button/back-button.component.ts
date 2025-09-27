import { Component, inject, Input } from '@angular/core';
import { RouterService } from '../../core/services/router.service';

@Component({
  selector: 'app-back-button',
  imports: [],
  templateUrl: './back-button.component.html',
  styleUrl: './back-button.component.scss'
})
export class BackButtonComponent {
  @Input() headline: string = "";
  @Input() fontSize: number = 0;
  public router = inject(RouterService);
}
