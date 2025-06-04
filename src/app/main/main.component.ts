import { Component, OnInit } from '@angular/core';
import { DevspaceComponent } from './devspace/devspace.component';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Message } from '../models/message.model';
import { MessageWindowComponent } from './message-window/message-window.component';
import { ThreadWindowComponent } from './thread-window/thread-window.component';
import { FirebaseService } from '../services/firebase.service';
import { Observable } from 'rxjs';
import { MessageContext } from '../interfaces/message-context.interface';
import { ViewMode } from '../core/enums/view-mode.enum';

@Component({
  selector: 'app-main',
  imports: [
    DevspaceComponent,
    MessageWindowComponent,
    ThreadWindowComponent,
    CommonModule,
    MessageWindowComponent,
    ThreadWindowComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit {
  viewMode: ViewMode = ViewMode.Desktop;

  showThread = false;
  activeChannel: string | null = null;
  starterMessage?: Message;
  userId?: string;
  channels$: Observable<any>;
  channels = [];
  messageContext?: MessageContext;
  mobileMaxWidth = 920;
  tabletMaxWidth = 1440;

  constructor(private firebase: FirebaseService, private breakpointObserver: BreakpointObserver) {
    this.channels$ = this.firebase.getColRef("channels");
    this.channels$.subscribe((channels) => {
      this.channels = channels;
    })
  }

  ngOnInit(): void {
    const mobileQuery = `(max-width: ${this.mobileMaxWidth}px)`;
    const tabletQuery = `(max-width: ${this.tabletMaxWidth}px)`;

    this.breakpointObserver
      .observe([mobileQuery, tabletQuery])
      .subscribe(result => {
        if (result.breakpoints[mobileQuery]) {
          this.viewMode = ViewMode.Mobile;
        } else if (result.breakpoints[tabletQuery]) {
          this.viewMode = ViewMode.Tablet;
        } else {
          this.viewMode = ViewMode.Desktop;
        }
      });
  }

  onThreadStart(event: { starterMessage: Message; userId: string }) {
    this.starterMessage = { ...event.starterMessage };
    this.userId = event.userId;
    this.showThread = true;
  }

  onThreadClose() {
    this.showThread = false;
    console.log("Close Output has reached MainComponent");

  }

  onChannelSelected(channel: string) {
    this.channels.forEach((channelFromBackend: any) => {
      if (channelFromBackend.id === channel) {
        this.activeChannel = channelFromBackend;
      }
    })
  }

  onContextSelected(context: MessageContext): void {
    this.messageContext = context;
    console.log("MainComponent: Logging MessageContext: ", context);

  }
}
