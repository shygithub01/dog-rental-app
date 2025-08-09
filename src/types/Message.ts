export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  dogId: string; // Required - every message must be about a specific dog
  dogName: string; // Required - for better context
  rentalId?: string; // Optional link to rental
}

export interface Conversation {
  id: string;
  participants: string[]; // Array of user IDs
  participantNames: string[]; // Array of user names
  dogId: string; // Required - conversation is about a specific dog
  dogName: string; // Required - for better context
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageData {
  receiverId: string;
  receiverName: string;
  content: string;
  dogId: string; // Required - every message must be about a specific dog
  dogName: string; // Required - for better context
  rentalId?: string;
}

export interface ConversationSummary {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  dogId: string; // Required - conversation is about a specific dog
  dogName: string; // Required - for better context
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
} 