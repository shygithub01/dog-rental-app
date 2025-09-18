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

  const handleBackToDashboard = () => {
    onClose(); // This will close the entire messaging modal and return to dashboard
  };

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* Modern Header - Same as App.tsx */}
      <header className="modern-header fade-in">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#" className="logo">
              DogRental
            </a>
          </div>
        </div>
      </header>

      {/* Full Container Message Card */}
      <div style={{ 
        padding: '20px', 
        height: 'calc(100vh - 80px)', // Full height minus header
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Main Content Card - Full Width Message Card */}
        <div style={{ 
          height: '100%', 
          width: '100%', 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px'
        }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '2rem',
              color: '#1f2937',
              fontWeight: '700',
              textAlign: 'center'
            }}>
              💬 {selectedConversation ? 'Chat with Dog Owner' : 'Your Messages'}
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: '#4b5563',
              textAlign: 'center',
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto 24px auto'
            }}>
              {selectedConversation 
                ? 'Continue your conversation below'
                : 'Stay connected with dog owners and renters. Start conversations about rentals, ask questions, and build your community.'
              }
            </p>

            {/* Back to Dashboard Button */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  backgroundColor: 'rgba(139, 92, 246, 0.9)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
                  fontWeight: '700',
                  minHeight: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.9)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.3)';
                }}
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* Messages Content */}
            <div style={{ marginTop: '32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                background: 'rgba(249, 250, 251, 0.8)',
                border: '1px solid rgba(229, 231, 235, 0.5)',
                borderRadius: '12px',
                padding: '24px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Messages Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '24px', marginRight: '10px' }}>💬</span>
                    <h4 style={{
                      margin: 0,
                      fontSize: '1.25rem',
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>
                      {selectedConversation ? 'Chat' : 'Messages'}
                    </h4>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                  }}>
                    {selectedConversation ? 'Active Chat' : 'Message Center'}
                  </div>
                </div>

                {/* Messages Content */}
                <div style={{ flex: 1, display: 'flex' }}>
                  {selectedConversation ? (
                    <ChatWindow
                      currentUserId={currentUserId}
                      currentUserName={currentUserName}
                      conversation={selectedConversation}
                      onBack={handleBackToDashboard}
                    />
                  ) : (
                    <ChatList
                      currentUserId={currentUserId}
                      currentUserName={currentUserName}
                      onSelectConversation={handleSelectConversation}
                      selectedConversationId={selectedConversation ? (selectedConversation as ConversationSummary).conversationId : undefined}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default MessagingCenter; 