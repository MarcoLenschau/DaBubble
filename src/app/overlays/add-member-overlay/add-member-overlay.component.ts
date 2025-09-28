import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../core/services/firebase.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-add-member-overlay',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-member-overlay.component.html',
  styleUrl: './add-member-overlay.component.scss'
})
export class AddMemberOverlayComponent {
  firebase = inject(FirebaseService);
  @Input() channel: any;
  @Output() close = new EventEmitter<void>();
  @Output() add = new EventEmitter<string>();

  username: string = '';

  // ---- Hilfsfunktionen für saubere Serialisierung & Deduplizierung ----

  private serializeMember(u: any): string {
    const uid = u.id || u.uid;
    return JSON.stringify({
      id: uid || '',
      displayName: u.displayName || '',
      email: u.email || '',
      photoURL: u.photoURL || '',
    });
  }

  private uniqueByIdStrings(members: any[]): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const m of members || []) {
      try {
        const id = JSON.parse(m)?.id;
        if (id && !seen.has(id)) {
          seen.add(id);
          out.push(m);
        }
      } catch {
        // falls mal ein alter Eintrag kein gültiges JSON ist: ignorieren
      }
    }
    return out;
  }

  /**
   * Sucht den User anhand des eingegebenen Namens,
   * verhindert doppelte Einträge und aktualisiert den Channel.
   */
  addUser() {
    const name = (this.username || '').trim();
    if (!name || !this.channel?.id) return;

    this.firebase.getContactsObservable().pipe(take(1)).subscribe({
      next: (contacts: any[]) => {
        // User suchen (case-insensitive)
        const user = contacts.find(
          (c) => (c?.displayName || '').toLowerCase() === name.toLowerCase()
        );

        if (!user) {
          alert('Kein Benutzer mit diesem Namen gefunden.');
          return;
        }

        // 1) Mitglieder deduplizieren
        const current: any[] = Array.isArray(this.channel.members)
          ? this.channel.members
          : [];
        const unique = this.uniqueByIdStrings(current);

        // 2) Prüfen, ob User schon drin ist
        const uid = user.id || user.uid;
        const exists = unique.some((m) => {
          try {
            return JSON.parse(m)?.id === uid;
          } catch {
            return false;
          }
        });
        if (exists) {
          alert('Benutzer ist bereits Mitglied dieses Channels.');
          return;
        }

        // 3) Kanonisch serialisieren und hinzufügen
        const toStore = this.serializeMember(user);
        this.channel.members = [...unique, toStore];

        // 4) Firestore schreiben
        this.firebase.updateChannel(this.channel.id, this.channel);

        // 5) Optional Event auslösen (falls der Parent etwas tun will)
        this.add.emit(this.username);

        // 6) Eingabe zurücksetzen & Overlay schließen
        this.username = '';
        this.close.emit();
      },
      error: (err) => {
        console.error('Kontakte konnten nicht geladen werden', err);
        alert('Fehler beim Laden der Kontakte.');
      },
    });
  }
}
