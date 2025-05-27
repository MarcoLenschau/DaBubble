export class User {
  id: string = '';
  displayName: string = '';
  email: string = '';
  img: string = '';
  recentEmojis?: string[] = [];
  emojiUsage?: { [emojiName: string]: number } = {};
  // status?: 'online' | 'offline';
  // lastSeen?: number;

  constructor(data?: Partial<User>) {
    this.id = data?.id ?? '';
    this.displayName = data?.displayName ?? '';
    this.email = data?.email ?? '';
    this.img = data?.img ?? '';
    this.recentEmojis = data?.recentEmojis ?? [];
    this.emojiUsage = data?.emojiUsage ?? {};
  }
}
