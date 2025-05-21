export class Message {
  id: string = '';
  name: string = '';
  timestamp: number = Date.now();
  text: string = '';
  userId: string = '';
  threadId?: string;
  reactions: any[] = [];

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
