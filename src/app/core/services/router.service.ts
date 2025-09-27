import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RouterService {
  private router = inject(Router);
  
  /**
   * Navigates to the specified route using Angular Router.
   *
   * @param {string} route - The route path to navigate to.
   * @return {void} This function does not return a value.
   */
  switchRoute(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Checks if the current URL is the sign-in page ("/").
   *
   * @return {boolean} Returns true if the current route is the sign-in page, otherwise false.
   */
  isSignInPage(): Boolean {
    return this.router.url == "/";
  }

  /**
   * Checks if the current URL is the main message page ("/message").
   *
   * @return {boolean} Returns true if the current route is the main message page, otherwise false.
   */
  isMainPage(): Boolean {
    return this.router.url == "/message";
  }

  navigateToSuggestion(suggestion: any) {
    this.router.navigate(['message', suggestion.id]);
  }
}


