import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterService } from '../../core/services/router.service';
import { DialogUserOptionsComponent } from '../../dialogs/dialog-user-options/dialog-user-options.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule,],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  user: any = {};
  users: Subscription;
  searchSuggestions: Array<{ name: string; email?: string, text?: string, receiverId?: string }> = [];
  contacts: Array<{ name: string; email?: string, text?: string, receiverId: string, id: string }> = [];
  channels: Array<{ name: string; email?: string, text?: string, receiverId: string }> = [];
  allMessages: Array<{ name: string; email?: string, text?: string, receiverId: string }> = [];
  showOverlay = false;

  /**
   * Initializes the HeaderComponent with required services and subscribes to user authentication state.
   * 
   * @param dialog - Service for opening Angular Material dialogs.
   * @param router - Custom RouterService for navigation.
   * @param auth - AuthService for managing authentication and user state.
   * @param firebase - FirebaseService for interacting with Firebase backend.
   * 
   * Subscribes to the user observable from AuthService. If the user's email is verified,
   * updates the user's emailVerified property and persists the change to Firebase.
   */
  constructor(private dialog: MatDialog, public router: RouterService, private auth: AuthService, public firebase: FirebaseService) {
    this.users = this.auth.user$.subscribe(user => {
      this.user = user;
      if (this.auth.emailVerified) {
        this.user.emailVerified = true;
        this.firebase.updateUser(this.user.id, user);
      }
    });
  }

  /**
   * Lifecycle hook that is called after Angular has initialized all data-bound properties of a component.
   * Subscribes to observables from the Firebase service to retrieve contacts, channels, and all messages,
   * and assigns the received data to the corresponding component properties.
   */
  ngOnInit() {
    this.firebase.getContactsObservable().subscribe(contacts => this.contacts = contacts);
    this.firebase.getChannelsObservable().subscribe(channels => this.channels = channels);
    this.firebase.getAllMessagesObservable().subscribe(messages => this.allMessages = messages);
  }

  /**
   * Handles the search functionality by filtering contacts, channels, and messages
   * based on the provided query. Updates the search suggestions and displays the overlay.
   *
   * @param query - The search input object containing the value to filter items by.
   *                The value is matched against the `name`, `email`, or `text` properties
   *                of each item in the combined list.
   */
  onSearch(query: any) {
    const allItems = [...this.contacts, ...this.channels, ...this.allMessages];
    this.searchSuggestions = allItems.filter(item =>
      (item.name && item.name.toLowerCase().includes(String(query.value).toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(String(query.value).toLowerCase())) ||
      (item.text && item.text.toLowerCase().includes(String(query.value).toLowerCase()))
    );
    this.firebase.allSearchSuggestions = this.searchSuggestions;
    this.showOverlay = true;
  }

  /**
   * Navigates to the route associated with the provided suggestion.
   *
   * @param suggestion - The suggestion object containing navigation information.
   */
  selectSuggestion(suggestion: any) {
    this.router.navigateToSuggestion(suggestion);
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   * Unsubscribes from the `users` observable to prevent memory leaks.
   */
  ngOnDestroy() {
    this.users.unsubscribe();
  }

  /**
   * Opens the user options dialog.
   * 
   * This method creates and opens a dialog using the `DialogUserOptionsComponent`.
   * It also assigns the current user to the dialog's component instance.
   *
   * @remarks
   * Useful for displaying user-specific options or settings in a modal dialog.
   */
  openDialog() {
    const dialogRef = this.dialog.open(DialogUserOptionsComponent);
    dialogRef.componentInstance.user = this.user;
  }

  /**
   * Retrieves the display name of a contact by their unique identifier.
   *
   * @param id - The unique identifier of the contact whose display name is to be retrieved.
   * @returns The display name of the contact if found; otherwise, returns `undefined`.
   */
  getReciverNameById(id: any): any {
    const reciver: any = this.contacts.find(contact => contact.id === id);
    return reciver.displayName;
  }

  /**
   * Toggles the visibility of the overlay by inverting the value of `showOverlay`.
   * If the overlay is currently visible, it will be hidden; if hidden, it will be shown.
   */
  toggleOverlay() {
    this.showOverlay = !this.showOverlay;
  }
}