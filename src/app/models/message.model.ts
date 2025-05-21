export class Message {
  id: string = '';
  name: string = '';
  timestamp: number = Date.now();
  text: string = '';
  isSelf: boolean = false;
  isThreadStarter: boolean = false;
  userId?: string;
  reactions: any[] = [];
  public: boolean = true;
  privateWithSelf: boolean = false;

  constructor(data?: Partial<Message>) {
    if (data) {
      this.id = data.id ?? this.id;
      this.name = data.name ?? this.name;
      this.timestamp = data.timestamp ?? this.timestamp;
      this.text = data.text ?? this.text;
      this.isSelf = data.isSelf ?? this.isSelf;
      this.isThreadStarter = data.isThreadStarter ?? this.isThreadStarter;
      this.userId = data.userId ?? this.userId;
      this.reactions = data.reactions ?? this.reactions;
      this.public = data.public ?? this.public;
      this.privateWithSelf = data.privateWithSelf ?? this.privateWithSelf;
    }
  }
}
