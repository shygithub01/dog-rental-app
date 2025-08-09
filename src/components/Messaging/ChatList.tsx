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
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    console.log('ChatList: Starting to load conversations for user:', currentUserId);
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('ChatList: Loading timeout reached, showing no conversations');
        setLoading(false);
        setError('Loading timeout - please refresh the page');
      }
    }, 10000); // 10 second timeout

    const unsubscribe = messageService.subscribeToConversations(currentUserId, (conversations) => {
      console.log('ChatList: Received conversations:', conversations);
      clearTimeout(timeoutId);
      setConversations(conversations);
      setLoading(false);
      setError('');
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
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
        <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
          This may take a moment for new users
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#e74c3c' }}>
        <div style={{ fontSize: '16px', marginBottom: '10px' }}>Error: {error}</div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
          No conversations yet
        </div>
        <div style={{ fontSize: '14px', color: '#999', marginBottom: '20px' }}>
          Start a conversation by messaging a dog owner or renter
        </div>
        <div style={{ fontSize: '12px', color: '#ccc' }}>
          💡 Tip: Browse dogs and click "Message Owner" to start chatting
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
            transition: 'background-color 0.2s',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}
          onMouseOver={(e) => {
            if (selectedConversationId !== conversation.conversationId) {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
            }
          }}
          onMouseOut={(e) => {
            if (selectedConversationId !== conversation.conversationId) {
              e.currentTarget.style.backgroundColor = 'white';
            }
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: '#333',
                marginBottom: '2px'
              }}>
                {conversation.otherUserName}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#666',
                marginBottom: '5px',
                fontStyle: 'italic'
              }}>
                🐕 {conversation.dogName}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#888',
                lineHeight: '1.3'
              }}>
                {truncateMessage(conversation.lastMessage)}
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-end',
              gap: '5px'
            }}>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {formatTime(conversation.lastMessageTime)}
              </div>
              {conversation.unreadCount > 0 && (
                <div style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {conversation.unreadCount}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList; 