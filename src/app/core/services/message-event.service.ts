import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageEventService {

  constructor() { }

  //   private messageSentSubject = new Subject<'message' | 'thread' | ''>();

  //   notifyMessageSent(contextType: 'message' | 'thread' | ''): void {
  //     this.messageSentSubject.next(contextType);
  //   }

  //   get messageSent$(): Observable<'message' | 'thread' | ''> {
  //     return this.messageSentSubject.asObservable();
  //   }
  // }
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
}