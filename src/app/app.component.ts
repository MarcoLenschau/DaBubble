import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { MessageCacheService } from './core/services/message-cache.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'dabubble';

  constructor(private messageCacheService: MessageCacheService) { }

  /**
   * Lifecycle hook that runs once after component initialization.
   * 
   * This method initializes the global message cache on application startup.
   * It preloads all messages to improve performance and responsiveness.
   * 
   * If the initialization fails, the error is logged to the console.
   */
  async ngOnInit() {
    try {
      await this.messageCacheService.initInitialMessageCache();
      console.debug('Globaler Preload aller Nachrichten abgeschlossen');
    } catch (err) {
      console.error('Fehler beim globalen Preload', err);
    }
  }
}
