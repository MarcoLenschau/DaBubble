import { Component, inject } from '@angular/core';
import { RouterService } from '../../core/services/router.service';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  public router = inject(RouterService);
}