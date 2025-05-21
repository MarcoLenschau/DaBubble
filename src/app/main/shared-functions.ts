import { Emoji } from '../interfaces/emojis-interface';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m} Uhr`;
}

export function getEmojiByName(
  emojis: Emoji[],
  name: string
): Emoji | undefined {
  return emojis.find((e) => e.name === name);
}

export function getUserById(users: User[], userId: string): User | undefined {
  return users.find((user) => user.id === userId);
}

export function getUserNames(
  users: User[],
  userIds: string[],
  currentUser: User
): string[] {
  const filtered = users.filter(
    (u): u is User => typeof u.id === 'string' && userIds.includes(u.id)
  );
  const names = filtered.map((u) => getDisplayName(u, currentUser));
  return moveCurrentUserToEnd(names);
}

export function moveCurrentUserToEnd(names: string[]): string[] {
  const normalNames = names.filter((name) => name !== 'Du');
  const nameIsCurrentUser = names.includes('Du') ? ['Du'] : [];
  return [...normalNames, ...nameIsCurrentUser];
}

export function getDisplayName(user: User, currentUser: User): string {
  return user.id === currentUser.id ? 'Du' : user.name;
}

export function formatUserNames(
  users: User[],
  userIds: string[],
  currentUser: User
): { text: string; verb: string } {
  const names = getUserNames(users, userIds, currentUser);

  if (names.length === 0) {
    return { text: '', verb: '' };
  }
  if (names.length === 1) {
    return { text: names[0], verb: 'hat' };
  }

  const text =
    names.slice(0, -1).join(', ') + ' und ' + names[names.length - 1];
  return { text, verb: 'haben' };
}

//************************************************************ */
// Dummy-Daten:

export const currentUser: User = {
  id: 'user4',
  name: 'Frederik Beck',
  email: 'frederik@example.com',
  img: 'frederik.jpg',
};

export const users: User[] = [
  {
    id: 'user1',
    name: 'Noah Braun',
    email: 'noah@example.com',
    img: 'noah.jpg',
  },
  {
    id: 'user2',
    name: 'Sofia Müller',
    email: 'sofia@example.com',
    img: 'sofia.jpg',
  },
  {
    id: 'user3',
    name: 'Anna Müller',
    email: 'anna@example.com',
    img: 'anna.jpg',
  },
  {
    id: 'user4',
    name: 'Frederik Beck',
    email: 'frederik@example.com',
    img: 'frederik.jpg',
  },
  {
    id: 'user5',
    name: 'Lena Schmidt',
    email: 'lena@example.com',
    img: 'lena.jpg',
  },
  {
    id: 'user6',
    name: 'Martin Kurz',
    email: 'martin@example.com',
    img: 'martin.jpg',
  },
];

export const messages: Message[] = [
  {
    id: 'msg1',
    name: 'Noah Braun',
    timestamp: 1684411440000,
    text: 'Hallo zusammen, wie läuft das aktuelle Projekt bei euch?',
    isSelf: false,
    isThreadStarter: true,
    userId: 'user1',
    public: true,
    privateWithSelf: false,
    reactions: [
      { emojiName: 'emoji-thumb', userIds: ['user1', 'user4', 'user6'] },
      { emojiName: 'check-mark', userIds: ['user3'] },
    ],
  },
  {
    id: 'msg2',
    name: 'Sofia Müller',
    timestamp: 1684413060000,
    text: 'Bei uns läuft alles gut.',
    isSelf: false,
    isThreadStarter: false,
    userId: 'user2',
    public: true,
    privateWithSelf: false,
    reactions: [{ emojiName: 'hands-up', userIds: ['user1', 'user6'] }],
  },
  {
    id: 'msg3',
    name: 'Anna Müller',
    timestamp: 1684413420000,
    text: 'Super, dann können wir ja bald mit dem Testing starten! Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    isSelf: false,
    isThreadStarter: false,
    userId: 'user3',
    public: true,
    privateWithSelf: false,
    reactions: [
      { emojiName: 'emoji-thumb', userIds: ['user4', 'user6'] },
      { emojiName: 'emoji-rocket', userIds: ['user3'] },
      { emojiName: 'emoji-nerd', userIds: ['user1', 'user4', 'user6'] },
      { emojiName: 'check-mark', userIds: ['user3'] },
      { emojiName: 'hands-up', userIds: ['user3'] },
      { emojiName: 'emoji-thumb', userIds: ['user4', 'user6'] },
      { emojiName: 'emoji-rocket', userIds: ['user3'] },
      { emojiName: 'emoji-nerd', userIds: ['user1', 'user4', 'user6'] },
      { emojiName: 'check-mark', userIds: ['user3'] },
      { emojiName: 'hands-up', userIds: ['user3'] },
    ],
  },
  {
    id: 'msg4',
    name: 'Frederik Beck',
    timestamp: 1684413840000,
    text: 'Ja genau.',
    isSelf: true,
    isThreadStarter: false,
    userId: 'user4',
    public: true,
    privateWithSelf: false,
    reactions: [
      {
        emojiName: 'emoji-thumb',
        userIds: ['user1', 'user3', 'user4', 'user6'],
      },
      { emojiName: 'hands-up', userIds: ['user3'] },
    ],
  },
  {
    id: 'msg5',
    name: 'Lena Schmidt',
    timestamp: 1684414000000,
    text: 'Könntest du bitte die Dokumentation noch einmal überprüfen? Ich habe einige Fehler gefunden, besonders bei den API-Endpunkten.',
    isSelf: false,
    isThreadStarter: false,
    userId: 'user5',
    public: true,
    privateWithSelf: false,
    reactions: [
      { emojiName: 'emoji-thumb', userIds: ['user4', 'user6'] },
      { emojiName: 'emoji-rocket', userIds: ['user3'] },
    ],
  },
  {
    id: 'msg6',
    name: 'Martin Kurz',
    timestamp: 1684414200000,
    text: 'Ich stimme Lena zu. Lorem ipsum.',
    isSelf: false,
    isThreadStarter: false,
    userId: 'user6',
    public: true,
    privateWithSelf: false,
    reactions: [
      { emojiName: 'check-mark', userIds: ['user3', 'user4', 'user6'] },
    ],
  },
  {
    id: 'msg7',
    name: 'Frederik Beck',
    timestamp: 1684414264000,
    text: 'Lorem ipsum dolor, sit amet. Lorem ipsum dolor sit amet consectetur adipisicing elit.',
    isSelf: true,
    isThreadStarter: false,
    userId: 'user4',
    public: true,
    privateWithSelf: false,
    reactions: [
      { emojiName: 'emoji-thumb', userIds: ['user4', 'user6'] },
      { emojiName: 'emoji-rocket', userIds: ['user3'] },
      { emojiName: 'emoji-nerd', userIds: ['user1', 'user4', 'user6'] },
      { emojiName: 'check-mark', userIds: ['user3'] },
      { emojiName: 'hands-up', userIds: ['user3'] },
    ],
  },
];
