export interface MessageContext {
    type: 'channel' | 'direct';
    id?: string; // channelId oder userId
    receiverId?: string; // für Direktnachrichten
}
