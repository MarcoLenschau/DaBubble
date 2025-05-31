import { Message } from './message.model';

export class Channel {
  id: string = '';
  name: string = ''; // title
  description?: string;
  members: string[] = []; // userIds
  messages: Message[] = [];
  // isPrivate?: boolean;
  // createdAt?: number;
  createdBy?: string = ''; // userId

  constructor(data?: Partial<Channel>) {
    if (data) {
      this.id = data.id ?? this.id;
      this.name = data.name ?? this.name;
      this.description = data.description;
      this.members = data.members ?? this.members;
      this.messages = data.messages ?? this.messages;
      this.createdBy = data.createdBy ?? this.createdBy;
    }
  }
}
