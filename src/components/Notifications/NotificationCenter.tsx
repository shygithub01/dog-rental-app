import React, { useState, useEffect } from 'react';
import { useNotificationService } from '../../services/notificationService';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { Notification } from '../../types/Notification';

interface NotificationCenterProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationService = useNotificationService();
  const { db } = useFirebase();

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      
      // Set up real-time listener for all user notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const notificationsData: Notification[] = [];
        let unread = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const notification = {
            id: doc.id,
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            data: data.data,
            read: data.read,
            createdAt: data.createdAt.toDate(),
            expiresAt: data.expiresAt?.toDate()
          };
          notificationsData.push(notification);
          if (!data.read) unread++;
        });
        
        setNotifications(notificationsData);
        setUnreadCount(unread);
        setLoading(false);
        console.log(`Real-time update: ${notificationsData.length} notifications, ${unread} unread`);
      }, (error) => {
        console.error('Error listening to notifications:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [isOpen, userId, db]);



  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(userId);
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent marking as read when clicking delete
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'rental_request': return '🐕';
      case 'rental_approved': return '✅';
      case 'rental_rejected': return '❌';
      case 'rental_reminder': return '⏰';
      case 'rental_started': return '🎉';
      case 'rental_completed': return '🏁';
      case 'rental_cancelled': return '🚫';
      case 'welcome': return '🐕';
      case 'system': return '📢';
      default: return '📧';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

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
        background: 'white',
        borderRadius: '20px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '2px solid #f7fafc'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{ fontSize: '2rem' }}>📧</div>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                color: '#2d3748',
                margin: 0,
                fontWeight: 'bold'
              }}>
                Notifications
              </h2>
              {unreadCount > 0 && (
                <div style={{
                  fontSize: '0.9rem',
                  color: '#4a5568'
                }}>
                  {unreadCount} unread
                </div>
              )}
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '10px'
          }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4299e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                Mark All Read
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '10px'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#4a5568'
            }}>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#4a5568'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
              <h3 style={{
                fontSize: '1.2rem',
                color: '#2d3748',
                margin: '0 0 10px 0'
              }}>
                No notifications yet
              </h3>
              <p style={{
                color: '#718096',
                margin: 0
              }}>
                You'll see notifications here when you have rental activity.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: '15px',
                    borderRadius: '10px',
                    border: notification.read ? '1px solid #e2e8f0' : '2px solid #4299e1',
                    backgroundColor: notification.read ? '#f7fafc' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleMarkAsRead(notification.id)}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = notification.read ? '#edf2f7' : '#f0f9ff'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = notification.read ? '#f7fafc' : 'white'}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      marginTop: '2px'
                    }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div style={{
                      flex: 1
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '5px'
                      }}>
                        <h4 style={{
                          fontSize: '1rem',
                          color: '#2d3748',
                          margin: 0,
                          fontWeight: 'bold'
                        }}>
                          {notification.title}
                        </h4>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {!notification.read && (
                            <div style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: '#4299e1',
                              borderRadius: '50%'
                            }} />
                          )}
                          <span style={{
                            fontSize: '0.8rem',
                            color: '#718096'
                          }}>
                            {formatDate(notification.createdAt)}
                          </span>
                          <button
                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#f56565',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e53e3e'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f56565'}
                            title="Delete notification"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p style={{
                        color: '#4a5568',
                        margin: 0,
                        fontSize: '0.9rem',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter; 