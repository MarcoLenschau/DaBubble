import { EventEmitter } from '@angular/core';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { Reaction } from '../interfaces/reaction.interface';
import { MessageContext } from '../interfaces/message-context.interface';

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

export function areUsersEqual(a: User, b: User): boolean {
  return a?.id === b?.id &&
    a?.displayName === b?.displayName &&
    a?.email === b?.email &&
    a?.photoURL === b?.photoURL &&
    arraysEqual(a?.recentEmojis ?? [], b?.recentEmojis ?? []) &&
    objectsEqual(a?.emojiUsage ?? {}, b?.emojiUsage ?? {});
}

function arraysEqual(arr1: string[], arr2: string[]): boolean {
  return arr1.length === arr2.length && arr1.every((v, i) => v === arr2[i]);
}

function objectsEqual(obj1: { [key: string]: number }, obj2: { [key: string]: number }): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  return keys1.every(key => obj1[key] === obj2[key]);
}