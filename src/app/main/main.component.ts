import { Component, OnInit } from '@angular/core';
import { DevspaceComponent } from './devspace/devspace.component';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Message } from '../core/models/message.model';
import { MessageWindowComponent } from './message-window/message-window.component';
import { ThreadWindowComponent } from './thread-window/thread-window.component';
import { FirebaseService } from '../core/services/firebase.service';
import { Observable } from 'rxjs';
import { MessageContext } from '../core/interfaces/message-context.interface';
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
  showDevSpace = true;
  showMessage = true;
  showThread = false;
  activeChannel: string | null = null;
  starterMessage?: Message;
  userId?: string;
  channels$: Observable<any>;
  channels = [];
  messageContext?: MessageContext;
  mobileMaxWidth = 896;
  tabletMaxWidth = 1440;

  constructor(private firebase: FirebaseService, private breakpointObserver: BreakpointObserver) {
    this.channels$ = this.firebase.getColRef("channels");
    this.channels$.subscribe((channels) => {
      this.channels = channels;
    });
  }

  get showDevSpaceWindow(): boolean {
    return this.viewMode === ViewMode.Desktop
      || (this.viewMode === ViewMode.Tablet && !this.showThread)
      || (this.viewMode === ViewMode.Mobile && this.showDevSpace);
  }

  get showMessageWindow(): boolean {
    return this.viewMode === ViewMode.Desktop
      || this.viewMode === ViewMode.Tablet
      || (this.viewMode === ViewMode.Mobile && this.showMessage);
  }

  get showThreadWindow(): boolean {
    return this.showThread;
  }


  ngOnInit(): void {
    const mobileQuery = `(max-width: ${this.mobileMaxWidth}px)`;
    const tabletQuery = `(min-width: ${this.mobileMaxWidth + 1}px) and (max-width: ${this.tabletMaxWidth}px)`;


    this.breakpointObserver
      .observe([mobileQuery, tabletQuery])
      .subscribe(result => {
        if (result.breakpoints[mobileQuery]) {
          this.viewMode = ViewMode.Mobile;
          this.showMessage = false;
          if (this.showThread) {
            this.showDevSpace = false;
          } else {
            this.showDevSpace = true;
          }
          // this.showThread = false;
        } else if (result.breakpoints[tabletQuery]) {
          this.viewMode = ViewMode.Tablet;
          this.showMessage = true;
          if (this.showThread) {
            this.showDevSpace = false;
          } else {
            this.showDevSpace = true;
          }
        } else {
          this.viewMode = ViewMode.Desktop;
          this.showMessage = true;
          this.showDevSpace = true;
        }
      });
  }

  onThreadStart(event: { starterMessage: Message; userId: string }) {
    this.starterMessage = { ...event.starterMessage };
    this.userId = event.userId;
    this.showThread = true;
    if (this.viewMode === 'mobile') {
      this.showMessage = false;
      this.showDevSpace = false;
    }
  }

  onThreadClose() {
    this.showThread = false;
    console.log("Close Output has reached MainComponent");
    if (this.viewMode === 'mobile') {
      this.showMessage = true;
    }
  }

  openDevSpace(): void {
    if (this.viewMode === 'mobile') {
      this.showDevSpace = true;
      this.showMessage = false;
      this.showThread = false;
    }
  }

  closeDevSpace(): void {
    if (this.viewMode === 'mobile') {
      this.showDevSpace = false;
      this.showMessage = true;
      this.showThread = false;
    }

  }


  onChannelSelected(channel: string) {
    this.channels.forEach((channelFromBackend: any) => {
      if (channelFromBackend.id === channel) {
        this.activeChannel = channelFromBackend;
      }
    });
  }

  onContextSelected(context: MessageContext): void {
    const same =
      this.messageContext?.type === context.type &&
      this.messageContext?.id === context.id &&
      this.messageContext?.receiverId === context.receiverId;

    if (!same) {
      console.log("MainComponent: messageContext wurde wirklich geändert:", context);
      this.messageContext = context;
    } else {
      console.log("MainComponent: Kein Update notwendig (messageContext gleich)");
    }
    if (this.viewMode === 'mobile') {
      this.showMessage = true;
      this.showDevSpace = false;
      this.showThread = false;
    }

  }
}
