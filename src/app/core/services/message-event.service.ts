import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageEventService {

  constructor() { }

  private messageWindowScrollSubject = new Subject<boolean>();
  private threadWindowScrollSubject = new Subject<boolean>();

  notifyScrollIntent(target: 'message' | 'thread', shouldScroll: boolean): void {
    if (target === 'message') {
      this.messageWindowScrollSubject.next(shouldScroll);
    } else if (target === 'thread') {
      this.threadWindowScrollSubject.next(shouldScroll);
    }
  }

  get messageWindowScroll$(): Observable<boolean> {
    return this.messageWindowScrollSubject.asObservable();
  }

  get threadWindowScroll$(): Observable<boolean> {
    return this.threadWindowScrollSubject.asObservable();
  }

  disableAutoScroll() {
    this.notifyScrollIntent('message', false);
    this.notifyScrollIntent('thread', false);
  }
}