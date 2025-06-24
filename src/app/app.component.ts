<<<<<<< HEAD
import { Component, OnInit } from '@angular/core';
=======
import {Component} from '@angular/core';
>>>>>>> origin/Emrah-Branch
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { MessageCacheService } from './core/services/message-cache.service';

@Component({
  selector: 'app-root',
<<<<<<< HEAD
  imports: [RouterOutlet, HeaderComponent, FooterComponent,],
=======
  imports: [RouterOutlet, HeaderComponent, FooterComponent, MessageComponent],
>>>>>>> origin/Emrah-Branch
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'dabubble';

  constructor(private messageCacheService: MessageCacheService) { }

  async ngOnInit() {
    try {
      await this.messageCacheService.initInitialMessageCache();
      console.debug('Globaler Preload aller Nachrichten abgeschlossen');
    } catch (err) {
      console.error('Fehler beim globalen Preload', err);
    }
  }
}
