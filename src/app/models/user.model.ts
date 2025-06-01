export class User {
  id: string = '';
  displayName: string = '';
  email: string = '';
  photoURL: string = '';
  recentEmojis?: string[] = [];
  emojiUsage?: { [emojiName: string]: number } = {};
  // status?: 'online' | 'offline';
  // lastSeen?: number;

  constructor(data?: Partial<User>) {
    this.id = data?.id ?? '';
    this.displayName = data?.displayName ?? '';
    this.email = data?.email ?? '';
    this.photoURL = data?.photoURL ?? '';
    this.recentEmojis = data?.recentEmojis ?? [];
    this.emojiUsage = data?.emojiUsage ?? {};
  }
}
