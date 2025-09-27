import { Component, inject, OnInit } from '@angular/core';
import { DevspaceComponent } from './devspace/devspace.component';
import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Message } from '../core/models/message.model';
import { MessageWindowComponent } from './message-window/message-window.component';
import { ThreadWindowComponent } from './thread-window/thread-window.component';
import { FirebaseService } from '../core/services/firebase.service';
import { MessageEventService } from '../core/services/message-event.service';
import { Observable } from 'rxjs';
import { MessageContext } from '../core/interfaces/message-context.interface';
import { ViewMode } from '../core/enums/view-mode.enum';
import { User } from '../core/models/user.model';
import { Channel } from '../core/models/channel.model';
import { areUsersEqual } from '../core/utils/messages.utils';
import { AddChannelOverlayComponent } from '../overlays/add-channel-overlay/add-channel-overlay.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [DevspaceComponent, MessageWindowComponent, ThreadWindowComponent, CommonModule, MessageWindowComponent, ThreadWindowComponent, AddChannelOverlayComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit {
  router = inject(Router);
  viewMode: ViewMode = ViewMode.Desktop;
  showDevSpace = true;
  showMessage = true;
  showThread = false;
  activeChannel: Channel | null = null;
  activeUser: User | null = null;
  starterMessage?: Message;
  userId?: string;
  channels$: Observable<any>;
  channels = [];
  messageContext?: MessageContext;
  showAddChannelOverlay = false;
  mobileMaxWidth = 896;
  tabletMaxWidth = 1440;

  
  /**
   * Creates an instance of the class and initializes the required services.
   * 
   * @param {FirebaseService} firebase - The Firebase service used to fetch channel data.
   * @param {BreakpointObserver} breakpointObserver - The BreakpointObserver service used to track view mode changes.
   * @param {MessageEventService} messageEventService - The service used to manage message events.
   */
  constructor(private firebase: FirebaseService, private breakpointObserver: BreakpointObserver, private messageEventService: MessageEventService) {
    this.channels$ = this.firebase.getColRef("channels");
    this.channels$.subscribe((channels) => {
      this.channels = channels;
    });
  }

  /**
   * Determines if the Developer Space window should be shown based on the current view mode and state.
   * 
   * @returns {boolean} - `true` if the Developer Space window should be shown, otherwise `false`.
   */
  get showDevSpaceWindow(): boolean {
    return this.viewMode === ViewMode.Desktop
      || (this.viewMode === ViewMode.Tablet && !this.showThread)
      || (this.viewMode === ViewMode.Mobile && this.showDevSpace);
  }

  /**
   * Determines if the Message window should be shown based on the current view mode and state.
   * 
   * @returns {boolean} - `true` if the Message window should be shown, otherwise `false`.
   */
  get showMessageWindow(): boolean {
    return this.viewMode === ViewMode.Desktop
      || this.viewMode === ViewMode.Tablet
      || (this.viewMode === ViewMode.Mobile && this.showMessage);
  }

  /**
   * Determines if the Thread window should be shown.
   * 
   * @returns {boolean} - `true` if the Thread window should be shown, otherwise `false`.
   */
  get showThreadWindow(): boolean {
    return this.showThread;
  }

  /**
   * Angular lifecycle hook that is called after data-bound properties are initialized.
   * Sets up responsive view mode handling based on screen size.
   */
  ngOnInit(): void {
    const mobileQuery = `(max-width: ${this.mobileMaxWidth}px)`;
    const tabletQuery = `(min-width: ${this.mobileMaxWidth + 1}px) and (max-width: ${this.tabletMaxWidth}px)`;
    this.breakpointObserver
      .observe([mobileQuery, tabletQuery])
      .subscribe(result => {
        result.breakpoints[mobileQuery] ? this.showMobileView() :
          result.breakpoints[tabletQuery] ? this.showTabletView() :
            this.showDesktopView();
      });
  }

  loadChannels() {}

  /**
   * Switches the view to desktop mode.
   */
  showDesktopView(): void {
    this.viewMode = ViewMode.Desktop;
    this.showMessage = true;
    this.showDevSpace = true;
  }

  /**
   * Switches the view to tablet mode.
   */
  showTabletView(): void {
    this.viewMode = ViewMode.Tablet;
    this.showMessage = true;
    this.showThread ? this.showDevSpace = false : this.showDevSpace = true;
  }

  /**
   * Switches the view to mobile mode.
   */
  showMobileView(): void {
    this.viewMode = ViewMode.Mobile;
    this.showMessage = false;
    this.showThread ? this.showDevSpace = false : this.showDevSpace = true;
  }

  /**
   * Handles the event when a thread is started.
   * @param event Contains the starter message and user ID.
   */
  onThreadStart(event: { starterMessage: Message; userId: string }) {
    this.starterMessage = { ...event.starterMessage };
    this.userId = event.userId;
    this.showThread = true;
    if (this.viewMode === 'mobile') {
      this.showMessage = false;
      this.showDevSpace = false;
    }
  }

  /**
   * Handles the event when a thread is closed.
   */
  onThreadClose() {
    this.showThread = false;
    if (this.viewMode === 'mobile') {
      this.showMessage = true;
    }
  }

  /**
   * Updates the starter message when it changes from the thread.
   * @param updatedMessage The updated starter message.
   */
  onStarterMessageChangedFromThread(updatedMessage: Message) {
    this.starterMessage = { ...updatedMessage };
  }

  /**
   * Opens the DevSpace window in mobile view.
   */
  openDevSpace(): void {
    if (this.viewMode === 'mobile') {
      this.showDevSpace = true;
      this.showMessage = false;
      this.showThread = false;
    }
  }

  /**
   * Closes the DevSpace window in mobile view.
   */
  closeDevSpace(): void {
    if (this.viewMode === 'mobile') {
      this.showDevSpace = false;
      this.showMessage = true;
      this.showThread = false;
    }
  }

  /**
   * Handles the event when a channel is selected.
   * @param channel The selected channel.
   */
  onChannelSelected(channel: Channel) {
    this.channels.forEach((channelFromBackend: any) => {
      if (channelFromBackend.id === channel.id) {
        this.activeChannel = channelFromBackend;
        this.activeUser = null;
      }
    });
  }

  /**
   * Handles the event when a user is selected.
   * @param user The selected user.
   */
  onUserSelected(user: any) {
    if (this.activeUser?.id === user?.id) {
      return;
    }
    this.activeUser = { ...user };
    this.activeChannel = null;

    if (this.activeUser && areUsersEqual(this.activeUser, user)) {
      return;
    }
    this.activeUser = { ...user };
    this.activeChannel = null;
  }

  /**
   * Handles the event when a message context is selected.
   * @param context The selected message context.
   */
  onContextSelected(context: MessageContext): void {
    console.log('Main: context: ', context);

    const same =
      this.messageContext?.type === context.type &&
      this.messageContext?.id === context.id &&
      this.messageContext?.receiverId === context.receiverId;

    if (!same) {
      this.messageContext = context;
      this.messageEventService.notifyScrollIntent('message', true);
    }
    this.checkIfViewModeMobile();
  }

  /**
   * Checks if the current view mode is mobile and updates the window visibility accordingly.
   */
  checkIfViewModeMobile(): void {
    if (this.viewMode === 'mobile') {
      this.showMessage = true;
      this.showDevSpace = false;
      this.showThread = false;
    }
  }

  /**
   * Handles the visibility of the "Add Channel" overlay.
   * 
   * @param {boolean} show - Determines whether the "Add Channel" overlay should be shown (`true`) or hidden (`false`).
   */
  onAddChannelRequest(show: boolean) {
    this.showAddChannelOverlay = show;
  }
}
