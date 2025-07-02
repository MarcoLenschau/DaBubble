import { EventEmitter } from '@angular/core';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { Reaction } from '../interfaces/reaction.interface';
import { MessageContext } from '../interfaces/message-context.interface';
import { MessageDataService } from '../services/message-data.service';

/**
 * Finds a user by their ID from a list.
 * 
 * @param users - List of user objects.
 * @param userId - ID of the user to find.
 * @returns The user with the given ID, or undefined if not found.
 */
export function getUserById(users: User[], userId: string): User | undefined {
  return users.find((user) => user.id === userId);
}

/**
 * Returns display names for a list of user IDs,
 * placing the current user (as "Du") at the end.
 * 
 * @param users - Full user list.
 * @param userIds - IDs of users to format.
 * @param currentUser - Currently logged in user.
 * @returns List of formatted names.
 */
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

/**
 * Moves "Du" (current user) to the end of the name list.
 * 
 * @param names - List of user display names.
 * @returns Modified list with "Du" at the end.
 */
export function moveCurrentUserToEnd(names: string[]): string[] {
  const normalNames = names.filter((name) => name !== 'Du');
  const nameIsCurrentUser = names.includes('Du') ? ['Du'] : [];
  return [...normalNames, ...nameIsCurrentUser];
}

/**
 * Returns "Du" for the current user, otherwise the user's display name.
  * 
 * @param user - The user to format.
 * @param currentUser - The currently logged in user.
 * @returns "Du" or display name.
 */
export function getDisplayName(user: User, currentUser: User): string {
  return user.id === currentUser.id ? 'Du' : user.displayName;
}

/**
 * Formats a list of user names and chooses appropriate verb form.
 * 
 * @param users - All available users.
 * @param userIds - User IDs to format.
 * @param currentUser - Current logged in user.
 * @returns Object with text and correct verb.
 */
export function formatUserNames(users: User[], userIds: string[], currentUser: User): { text: string; verb: string } {
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

/**
 * Checks if the message was sent by the current user.
 * 
 * @param msg - The message to check.
 * @param currentUserId - ID of the current user.
 * @returns True if the message was sent by the user.
 */
export function isOwnMessage(msg: Message, currentUserId: string): boolean {
  return msg.userId === currentUserId;
}

/**
 * Used for Angular's trackBy in *ngFor to optimize DOM rendering.
 * 
 * @param index - Index of the message.
 * @param msg - The message object.
 * @returns The message ID.
 */
export function trackByMessageId(index: number, msg: Message): string {
  return msg.id;
}

/**
 * Generates a temporary message ID using username and timestamp.
 * 
 * @param username - The username to include in ID.
 * @returns Unique temporary message ID.
 */
export function createTempMessageId(username: string): string {
  return `${username}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/**
 * Constructs a new message object.
 * 
 * @param audio - Base64-encoded audio string (if any).
 * @param text - Message text content.
 * @param currentUser - The current user sending the message.
 * @param threadId - ID of the thread this message belongs to.
 * @param channelId - ID of the channel (empty if direct message).
 * @returns Newly created message object.
 */
export function buildNewMessage(
  audio: string,
  text: string,
  currentUser: User,
  threadId: string,
  channelId: string
): Message {
  const isDirect = !channelId;
  return {
    audio: audio,
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

/**
 * Emits a general message context via EventEmitter.
 * 
 * @param emitter - The EventEmitter to emit through.
 * @param context - The message context to emit.
 */
export function emitContextSelected(
  emitter: EventEmitter<MessageContext>,
  context: MessageContext
): void {
  emitter.emit(context);
}

/**
 * Emits a direct message context (1:1) via EventEmitter.
 * 
 * @param emitter - The EventEmitter to emit through.
 * @param userId - The ID of the current user.
 * @param receiverId - The ID of the recipient user.
 */
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

/**
 * Emits a channel context via EventEmitter.
 * 
 * @param emitter - The EventEmitter to emit through.
 * @param channelId - The ID of the channel.
 */
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

/**
 * Emits the message context inferred from a message object.
 * 
 * @param emitter - The EventEmitter to emit through.
 * @param msg - The message to derive context from.
 * @param currentUserId - ID of the current user (used for direct messages).
 */
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

/**
 * Compares two messages and detects if any relevant fields changed.
 * 
 * @param oldMsg - The previous message object.
 * @param newMsg - The updated message object.
 * @returns True if any relevant fields differ.
 */
export function detectRelevantChanges(oldMsg: Message, newMsg: Message): boolean {
  if (oldMsg.name !== newMsg.name) return true;
  if (oldMsg.text !== newMsg.text) return true;
  if (oldMsg.threadId !== newMsg.threadId) return true;
  if (oldMsg.replies !== newMsg.replies) return true;
  if (oldMsg.lastReplyTimestamp !== newMsg.lastReplyTimestamp) return true;
  if (!areReactionsEqual(oldMsg.reactions, newMsg.reactions)) return true;
  return false;
}

/**
 * Deep equality comparison of two reaction arrays.
 * 
 * @param a - First reaction list.
 * @param b - Second reaction list.
 * @returns True if reactions are equal.
 */
function areReactionsEqual(a: Reaction[], b: Reaction[]): boolean {
  if ((a?.length ?? 0) !== (b?.length ?? 0)) return false;

  const copyA = normalizeReactions(a);
  const copyB = normalizeReactions(b);

  return compareNormalizedReactions(copyA, copyB);
}

/**
 * Normalizes reaction objects for comparison by sorting user IDs and reactions.
 * 
 * @param reactions - Reaction array to normalize.
 * @returns Normalized reaction data.
 */
function normalizeReactions(reactions: Reaction[]): { emojiName: string; userIds: string[] }[] {
  return reactions
    .map(r => ({
      emojiName: r.emojiName,
      userIds: [...r.userIds].sort()
    }))
    .sort((r1, r2) => r1.emojiName.localeCompare(r2.emojiName));
}

/**
 * Compares two normalized reaction arrays.
 * 
 * @param a - First normalized array.
 * @param b - Second normalized array.
 * @returns True if arrays are deeply equal.
 */
function compareNormalizedReactions(
  a: { emojiName: string; userIds: string[] }[],
  b: { emojiName: string; userIds: string[] }[]
): boolean {
  for (let i = 0; i < a.length; i++) {
    const ra = a[i], rb = b[i];
    if (ra.emojiName !== rb.emojiName) return false;
    if (ra.userIds.length !== rb.userIds.length) return false;
    for (let j = 0; j < ra.userIds.length; j++) {
      if (ra.userIds[j] !== rb.userIds[j]) return false;
    }
  }
  return true;
}

/**
 * Deep comparison of two user objects, including emoji metadata.
 * 
 * @param a - First user object.
 * @param b - Second user object.
 * @returns True if users are equal in all compared fields.
 */
export function areUsersEqual(a: User, b: User): boolean {
  return a?.id === b?.id &&
    a?.displayName === b?.displayName &&
    a?.email === b?.email &&
    a?.photoURL === b?.photoURL &&
    arraysEqual(a?.recentEmojis ?? [], b?.recentEmojis ?? []) &&
    objectsEqual(a?.emojiUsage ?? {}, b?.emojiUsage ?? {});
}

/**
 * Checks if two string arrays are equal.
 * 
 * @param arr1 - First array.
 * @param arr2 - Second array.
 * @returns True if equal.
 */
function arraysEqual(arr1: string[], arr2: string[]): boolean {
  return arr1.length === arr2.length && arr1.every((v, i) => v === arr2[i]);
}

/**
 * Compares two objects with numeric values for equality.
 * 
 * @param obj1 - First object.
 * @param obj2 - Second object.
 * @returns True if all keys and values match.
 */
function objectsEqual(obj1: { [key: string]: number }, obj2: { [key: string]: number }): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  return keys1.every(key => obj1[key] === obj2[key]);
}

/**
 * Updates replies count if it differs from current state and persists to backend.
 * 
 * @param msg - The message to update.
 * @param filteredMessages - All messages in the same thread.
 * @param messageDataService - Service to persist the update.
 */
export function updateRepliesCountIfNeeded(
  msg: Message,
  filteredMessages: Message[],
  messageDataService: MessageDataService
): void {
  const newCount = filteredMessages.length - 1;
  if (newCount !== msg.replies) {
    msg.replies = newCount;
    messageDataService
      .updateMessageFields(msg.id, { replies: newCount })
      .catch(error => console.error('Error updating replies count:', error));
  }
}

/**
 * Updates the hover state for a reaction tooltip, including user name formatting.
 * 
 * @param index - Hovered emoji index.
 * @param userIds - IDs of users who reacted.
 * @param ctx - State context containing tooltip fields and user data.
 */
export function setTooltipHoveredState(index: number | null, userIds: string[] | null, ctx: {
  users: any[];
  currentUser: any;
  tooltipHoveredIndex: number | null;
  formattedUserNames: string;
  tooltipText: string;
}): void {
  ctx.tooltipHoveredIndex = index;
  if (index !== null && userIds !== null) {
    const result = formatUserNames(ctx.users, userIds, ctx.currentUser);
    ctx.formattedUserNames = result.text;
    ctx.tooltipText = result.verb;
  }
}