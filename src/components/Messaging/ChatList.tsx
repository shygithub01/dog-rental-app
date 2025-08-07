import React, { useState, useEffect } from 'react';
import { useMessageService } from '../../services/messageService';
import type { ConversationSummary } from '../../types/Message';

interface ChatListProps {
  currentUserId: string;
  currentUserName: string;
  onSelectConversation: (conversation: ConversationSummary) => void;
  selectedConversationId?: string;
}

const ChatList: React.FC<ChatListProps> = ({ 
  currentUserId, 
  currentUserName, 
  onSelectConversation, 
  selectedConversationId 
}) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const messageService = useMessageService();

  useEffect(() => {
    const unsubscribe = messageService.subscribeToConversations(currentUserId, (conversations) => {
      setConversations(conversations);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Loading conversations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#e74c3c' }}>
        Error: {error}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
          No conversations yet
        </div>
        <div style={{ fontSize: '14px', color: '#999' }}>
          Start a conversation by messaging a dog owner or renter
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {conversations.map((conversation) => (
        <div
          key={conversation.conversationId}
          onClick={() => onSelectConversation(conversation)}
          style={{
            padding: '15px',
            borderBottom: '1px solid #eee',
            cursor: 'pointer',
            backgroundColor: selectedConversationId === conversation.conversationId ? '#f0f8ff' : 'white',
            transition: 'background-color 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '5px',
                fontWeight: conversation.unreadCount > 0 ? 'bold' : 'normal'
              }}>
                <span style={{ fontSize: '16px', marginRight: '8px' }}>👤</span>
                <span style={{ fontSize: '16px' }}>
                  {conversation.otherUserName}
                </span>
                {conversation.unreadCount > 0 && (
                  <span style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    marginLeft: '8px'
                  }}>
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#666',
                marginBottom: '5px',
                fontWeight: conversation.unreadCount > 0 ? 'bold' : 'normal'
              }}>
                {truncateMessage(conversation.lastMessage)}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginLeft: '10px' }}>
              {formatTime(conversation.lastMessageTime)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList; 