import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageEventService {

  constructor() { }

  private messageWindowScrollSubject = new Subject<boolean>();
  private threadWindowScrollSubject = new Subject<boolean>();

  /**
     * Notifies listeners about the scroll intent for either the message or thread window.
     *
     * @param target The target window to notify ('message' or 'thread').
     * @param shouldScroll Whether the window should scroll (true) or not (false).
     */
  notifyScrollIntent(target: 'message' | 'thread', shouldScroll: boolean): void {
    if (target === 'message') {
      this.messageWindowScrollSubject.next(shouldScroll);
    } else if (target === 'thread') {
      this.threadWindowScrollSubject.next(shouldScroll);
    }
  }

  /**
   * Observable stream that emits scroll intent changes for the message window.
   *
   * @returns Observable<boolean> emitting true to enable auto-scroll, false to disable.
   */
  get messageWindowScroll$(): Observable<boolean> {
    return this.messageWindowScrollSubject.asObservable();
  }

  /**
   * Observable stream that emits scroll intent changes for the thread window.
   *
   * @returns Observable<boolean> emitting true to enable auto-scroll, false to disable.
   */
  get threadWindowScroll$(): Observable<boolean> {
    return this.threadWindowScrollSubject.asObservable();
  }

  /**
   * Disables auto-scroll for both message and thread windows by notifying listeners with false.
   */
  disableAutoScroll() {
    this.notifyScrollIntent('message', false);
    this.notifyScrollIntent('thread', false);
  }
}