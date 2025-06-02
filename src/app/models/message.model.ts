import { Reaction } from '../interfaces/reaction.interface';

export class Message {
  id: string = '';
  name: string = '';
  timestamp: number = Date.now();
  text: string = '';
  userId: string = '';
  receiverId?: string;
  isDirectMessage: boolean = false;
  threadId?: string;
  channelId?: string;
  reactions: Reaction[] = [];
  // isEdited?: boolean;
  lastReplyTimestamp?: number;
  replies: number = 0;

  constructor(data?: Partial<Message>) {
    if (data) {
      this.id = data.id ?? this.id;
      this.name = data.name ?? this.name;
      this.timestamp = data.timestamp ?? this.timestamp;
      this.text = data.text ?? this.text;
      this.userId = data.userId ?? this.userId;
      this.receiverId = data.receiverId ?? this.receiverId;
      this.isDirectMessage = data.isDirectMessage ?? this.isDirectMessage;
      this.threadId = data.threadId ?? this.threadId;
      this.channelId = data.channelId ?? this.channelId;
      this.reactions = data.reactions ?? this.reactions;
      this.lastReplyTimestamp = data.lastReplyTimestamp ?? this.lastReplyTimestamp;
      this.replies = data.replies ?? this.replies;
    }
  }
}
