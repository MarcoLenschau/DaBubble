import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(private router: Router) {}

  isSignInPage() {
    return this.router.url == "/"
  }

  switchRoute(route: string) {
    this.router.navigate([route]);
  }
}
