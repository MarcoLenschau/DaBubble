import { Message } from '../models/message.model';
import { MessageContext } from '../interfaces/message-context.interface';
import { where, orderBy } from '@angular/fire/firestore';

export function messageBelongsToThread(msg: Message, cacheKey: string): boolean {
    const threadId = cacheKey.split(':')[1];
    return msg.threadId === threadId;
}

export function generateCacheKey(context: MessageContext, currentUserId?: string): string {
    if (context.type === 'channel') {
        return `channel:${context.id}`;
    } else {
        const ids = [currentUserId || '', context.receiverId || ''].sort();
        return `direct:${ids[0]}-${ids[1]}`;
    }
}

export function messageBelongsToContext(msg: Message, cacheKey: string): boolean {
    if (cacheKey.startsWith('channel:')) {
        const channelId = cacheKey.split(':')[1];
        return msg.channelId === channelId;
    }

    if (cacheKey.startsWith('direct:')) {
        const ids = cacheKey.substring('direct:'.length).split('-');
        if (!msg.isDirectMessage) return false;
        return (
            (msg.userId === ids[0] && msg.receiverId === ids[1]) ||
            (msg.userId === ids[1] && msg.receiverId === ids[0])
        );
    }

    return false;
}

export function filterMessagesByContext(
    messages: Message[],
    context: MessageContext,
    currentUserId: string
): Message[] {
    if (context.type === 'channel') {
        return messages.filter(m => m.channelId === context.id);
    }

    if (context.type === 'direct' && context.receiverId) {
        return messages.filter(m =>
            m.isDirectMessage &&
            ((m.userId === currentUserId && m.receiverId === context.receiverId) ||
                (m.userId === context.receiverId && m.receiverId === currentUserId))
        );
    }

    return [];
}

export function directQueryConditions(userA: string, userB: string) {
    return [
        where('isDirectMessage', '==', true),
        where('userId', '==', userA),
        where('receiverId', '==', userB),
        orderBy('timestamp', 'asc')
    ];
}

export function mapDocToMessage(doc: any): Message {
    const data = doc.data() as any;
    return new Message({
        id: doc.id,
        name: data.name,
        text: data.text,
        timestamp: data.timestamp ?? Date.now(),
        userId: data.userId,
        receiverId: data.receiverId ?? '',
        isDirectMessage: data.isDirectMessage ?? false,
        channelId: data.channelId ?? '',
        threadId: data.threadId ?? '',
        reactions: data.reactions ?? [],
        lastReplyTimestamp: data.lastReplyTimestamp,
        replies: data.replies ?? 0,
    });
}
