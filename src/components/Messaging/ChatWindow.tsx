import React, { useState, useEffect, useRef } from 'react';
import { useMessageService } from '../../services/messageService';
import { useNotificationService } from '../../services/notificationService';
import type { Message, ConversationSummary } from '../../types/Message';

interface ChatWindowProps {
  currentUserId: string;
  currentUserName: string;
  conversation: ConversationSummary | null;
  onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  currentUserId, 
  currentUserName, 
  conversation, 
  onBack 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messageService = useMessageService();
  const notificationService = useNotificationService();

  useEffect(() => {
    if (!conversation) return;

    setLoading(true);
    setError('');

    const loadMessages = async () => {
      try {
        const conversationMessages = await messageService.getConversationMessages(
          currentUserId, 
          conversation.otherUserId,
          conversation.dogId
        );
        setMessages(conversationMessages);
        
        // Mark messages as read
        await messageService.markMessagesAsRead(conversation.otherUserId, currentUserId, conversation.dogId);
      } catch (error) {
        console.error('Error loading messages:', error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Set up real-time listener for new messages for this specific dog
    const unsubscribe = messageService.subscribeToMessages(currentUserId, conversation.dogId, (newMessages) => {
      // Filter messages for this conversation
      const conversationMessages = newMessages.filter(msg => 
        (msg.senderId === currentUserId && msg.receiverId === conversation.otherUserId) ||
        (msg.senderId === conversation.otherUserId && msg.receiverId === currentUserId)
      );
      
      if (conversationMessages.length > 0) {
        setMessages(prevMessages => {
          // Combine existing and new messages, avoiding duplicates
          const allMessages = [...prevMessages, ...conversationMessages];
          const uniqueMessages = allMessages.filter((message, index, self) => 
            index === self.findIndex(m => m.id === message.id)
          );
          return uniqueMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        });
      }
    });

    return () => unsubscribe();
  }, [conversation, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    try {
      // Create a temporary message for immediate display
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: currentUserId,
        senderName: currentUserName,
        receiverId: conversation.otherUserId,
        receiverName: conversation.otherUserName,
        content: messageContent,
        timestamp: new Date(),
        isRead: false,
        dogId: conversation.dogId,
        dogName: conversation.dogName
      };

      // Add message to local state immediately
      setMessages(prev => [...prev, tempMessage]);

      // Send message to Firebase with dog context
      await messageService.sendMessage(currentUserId, currentUserName, {
        receiverId: conversation.otherUserId,
        receiverName: conversation.otherUserName,
        content: messageContent,
        dogId: conversation.dogId,
        dogName: conversation.dogName
      });

      // Create notification for the receiver
      await notificationService.createNotification(
        conversation.otherUserId,
        'rental_request',
        {
          title: `💬 New Message about ${conversation.dogName}`,
          message: `${currentUserName} sent you a message about ${conversation.dogName}`,
          data: {
            senderId: currentUserId,
            senderName: currentUserName,
            dogId: conversation.dogId,
            dogName: conversation.dogName
          }
        }
      );

      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      // Remove the temporary message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!conversation) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>
          Select a conversation to start chatting
        </div>
        <div style={{ fontSize: '14px', color: '#999' }}>
          Choose from your conversations or start a new one
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            marginRight: '10px',
            color: '#666',
            padding: '5px 10px',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          title="Back to Dashboard"
        >
          ← Back to Dashboard
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {conversation.otherUserName}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {conversation.unreadCount > 0 ? `${conversation.unreadCount} unread` : 'Online'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '15px',
        backgroundColor: '#f5f5f5',
        maxHeight: '400px' // Add max height to ensure scrolling
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '16px', color: '#666' }}>Loading messages...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#e74c3c' }}>
            Error: {error}
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
              No messages yet
            </div>
            <div style={{ fontSize: '14px', color: '#999' }}>
              Start the conversation by sending a message
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: '10px',
                display: 'flex',
                justifyContent: message.senderId === currentUserId ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '70%',
                padding: '10px 15px',
                borderRadius: '18px',
                backgroundColor: message.senderId === currentUserId ? '#007bff' : 'white',
                color: message.senderId === currentUserId ? 'white' : '#333',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                wordWrap: 'break-word'
              }}>
                <div style={{ marginBottom: '5px' }}>
                  {message.content}
                </div>
                <div style={{
                  fontSize: '11px',
                  opacity: 0.7,
                  textAlign: message.senderId === currentUserId ? 'right' : 'left'
                }}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} style={{
        padding: '15px',
        borderTop: '1px solid #eee',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '10px 15px',
            border: '1px solid #ddd',
            borderRadius: '20px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          style={{
            marginLeft: '10px',
            padding: '10px 20px',
            backgroundColor: newMessage.trim() ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow; 