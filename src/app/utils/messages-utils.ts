import { EventEmitter } from '@angular/core';
import { Emoji } from '../interfaces/emojis-interface';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { Reaction } from '../interfaces/reaction.interface';
import { MessageContext } from '../interfaces/message-context.interface';

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m} Uhr`;
}

export function isNewDay(current: number, previous?: number): boolean {
  if (!previous) return true;
  const currentDate = new Date(current).toDateString();
  const previousDate = new Date(previous).toDateString();
  return currentDate !== previousDate;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();

  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return 'Heute';

  const sameYear = date.getFullYear() === today.getFullYear();

  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function formatRelativeTime(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const isToday = now.toDateString() === date.toDateString();
  return isToday ? formatTime(timestamp) : formatDate(timestamp);
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
  const existingReaction = processReaction(message, emojiName);

  if (existingReaction) {
    if (existingReaction.userIds.includes(userId)) {
      removeUserFromReaction(existingReaction, message, userId);
    } else {
      addUserToReaction(existingReaction, userId);
    }
  } else {
    addNewReaction(message, emojiName, userId);
  }
}

function processReaction(
  message: Message,
  emojiName: string
): Reaction | undefined {
  return message.reactions.find((r) => r.emojiName === emojiName);
}

function removeUserFromReaction(
  reaction: Reaction,
  message: Message,
  userId: string
): void {
  reaction.userIds = reaction.userIds.filter((id) => id !== userId);

  if (reaction.userIds.length === 0) {
    removeReactionAltogether(message, reaction);
  }
}

function addUserToReaction(reaction: Reaction, userId: string): void {
  reaction.userIds.push(userId);
}

function removeReactionAltogether(message: Message, reaction: Reaction): void {
  message.reactions = message.reactions.filter((r) => r !== reaction);
}

function addNewReaction(
  message: Message,
  emojiName: string,
  userId: string
): void {
  message.reactions.push({
    emojiName,
    userIds: [userId],
  });
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

export function updateEmojiDataForUser(user: User, emojiName: string): void {
  ensureEmojiFieldsExist(user);
  updateRecentEmojis(user, emojiName);
  updateEmojiUsageCount(user, emojiName);
}

function ensureEmojiFieldsExist(user: User): void {
  if (!user.recentEmojis) {
    user.recentEmojis = [];
  }
  if (!user.emojiUsage) {
    user.emojiUsage = {};
  }
}

function updateRecentEmojis(user: User, emojiName: string): void {
  const recent = user.recentEmojis ?? [];
  user.recentEmojis = [
    emojiName,
    ...recent.filter((e) => e !== emojiName),
  ].slice(0, 2);
}

function updateEmojiUsageCount(user: User, emojiName: string): void {
  if (!user.emojiUsage) {
    user.emojiUsage = {};
  }
  user.emojiUsage[emojiName] = (user.emojiUsage[emojiName] ?? 0) + 1;
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