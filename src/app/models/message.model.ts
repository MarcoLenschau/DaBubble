import { Reaction } from '../interfaces/reaction.interface';

export class Message {
  id: string = '';
  name: string = '';
  timestamp: number = Date.now();
  text: string = '';
  userId: string = '';
  threadId?: string;
  // channelId?: '...';
  reactions: Reaction[] = [];
  // isEdited?: boolean;
  // replyTo?: string; // optional: ID einer anderen Nachricht
  // reoplies - zum Anzeigen "1 Antwort" oder "2 Antworten"

  constructor(data?: Partial<Message>) {
    if (data) {
      this.id = data.id ?? this.id;
      this.name = data.name ?? this.name;
      this.timestamp = data.timestamp ?? this.timestamp;
      this.text = data.text ?? this.text;
      this.userId = data.userId ?? this.userId;
      this.threadId = data.threadId ?? this.threadId;
      this.reactions = data.reactions ?? this.reactions;
    }
  }
}
