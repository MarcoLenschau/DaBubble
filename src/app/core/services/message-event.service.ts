import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageEventService {

  constructor() { }

  private messageSentSubject = new Subject<'message' | 'thread'>();

  notifyMessageSent(contextType: 'message' | 'thread'): void {
    this.messageSentSubject.next(contextType);
  }

  get messageSent$(): Observable<'message' | 'thread'> {
    return this.messageSentSubject.asObservable();
  }
}
