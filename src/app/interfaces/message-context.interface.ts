export interface MessageContext {
    type: 'channel' | 'direct';
    id?: string;
    receiverId?: string;
}
