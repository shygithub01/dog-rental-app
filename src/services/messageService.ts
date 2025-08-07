import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, onSnapshot, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import type { Message, Conversation, CreateMessageData, ConversationSummary } from '../types/Message';

export class MessageService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Send a new message
  async sendMessage(senderId: string, senderName: string, messageData: CreateMessageData): Promise<string> {
    try {
      const message: Omit<Message, 'id'> = {
        senderId,
        senderName,
        receiverId: messageData.receiverId,
        receiverName: messageData.receiverName,
        content: messageData.content,
        timestamp: new Date(),
        isRead: false,
        rentalId: messageData.rentalId || undefined,
        dogId: messageData.dogId || undefined
      };

      // Only include defined fields in the Firebase document
      const firebaseMessage: any = {
        senderId: message.senderId,
        senderName: message.senderName,
        receiverId: message.receiverId,
        receiverName: message.receiverName,
        content: message.content,
        timestamp: Timestamp.fromDate(message.timestamp),
        isRead: message.isRead
      };

      // Only add optional fields if they exist
      if (message.rentalId) {
        firebaseMessage.rentalId = message.rentalId;
      }
      if (message.dogId) {
        firebaseMessage.dogId = message.dogId;
      }

      const docRef = await addDoc(collection(this.db, 'messages'), firebaseMessage);

      // Update or create conversation
      await this.updateConversation(senderId, messageData.receiverId, senderName, messageData.receiverName, message.content);

      console.log('Message sent successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Update conversation record
  private async updateConversation(user1Id: string, user2Id: string, user1Name: string, user2Name: string, lastMessageContent: string) {
    try {
      const conversationId = this.getConversationId(user1Id, user2Id);
      const participants = [user1Id, user2Id].sort();
      const participantNames = [user1Name, user2Name].sort();

      const conversationData = {
        participants,
        participantNames,
        lastMessage: lastMessageContent,
        unreadCount: 0,
        updatedAt: Timestamp.now()
      };

      await setDoc(doc(this.db, 'conversations', conversationId), conversationData, { merge: true });
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }

  // Get conversation ID (consistent for both users)
  private getConversationId(user1Id: string, user2Id: string): string {
    return [user1Id, user2Id].sort().join('_');
  }

  // Get user's conversations
  async getUserConversations(userId: string): Promise<ConversationSummary[]> {
    try {
      const conversationsQuery = query(
        collection(this.db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(conversationsQuery);
      const conversations: ConversationSummary[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const otherUserId = data.participants.find((id: string) => id !== userId);
        const otherUserName = data.participantNames.find((name: string, index: number) => 
          data.participants[index] === otherUserId
        );

        // Get unread count for this user
        const unreadQuery = query(
          collection(this.db, 'messages'),
          where('receiverId', '==', userId),
          where('senderId', '==', otherUserId),
          where('isRead', '==', false)
        );
        const unreadSnapshot = await getDocs(unreadQuery);
        const unreadCount = unreadSnapshot.size;

        conversations.push({
          conversationId: doc.id,
          otherUserId,
          otherUserName,
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.updatedAt.toDate(),
          unreadCount
        });
      }

      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getConversationMessages(user1Id: string, user2Id: string): Promise<Message[]> {
    try {
      console.log('Loading messages for conversation between:', user1Id, 'and', user2Id);
      
      // Get messages where user1 is sender
      const messagesQuery1 = query(
        collection(this.db, 'messages'),
        where('senderId', '==', user1Id)
      );
      
      const messagesSnapshot1 = await getDocs(messagesQuery1);
      const messages: Message[] = [];
      
      // Process messages where user1 is sender
      for (const doc of messagesSnapshot1.docs) {
        const data = doc.data();
        if (data.receiverId === user2Id) {
          messages.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            receiverId: data.receiverId,
            receiverName: data.receiverName,
            content: data.content,
            timestamp: data.timestamp.toDate(),
            isRead: data.isRead,
            rentalId: data.rentalId,
            dogId: data.dogId
          });
        }
      }

      // Get messages where user2 is sender
      const messagesQuery2 = query(
        collection(this.db, 'messages'),
        where('senderId', '==', user2Id)
      );
      
      const messagesSnapshot2 = await getDocs(messagesQuery2);
      
      // Process messages where user2 is sender
      for (const doc of messagesSnapshot2.docs) {
        const data = doc.data();
        if (data.receiverId === user1Id) {
          messages.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            receiverId: data.receiverId,
            receiverName: data.receiverName,
            content: data.content,
            timestamp: data.timestamp.toDate(),
            isRead: data.isRead,
            rentalId: data.rentalId,
            dogId: data.dogId
          });
        }
      }

      // Sort by timestamp
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      console.log('Found', messages.length, 'messages in conversation');
      return messages;
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    try {
      const unreadQuery = query(
        collection(this.db, 'messages'),
        where('senderId', '==', senderId),
        where('receiverId', '==', receiverId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(unreadQuery);
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { isRead: true })
      );

      await Promise.all(updatePromises);
      console.log(`Marked ${snapshot.size} messages as read`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Subscribe to real-time messages
  subscribeToMessages(userId: string, callback: (messages: Message[]) => void) {
    // Listen to messages where user is receiver
    const receivedMessagesQuery = query(
      collection(this.db, 'messages'),
      where('receiverId', '==', userId)
    );

    return onSnapshot(receivedMessagesQuery, (snapshot) => {
      const messages: Message[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          receiverId: data.receiverId,
          receiverName: data.receiverName,
          content: data.content,
          timestamp: data.timestamp.toDate(),
          isRead: data.isRead,
          rentalId: data.rentalId,
          dogId: data.dogId
        });
      });
      callback(messages);
    });
  }

  // Subscribe to conversation updates
  subscribeToConversations(userId: string, callback: (conversations: ConversationSummary[]) => void) {
    const conversationsQuery = query(
      collection(this.db, 'conversations'),
      where('participants', 'array-contains', userId)
    );

    return onSnapshot(conversationsQuery, async (snapshot) => {
      const conversations: ConversationSummary[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const otherUserId = data.participants.find((id: string) => id !== userId);
        const otherUserName = data.participantNames.find((name: string, index: number) => 
          data.participants[index] === otherUserId
        );

        // Get unread count with simplified query
        const unreadQuery = query(
          collection(this.db, 'messages'),
          where('receiverId', '==', userId),
          where('senderId', '==', otherUserId),
          where('isRead', '==', false)
        );
        const unreadSnapshot = await getDocs(unreadQuery);
        const unreadCount = unreadSnapshot.size;

        conversations.push({
          conversationId: doc.id,
          otherUserId,
          otherUserName,
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.updatedAt.toDate(),
          unreadCount
        });
      }
      
      // Sort by last message time
      conversations.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
      callback(conversations);
    });
  }
}

// Hook to use message service
export const useMessageService = () => {
  const { db } = useFirebase();
  return new MessageService(db);
}; 