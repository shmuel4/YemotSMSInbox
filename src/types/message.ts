export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  read: boolean;
  avatar: string;
  type: 'outgoing' | 'incoming';
}

export interface Conversation {
  id: string;
  contact: string;
  lastMessage: Message;
  messages: Message[];
  unreadCount: number;
  avatar: string;
  type: 'outgoing' | 'incoming';
}