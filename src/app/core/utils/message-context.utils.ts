import { Message } from '../models/message.model';
import { MessageContext } from '../interfaces/message-context.interface';
import { where, orderBy } from '@angular/fire/firestore';

/**
 * Checks whether a message belongs to a specific thread based on the cache key.
 *
 * @param msg The message to check.
 * @param cacheKey The cache key in the format `thread:<threadId>`.
 * @returns True if the message belongs to the thread.
 */
export function messageBelongsToThread(msg: Message, cacheKey: string): boolean {
    const threadId = cacheKey.split(':')[1];
    return msg.threadId === threadId;
}

/**
 * Generates a unique cache key for the given message context.
 *
 * @param context The message context (channel or direct).
 * @param currentUserId The ID of the current user (required for direct messages).
 * @returns A cache key in the format `channel:<id>` or `direct:<sorted-userA-userB>`.
 */
export function generateCacheKey(context: MessageContext, currentUserId?: string): string {
    if (context.type === 'channel') {
        return `channel:${context.id}`;
    } else {
        const a = currentUserId || '';
        const b = context.receiverId || '';
        return `direct:${[a, b].sort().join('-')}`;
    }
}

/**
 * Determines whether a message belongs to a given context (channel or direct).
 *
 * @param msg The message to check.
 * @param cacheKey The cache key of the context.
 * @returns True if the message matches the context.
 */
export function messageBelongsToContext(msg: Message, cacheKey: string): boolean {
    if (cacheKey.startsWith('channel:')) {
        return belongsToChannel(msg, cacheKey);
    }
    if (cacheKey.startsWith('direct:')) {
        return belongsToDirect(msg, cacheKey);
    }
    return false;
}

function belongsToChannel(msg: Message, cacheKey: string): boolean {
    const channelId = cacheKey.split(':')[1];
    return msg.channelId === channelId;
}

function belongsToDirect(msg: Message, cacheKey: string): boolean {
    const ids = cacheKey.substring('direct:'.length).split('-');
    if (!msg.isDirectMessage) return false;

    if (ids[0] === ids[1]) {
        return msg.userId === ids[0] && msg.receiverId === ids[0];
    }

    return (
        (msg.userId === ids[0] && msg.receiverId === ids[1]) ||
        (msg.userId === ids[1] && msg.receiverId === ids[0])
    );
}

/**
 * Filters the given messages to match the specified context.
 *
 * @param messages All loaded messages.
 * @param context The target context (channel or direct).
 * @param currentUserId The ID of the current user (required for direct context).
 * @returns An array of messages that belong to the context.
 */
export function filterMessagesByContext(
    messages: Message[],
    context: MessageContext,
    currentUserId: string
): Message[] {
    if (context.type === 'channel') {
        return filterChannelMessages(messages, context);
    }
    if (context.type === 'direct' && context.receiverId) {
        return filterDirectMessages(messages, context, currentUserId);
    }
    return [];
}

function filterChannelMessages(messages: Message[], context: MessageContext): Message[] {
    return messages.filter(m => m.channelId === context.id);
}

function filterDirectMessages(
    messages: Message[],
    context: MessageContext,
    currentUserId: string
): Message[] {
    return messages.filter(m =>
        m.isDirectMessage &&
        ((m.userId === currentUserId && m.receiverId === context.receiverId) ||
            (m.userId === context.receiverId && m.receiverId === currentUserId))
    );
}

/**
 * Returns Firestore query conditions for a direct message relationship between two users.
 *
 * @param userA First user ID.
 * @param userB Second user ID.
 * @returns An array of Firestore where/orderBy conditions.
 */
export function directQueryConditions(userA: string, userB: string) {
    return [
        where('isDirectMessage', '==', true),
        where('userId', '==', userA),
        where('receiverId', '==', userB),
        orderBy('timestamp', 'asc')
    ];
}

/**
 * Extracts the original MessageContext object from a cache key.
 *
 * @param key A cache key in the format `channel:<id>` or `direct:<userA-userB>`.
 * @returns The corresponding MessageContext object.
 */
export function extractContextFromKey(key: string): MessageContext {
    if (key.startsWith('channel:')) {
        return { type: 'channel', id: key.split(':')[1] };
    }
    if (key.startsWith('direct:')) {
        const ids = key.split(':')[1].split('-');
        return { type: 'direct', id: '', receiverId: ids[1] };
    }
    return { type: 'channel', id: '' };
}