import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterService } from '../../core/services/router.service';
import { InputComponent } from '../input/input.component';
import { DialogUserOptionsComponent } from '../../dialogs/dialog-user-options/dialog-user-options.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../../core/services/firebase.service';
import { onSnapshot } from '@angular/fire/firestore';

@Component({
  selector: 'app-header',
  imports: [CommonModule, InputComponent],
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

  constructor(private dialog: MatDialog, public router: RouterService, private auth: AuthService, public firebase: FirebaseService) {
    this.users = this.auth.user$.subscribe(user => {
      this.user = user;
      if (this.auth.emailVerified) {
        this.user.emailVerified = true;
        this.firebase.updateUser(this.user.id, user);
      }
    });
  }


  ngOnInit() {
    this.firebase.getContactsObservable().subscribe(contacts => {
      this.contacts = contacts;
    });
    this.firebase.getChannelsObservable().subscribe(channels => this.channels = channels);
    this.firebase.getAllMessagesObservable().subscribe((messages: any)  => {
      this.allMessages = messages;
    });
  }



  onSearch(query: any) {
    const allItems = [...this.contacts, ...this.channels, ...this.allMessages];
    this.searchSuggestions = allItems.filter(item =>
      (item.name && item.name.toLowerCase().includes(String(query.value).toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(String(query.value).toLowerCase())) ||
      (item.text && item.text.toLowerCase().includes(String(query.value).toLowerCase()))
    );
    this.firebase.allSearchSuggestions = this.searchSuggestions;
    console.log('Suchvorschläge:', this.searchSuggestions);
    this.showOverlay = true;
  }

  selectSuggestion(suggestion: any) {
    // Hier kannst du z.B. auf das Profil oder den Channel weiterleiten
    this.router.navigateToSuggestion(suggestion);
  }

  ngOnDestroy() {
    this.users.unsubscribe();
  }

  openDialog() {
    const dialogRef = this.dialog.open(DialogUserOptionsComponent);
    dialogRef.componentInstance.user = this.user;
  }

  getReciverNameById(id: any): any {
    const reciver: any = this.contacts.find(contact => contact.id === id);
    return reciver.displayName;
  }
}