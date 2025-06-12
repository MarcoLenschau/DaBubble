import { EventEmitter } from '@angular/core';
import { Emoji } from '../interfaces/emojis.interface';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { Reaction } from '../interfaces/reaction.interface';
import { MessageContext } from '../interfaces/message-context.interface';

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
): Message {
  const existingReaction = message.reactions.find((r) => r.emojiName === emojiName);

  let newReactions: Reaction[];

  if (!existingReaction) {
    newReactions = addNewReaction(message.reactions, emojiName, userId);
  } else if (existingReaction.userIds.includes(userId)) {
    newReactions = removeUserFromReaction(message.reactions, existingReaction, userId);
  } else {
    newReactions = addUserToReaction(message.reactions, existingReaction, userId);
  }

  return { ...message, reactions: newReactions };
}

function processReaction(
  message: Message,
  emojiName: string
): Reaction | undefined {
  return message.reactions.find((r) => r.emojiName === emojiName);
}

function removeUserFromReaction(
  reactions: Reaction[],
  target: Reaction,
  userId: string
): Reaction[] {
  const updatedUserIds = target.userIds.filter(id => id !== userId);

  if (updatedUserIds.length === 0) {
    return reactions.filter(r => r !== target);
  }

  return reactions.map(r =>
    r === target ? { ...r, userIds: updatedUserIds } : r
  );
}

function addUserToReaction(
  reactions: Reaction[],
  target: Reaction,
  userId: string
): Reaction[] {
  return reactions.map(r =>
    r === target ? { ...r, userIds: [...r.userIds, userId] } : r
  );
}


function removeReactionAltogether(message: Message, reaction: Reaction): void {
  message.reactions = message.reactions.filter((r) => r !== reaction);
}

function addNewReaction(
  reactions: Reaction[],
  emojiName: string,
  userId: string
): Reaction[] {
  return [
    ...reactions,
    { emojiName, userIds: [userId] }
  ];
}

export function getSortedEmojisForUser(user: User, emojis: Emoji[]): Emoji[] {
  if (!hasEmojiData(user)) {
    return getDefaultEmojis(emojis);
  }

  const recent = getRecentEmojis(user, emojis);
  const frequent = getFrequentEmojisExcludingRecent(user, emojis, recent);
  const remaining = getRemainingEmojis(emojis, recent, frequent);

  return [...recent, ...frequent, ...remaining];
}

function hasEmojiData(user: User): boolean {
  return (
    (user.recentEmojis?.length ?? 0) > 0 ||
    Object.keys(user.emojiUsage ?? {}).length > 0
  );
}

function getFrequentEmojisExcludingRecent(
  user: User,
  emojis: Emoji[],
  recent: Emoji[]
): Emoji[] {
  const recentNames = recent.map((e) => e.name);
  return getFrequentEmojis(user, emojis, recentNames);
}

function getRemainingEmojis(
  emojis: Emoji[],
  recent: Emoji[],
  frequent: Emoji[]
): Emoji[] {
  const excludeNames = [...recent, ...frequent].map((e) => e.name);
  return emojis.filter((e) => !excludeNames.includes(e.name));
}

function getDefaultEmojis(emojis: Emoji[]): Emoji[] {
  return [...emojis];
}

function getRecentEmojis(user: User, emojis: Emoji[]): Emoji[] {
  const recent = user.recentEmojis ?? [];
  return recent
    .slice(0, 2)
    .map((name) => emojis.find((e) => e.name === name))
    .filter((e): e is Emoji => !!e);
}

function getFrequentEmojis(
  user: User,
  emojis: Emoji[],
  excludeNames: string[]
): Emoji[] {
  const usage = user.emojiUsage ?? {};
  return Object.entries(usage)
    .filter(([name]) => !excludeNames.includes(name))
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => emojis.find((e) => e.name === name))
    .filter((e): e is Emoji => !!e);
}

export function updateEmojiDataForUser(user: User, emojiName: string): User {
  const recentEmojis = updateRecentEmojis(user.recentEmojis ?? [], emojiName);
  const emojiUsage = updateEmojiUsageCount(user.emojiUsage ?? {}, emojiName);

  const recentChanged = user.recentEmojis !== recentEmojis;
  const usageChanged = user.emojiUsage !== emojiUsage;

  if (!recentChanged && !usageChanged) {
    return user;
  }

  return {
    ...user,
    recentEmojis,
    emojiUsage
  };
}

// function updateRecentEmojis(recent: string[], emojiName: string): string[] {
//   const filtered = recent.filter(e => e !== emojiName);
//   return [emojiName, ...filtered].slice(0, 2);
// }

function updateRecentEmojis(recent: string[], emojiName: string): string[] {
  const filtered = recent.filter(e => e !== emojiName);
  const newRecent = [emojiName, ...filtered].slice(0, 2);

  // Vergleich, ob sich recent und newRecent inhaltlich unterscheiden
  const isEqual = recent.length === newRecent.length &&
    recent.every((val, index) => val === newRecent[index]);

  if (isEqual) {
    return recent;  // kein neues Objekt erzeugen
  }

  return newRecent;
}


// function updateEmojiUsageCount(usage: { [key: string]: number }, emojiName: string): { [key: string]: number } {
//   return {
//     ...usage,
//     [emojiName]: (usage[emojiName] ?? 0) + 1
//   };
// }
function updateEmojiUsageCount(usage: { [key: string]: number }, emojiName: string): { [key: string]: number } {
  const oldCount = usage[emojiName] ?? 0;
  const newCount = oldCount + 1;

  if (oldCount === newCount) {
    return usage; // kein neues Objekt erzeugen, keine Änderung
  }

  return {
    ...usage,
    [emojiName]: newCount
  };
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
  return user.id === currentUser.id ? 'Du' : user.displayName;
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
    const verb = names[0] === 'Du' ? 'hast' : 'hat';
    return { text: names[0], verb };
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
  channelId: string
): Message {
  const isDirect = !channelId;
  return {
    id: createTempMessageId(currentUser.displayName),
    name: currentUser.displayName,
    timestamp: Date.now(),
    text: text,
    userId: currentUser.id,
    isDirectMessage: isDirect,
    threadId: threadId,
    channelId: channelId,
    reactions: [],
    replies: 0,

  };
}

export function emitContextSelected(
  emitter: EventEmitter<MessageContext>,
  context: MessageContext
): void {
  emitter.emit(context);
}

export function emitDirectUserContext(
  emitter: EventEmitter<MessageContext>,
  userId: string,
  receiverId: string
): void {
  emitContextSelected(emitter, {
    type: 'direct',
    id: userId,
    receiverId,
  });
}

export function emitChannelContext(
  emitter: EventEmitter<MessageContext>,
  channelId: string
): void {
  emitContextSelected(emitter, {
    type: 'channel',
    id: channelId,
    receiverId: '',
  });
}

export function emitMessageContextFromMessage(
  emitter: EventEmitter<MessageContext>,
  msg: Message,
  currentUserId: string
): void {
  const type = msg.channelId ? 'channel' : 'direct';
  const id = msg.channelId ?? msg.userId;
  const receiverId = msg.channelId ? '' : currentUserId;

  emitContextSelected(emitter, { type, id, receiverId });
}

export function detectRelevantChanges(oldMsg: Message, newMsg: Message): boolean {
  if (oldMsg.name !== newMsg.name) return true;
  if (oldMsg.text !== newMsg.text) return true;
  if (oldMsg.threadId !== newMsg.threadId) return true;
  if (oldMsg.replies !== newMsg.replies) return true;
  if (oldMsg.lastReplyTimestamp !== newMsg.lastReplyTimestamp) return true;
  if (!areReactionsEqual(oldMsg.reactions, newMsg.reactions)) return true;
  return false;
}

function areReactionsEqual(a: Reaction[], b: Reaction[]): boolean {
  if ((a?.length ?? 0) !== (b?.length ?? 0)) return false;

  const copyA = a.map(r => ({
    emojiName: r.emojiName,
    userIds: [...r.userIds].sort(),
  }));
  const copyB = b.map(r => ({
    emojiName: r.emojiName,
    userIds: [...r.userIds].sort(),
  }));

  copyA.sort((r1, r2) => r1.emojiName.localeCompare(r2.emojiName));
  copyB.sort((r1, r2) => r1.emojiName.localeCompare(r2.emojiName));

  for (let i = 0; i < copyA.length; i++) {
    const ra = copyA[i], rb = copyB[i];
    if (ra.emojiName !== rb.emojiName) return false;
    if (ra.userIds.length !== rb.userIds.length) return false;
    for (let j = 0; j < ra.userIds.length; j++) {
      if (ra.userIds[j] !== rb.userIds[j]) return false;
    }
  }
  return true;
}
