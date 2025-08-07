import React, { useState } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import type { ConversationSummary } from '../../types/Message';

interface MessagingCenterProps {
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
}

const MessagingCenter: React.FC<MessagingCenterProps> = ({ 
  currentUserId, 
  currentUserName, 
  onClose 
}) => {
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);

  const handleSelectConversation = (conversation: ConversationSummary) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        width: '90%',
        maxWidth: '800px',
        height: '80%',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>💬</span>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
              {selectedConversation ? 'Chat' : 'Messages'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '5px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex' }}>
          {selectedConversation ? (
            <ChatWindow
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              conversation={selectedConversation}
              onBack={handleBackToList}
            />
          ) : (
            <ChatList
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversation?.conversationId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingCenter; 