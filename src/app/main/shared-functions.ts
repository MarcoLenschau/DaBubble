import { Emoji, EMOJIS } from '../interfaces/emojis-interface';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { Channel } from '../models/channel.model';

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

export function getEmojiByUnicode(
  emojis: Emoji[],
  unicode: string
): Emoji | undefined {
  return emojis.find((e) => e.unicode === unicode);
}

export function addEmojiToTextarea(
  textareaContent: string,
  unicodeEmoji: string
): string {
  return textareaContent + unicodeEmoji;
}

export function addEmojiToMessage(
  emojiName: string,
  message: Message,
  userId: string
) {
  let reaction = message.reactions.find((r) => r.emojiName === emojiName);

  if (reaction) {
    if (reaction.userIds.includes(userId)) {
      reaction.userIds = reaction.userIds.filter((id) => id !== userId);

      if (reaction.userIds.length === 0) {
        message.reactions = message.reactions.filter((r) => r !== reaction);
      }
    } else {
      reaction.userIds.push(userId);
    }
  } else {
    message.reactions.push({
      emojiName: emojiName,
      userIds: [userId],
    });
  }
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

export function isOwnMessage(msg: Message, currentUserId: string): boolean {
  return msg.userId === currentUserId;
}

export function trackByMessageId(index: number, msg: Message): string {
  return msg.id;
}

export function createTempMessageId(username: string): string {
  return `${username}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function buildNewMessage(
  text: string,
  currentUser: User,
  threadId: string,
  channelId: string = ''
): Message {
  return {
    id: createTempMessageId(currentUser.name),
    name: currentUser.name,
    timestamp: Date.now(),
    text: text,
    userId: currentUser.id,
    threadId: threadId,
    channelId: channelId,
    reactions: [],
  };
}

// Später löschen ************************************************************ */
// Dummy-Daten:

export const currentUser: User = {
  id: 'user4',
  name: 'Frederik Beck',
  email: 'frederik@example.com',
  img: './assets/img/profilepic/frederik.png',
};

export const users: User[] = [
  {
    id: 'user1',
    name: 'Elise Roth',
    email: 'elise@example.com',
    img: './assets/img/profilepic/elise.png',
  },
  {
    id: 'user2',
    name: 'Sofia Müller',
    email: 'sofia@example.com',
    img: './assets/img/profilepic/sofia.png',
  },
  {
    id: 'user3',
    name: 'Noah Braun',
    email: 'noah@example.com',
    img: './assets/img/profilepic/noah.png',
  },
  {
    id: 'user4',
    name: 'Frederik Beck',
    email: 'frederik@example.com',
    img: './assets/img/profilepic/frederik.png',
  },
  {
    id: 'user5',
    name: 'Elias Neumann',
    email: 'elias@example.com',
    img: './assets/img/profilepic/elias.png',
  },
  {
    id: 'user6',
    name: 'Steffen Hoffmann',
    email: 'steffen@example.com',
    img: './assets/img/profilepic/steffen.png',
  },
];

export const messages: Message[] = [
  {
    id: 'msg1',
    name: 'Elise Roth',
    timestamp: 1684411440000,
    text: 'Hallo zusammen, wie läuft das aktuelle Projekt bei euch?',
    userId: 'user1',
    threadId: '',
    channelId: '',
    reactions: [
      { emojiName: 'thumbs-up', userIds: ['user1', 'user4', 'user6'] },
      { emojiName: 'check-mark', userIds: ['user3'] },
    ],
  },
  {
    id: 'msg2',
    name: 'Sofia Müller',
    timestamp: 1684413060000,
    text: 'Bei uns läuft alles gut.',
    userId: 'user2',
    threadId: '',
    channelId: '',
    reactions: [{ emojiName: 'hands-up', userIds: ['user1', 'user6'] }],
  },
  {
    id: 'msg3',
    name: 'Noah Braun',
    timestamp: 1684413420000,
    text: 'Super, dann können wir ja bald mit dem Testing starten! Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    userId: 'user3',
    threadId: '',
    channelId: '',
    reactions: [
      { emojiName: 'thumbs-up', userIds: ['user4', 'user6'] },
      { emojiName: 'rocket', userIds: ['user3'] },
      { emojiName: 'nerd', userIds: ['user1', 'user4', 'user6'] },
      { emojiName: 'check-mark', userIds: ['user3'] },
      { emojiName: 'hands-up', userIds: ['user3'] },
      { emojiName: 'thumbs-up', userIds: ['user4', 'user6'] },
      { emojiName: 'rocket', userIds: ['user3'] },
      { emojiName: 'nerd', userIds: ['user1', 'user4', 'user6'] },
      { emojiName: 'check-mark', userIds: ['user3'] },
      { emojiName: 'hands-up', userIds: ['user3'] },
    ],
  },
  {
    id: 'msg4',
    name: 'Frederik Beck',
    timestamp: 1684413840000,
    text: 'Ja genau.',
    userId: 'user4',
    threadId: '',
    channelId: '',
    reactions: [
      {
        emojiName: 'thumbs-up',
        userIds: ['user1', 'user3', 'user4', 'user6'],
      },
      { emojiName: 'hands-up', userIds: ['user3'] },
    ],
  },
  {
    id: 'msg5',
    name: 'Elias Neumann',
    timestamp: 1684414000000,
    text: 'Könntest du bitte die Dokumentation noch einmal überprüfen? Ich habe einige Fehler gefunden, besonders bei den API-Endpunkten.',
    userId: 'user5',
    threadId: '',
    channelId: '',
    reactions: [
      { emojiName: 'thumbs-up', userIds: ['user4', 'user6'] },
      { emojiName: 'rocket', userIds: ['user3'] },
    ],
  },
  {
    id: 'msg6',
    name: 'Steffen Hoffmann',
    timestamp: 1684414200000,
    text: 'Ich stimme Lena zu. Lorem ipsum.',
    userId: 'user6',
    threadId: '',
    channelId: '',
    reactions: [
      { emojiName: 'check-mark', userIds: ['user3', 'user4', 'user6'] },
    ],
  },
  {
    id: 'msg7',
    name: 'Frederik Beck',
    timestamp: 1684414264000,
    text: 'Lorem ipsum dolor, sit amet. Lorem ipsum dolor sit amet consectetur adipisicing elit.',
    userId: 'user4',
    threadId: '',
    channelId: '',
    reactions: [
      { emojiName: 'thumbs-up', userIds: ['user4', 'user6'] },
      { emojiName: 'rocket', userIds: ['user3'] },
      { emojiName: 'nerd', userIds: ['user1', 'user4', 'user6'] },
      { emojiName: 'check-mark', userIds: ['user3'] },
      { emojiName: 'hands-up', userIds: ['user3'] },
    ],
  },
];

export const channels: Channel[] = [
  new Channel({
    id: 'chan1',
    name: 'Entwicklerteam',
    description: 'Diskussionen rund um die Entwicklung',
    members: ['user1', 'user2', 'user3', 'user4'],
    messages: messages.filter((m) => m.channelId === 'chan1'),
  }),
  new Channel({
    id: 'chan2',
    name: 'Design-Team',
    description: 'UX/UI, Farben, Schriften',
    members: ['user2', 'user5', 'user6'],
    messages: messages.filter((m) => m.channelId === 'chan2'),
  }),
  new Channel({
    id: 'chan3',
    name: 'Allgemein',
    description: 'Teamweite Kommunikation',
    members: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6'],
    messages: messages.filter((m) => m.channelId === 'chan3'),
  }),
];
