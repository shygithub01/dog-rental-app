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
        dogId: messageData.dogId,
        dogName: messageData.dogName,
        rentalId: messageData.rentalId || undefined
      };

      // Create Firebase message document
      const firebaseMessage: any = {
        senderId: message.senderId,
        senderName: message.senderName,
        receiverId: message.receiverId,
        receiverName: message.receiverName,
        content: message.content,
        timestamp: Timestamp.fromDate(message.timestamp),
        isRead: message.isRead,
        dogId: message.dogId,
        dogName: message.dogName
      };

      // Only add optional fields if they exist
      if (message.rentalId) {
        firebaseMessage.rentalId = message.rentalId;
      }

      const docRef = await addDoc(collection(this.db, 'messages'), firebaseMessage);

      // Update or create dog-specific conversation
      await this.updateConversation(
        senderId, 
        messageData.receiverId, 
        senderName, 
        messageData.receiverName, 
        messageData.dogId,
        messageData.dogName,
        message.content
      );

      console.log('Message sent successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Update conversation record - now dog-specific
  private async updateConversation(
    user1Id: string, 
    user2Id: string, 
    user1Name: string, 
    user2Name: string, 
    dogId: string,
    dogName: string,
    lastMessageContent: string
  ) {
    try {
      const conversationId = this.getConversationId(user1Id, user2Id, dogId);
      const participants = [user1Id, user2Id].sort();
      const participantNames = [user1Name, user2Name].sort();

      const conversationData = {
        participants,
        participantNames,
        dogId,
        dogName,
        lastMessage: lastMessageContent,
        unreadCount: 0,
        updatedAt: Timestamp.now()
      };

      await setDoc(doc(this.db, 'conversations', conversationId), conversationData, { merge: true });
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }

  // Get conversation ID - now includes dogId for uniqueness
  private getConversationId(user1Id: string, user2Id: string, dogId: string): string {
    const sortedUsers = [user1Id, user2Id].sort();
    return `${sortedUsers[0]}_${sortedUsers[1]}_${dogId}`;
  }

  // Check if conversation exists between two users for a specific dog
  async conversationExists(user1Id: string, user2Id: string, dogId: string): Promise<boolean> {
    try {
      const conversationId = this.getConversationId(user1Id, user2Id, dogId);
      const conversationDoc = await getDoc(doc(this.db, 'conversations', conversationId));
      return conversationDoc.exists();
    } catch (error) {
      console.error('Error checking if conversation exists:', error);
      return false;
    }
  }

  // Get user's conversations - now filtered by dog context
  async getUserConversations(userId: string): Promise<ConversationSummary[]> {
    try {
      console.log(`Getting conversations for user: ${userId}`);
      const conversationsQuery = query(
        collection(this.db, 'conversations'),
        where('participants', 'array-contains', userId)
      );

      const snapshot = await getDocs(conversationsQuery);
      console.log(`Found ${snapshot.size} conversations for user: ${userId}`);
      const conversations: ConversationSummary[] = [];

      for (const doc of snapshot.docs) {
        try {
          const data = doc.data();
          console.log('Processing conversation:', doc.id, data);
          
          // Handle legacy conversations that might not have dogId/dogName
          if (!data.dogId || !data.dogName) {
            console.log('Legacy conversation detected, skipping:', doc.id);
            continue; // Skip legacy conversations for now
          }
          
          const otherUserId = data.participants.find((id: string) => id !== userId);
          const otherUserName = data.participantNames.find((name: string, index: number) => 
            data.participants[index] === otherUserId
          );

          if (!otherUserId || !otherUserName) {
            console.log('Invalid conversation data, skipping:', doc.id);
            continue;
          }

          // Get unread count for this specific conversation (dog-specific)
          const unreadQuery = query(
            collection(this.db, 'messages'),
            where('receiverId', '==', userId),
            where('senderId', '==', otherUserId),
            where('dogId', '==', data.dogId),
            where('isRead', '==', false)
          );
          const unreadSnapshot = await getDocs(unreadQuery);
          const unreadCount = unreadSnapshot.size;

          conversations.push({
            conversationId: doc.id,
            otherUserId,
            otherUserName,
            dogId: data.dogId,
            dogName: data.dogName,
            lastMessage: data.lastMessage || '',
            lastMessageTime: data.updatedAt?.toDate() || new Date(),
            unreadCount
          });
        } catch (conversationError) {
          console.error('Error processing conversation:', doc.id, conversationError);
          continue; // Skip this conversation and continue with others
        }
      }

      console.log(`Successfully processed ${conversations.length} conversations for user: ${userId}`);
      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  // Get messages for a specific dog conversation
  async getConversationMessages(user1Id: string, user2Id: string, dogId: string): Promise<Message[]> {
    try {
      console.log('Loading messages for dog conversation:', dogId, 'between:', user1Id, 'and', user2Id);
      
      // Query messages specifically for this dog conversation
      const messagesQuery = query(
        collection(this.db, 'messages'),
        where('dogId', '==', dogId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages: Message[] = [];
      
      for (const doc of messagesSnapshot.docs) {
        const data = doc.data();
        // Check if this message is part of the conversation between these two users
        if ((data.senderId === user1Id && data.receiverId === user2Id) ||
            (data.senderId === user2Id && data.receiverId === user1Id)) {
          messages.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            receiverId: data.receiverId,
            receiverName: data.receiverName,
            content: data.content,
            timestamp: data.timestamp.toDate(),
            isRead: data.isRead,
            dogId: data.dogId,
            dogName: data.dogName,
            rentalId: data.rentalId
          });
        }
      }

      // Sort by timestamp
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      console.log('Found', messages.length, 'messages in dog conversation:', dogId);
      return messages;
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  // Mark messages as read for a specific dog conversation
  async markMessagesAsRead(senderId: string, receiverId: string, dogId: string): Promise<void> {
    try {
      const unreadQuery = query(
        collection(this.db, 'messages'),
        where('senderId', '==', senderId),
        where('receiverId', '==', receiverId),
        where('dogId', '==', dogId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(unreadQuery);
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { isRead: true })
      );

      await Promise.all(updatePromises);
      console.log(`Marked ${snapshot.size} messages as read for dog: ${dogId}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Subscribe to real-time messages for a specific dog
  subscribeToMessages(userId: string, dogId: string, callback: (messages: Message[]) => void) {
    // Listen to messages where user is receiver for a specific dog
    const receivedMessagesQuery = query(
      collection(this.db, 'messages'),
      where('receiverId', '==', userId),
      where('dogId', '==', dogId)
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
          dogId: data.dogId,
          dogName: data.dogName,
          rentalId: data.rentalId
        });
      });
      callback(messages);
    });
  }

  // Subscribe to conversation updates - now dog-specific
  subscribeToConversations(userId: string, callback: (conversations: ConversationSummary[]) => void) {
    const conversationsQuery = query(
      collection(this.db, 'conversations'),
      where('participants', 'array-contains', userId)
    );

    return onSnapshot(conversationsQuery, async (snapshot) => {
      try {
        console.log(`Loading conversations for user: ${userId}, found ${snapshot.size} conversations`);
        const conversations: ConversationSummary[] = [];
        
        for (const doc of snapshot.docs) {
          try {
            const data = doc.data();
            console.log('Processing conversation data:', data);
            
            // Handle legacy conversations that might not have dogId/dogName
            if (!data.dogId || !data.dogName) {
              console.log('Legacy conversation detected, skipping:', doc.id);
              continue; // Skip legacy conversations for now
            }
            
            const otherUserId = data.participants.find((id: string) => id !== userId);
            const otherUserName = data.participantNames.find((name: string, index: number) => 
              data.participants[index] === otherUserId
            );

            if (!otherUserId || !otherUserName) {
              console.log('Invalid conversation data, skipping:', doc.id);
              continue;
            }

            // Get unread count for this specific dog conversation
            const unreadQuery = query(
              collection(this.db, 'messages'),
              where('receiverId', '==', userId),
              where('senderId', '==', otherUserId),
              where('dogId', '==', data.dogId),
              where('isRead', '==', false)
            );
            const unreadSnapshot = await getDocs(unreadQuery);
            const unreadCount = unreadSnapshot.size;

            conversations.push({
              conversationId: doc.id,
              otherUserId,
              otherUserName,
              dogId: data.dogId,
              dogName: data.dogName,
              lastMessage: data.lastMessage || '',
              lastMessageTime: data.updatedAt?.toDate() || new Date(),
              unreadCount
            });
          } catch (conversationError) {
            console.error('Error processing conversation:', doc.id, conversationError);
            continue; // Skip this conversation and continue with others
          }
        }
        
        // Sort by last message time
        conversations.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
        console.log(`Successfully processed ${conversations.length} conversations`);
        callback(conversations);
      } catch (error) {
        console.error('Error in subscribeToConversations:', error);
        // Call callback with empty array to prevent infinite loading
        callback([]);
      }
    }, (error) => {
      console.error('Firestore error in subscribeToConversations:', error);
      // Call callback with empty array to prevent infinite loading
      callback([]);
    });
  }
}

// Hook to use message service
export const useMessageService = () => {
  const { db } = useFirebase();
  return new MessageService(db);
}; 