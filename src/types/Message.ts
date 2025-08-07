export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  rentalId?: string; // Optional link to rental
  dogId?: string; // Optional link to dog
}

export interface Conversation {
  id: string;
  participants: string[]; // Array of user IDs
  participantNames: string[]; // Array of user names
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageData {
  receiverId: string;
  receiverName: string;
  content: string;
  rentalId?: string;
  dogId?: string;
}

export interface ConversationSummary {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
} 