export class User {
  id: string = '';
  displayName: string = '';
  email: string = '';
  photoURL: string = '';
  state: boolean = false;
  recentEmojis?: string[] = [];
  emojiUsage?: { [emojiName: string]: number } = {};
  // lastSeen?: number;

  constructor(data?: Partial<User>) {
    this.id = data?.id ?? '';
    this.displayName = data?.displayName ?? '';
    this.email = data?.email ?? '';
    this.photoURL = data?.photoURL ?? '';
    this.state = data?.state ?? false;
    this.recentEmojis = data?.recentEmojis ?? [];
    this.emojiUsage = data?.emojiUsage ?? {};
  }
}
