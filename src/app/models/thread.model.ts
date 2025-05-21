import { Message } from './message.model';

export class Thread {
  id: string = '';
  messages: Message[] = [];
  type: 'channel' | 'direct' | 'self' = 'channel'; // Art des Threads
  userId: string = ''; // Der User, zu dem der Thread gehört
  participantId?: string; // Nur bei 'direct': User-ID des Gesprächspartners
  channelId?: string; // Nur bei 'channel': ID des Channels

  constructor(data?: Partial<Thread>) {
    if (data) {
      this.id = data.id ?? this.id;
      this.messages = data.messages ?? this.messages;
      this.type = data.type ?? this.type;
      this.userId = data.userId ?? this.userId;
      this.participantId = data.participantId;
      this.channelId = data.channelId;
    }
  }
}
