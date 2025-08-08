import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import type { Notification, NotificationType, NotificationTemplate, NotificationPreferences } from '../types/Notification';

// Notification templates
const notificationTemplates: Record<NotificationType, NotificationTemplate> = {
  rental_request: {
    type: 'rental_request',
    title: '🐕 New Rental Request',
    message: 'Someone wants to rent your dog! Check your requests.',
    data: {}
  },
  rental_approved: {
    type: 'rental_approved',
    title: '✅ Rental Approved',
    message: 'Your rental request has been approved!',
    data: {}
  },
  rental_rejected: {
    type: 'rental_rejected',
    title: '❌ Rental Rejected',
    message: 'Your rental request was not approved.',
    data: {}
  },
  rental_reminder: {
    type: 'rental_reminder',
    title: '⏰ Rental Reminder',
    message: 'Your dog rental starts tomorrow!',
    data: {}
  },
  rental_started: {
    type: 'rental_started',
    title: '🎉 Rental Started',
    message: 'Your dog rental has begun!',
    data: {}
  },
  rental_completed: {
    type: 'rental_completed',
    title: '🏁 Rental Completed',
    message: 'Your dog rental has been completed.',
    data: {}
  },
  rental_cancelled: {
    type: 'rental_cancelled',
    title: '🚫 Rental Cancelled',
    message: 'A rental has been cancelled.',
    data: {}
  },
  welcome: {
    type: 'welcome',
    title: '🐕 Welcome to DogRental!',
    message: 'Thank you for joining our community of dog lovers.',
    data: {}
  },
  system: {
    type: 'system',
    title: '📢 System Update',
    message: 'Important update about your account.',
    data: {}
  }
};

export class NotificationService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Create a new notification
  async createNotification(
    userId: string,
    type: NotificationType,
    customData?: any
  ): Promise<void> {
    try {
      const template = notificationTemplates[type];
      const notification = {
        userId,
        type,
        title: customData?.title || template.title,
        message: customData?.message || template.message,
        data: customData?.data || template.data,
        read: false,
        createdAt: Timestamp.now(),
        expiresAt: customData?.expiresAt ? Timestamp.fromDate(customData.expiresAt) : null
      };

      await addDoc(collection(this.db, 'notifications'), notification);
      console.log(`Notification created for user ${userId}: ${type}`);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(this.db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const notifications: Notification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          read: data.read,
          createdAt: data.createdAt.toDate(),
          expiresAt: data.expiresAt?.toDate()
        });
      });

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(this.db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );
      await Promise.all(updatePromises);
      
      console.log(`Marked ${querySnapshot.size} notifications as read for user ${userId}`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete a single notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, 'notifications', notificationId));
      console.log(`Deleted notification ${notificationId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(this.db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Delete expired notifications
  async deleteExpiredNotifications(): Promise<void> {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(this.db, 'notifications'),
        where('expiresAt', '<', now)
      );
      
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`Deleted ${querySnapshot.size} expired notifications`);
    } catch (error) {
      console.error('Error deleting expired notifications:', error);
    }
  }

  // Remove duplicate welcome notifications for a user
  async removeDuplicateWelcomeNotifications(userId: string): Promise<void> {
    try {
      const q = query(
        collection(this.db, 'notifications'),
        where('userId', '==', userId),
        where('type', '==', 'welcome')
      );
      
      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (notifications.length > 1) {
        // Keep the first one, delete the rest
        const notificationsToDelete = notifications.slice(1);
        const deletePromises = notificationsToDelete.map(notification => 
          deleteDoc(doc(this.db, 'notifications', notification.id))
        );
        await Promise.all(deletePromises);
        
        console.log(`Removed ${notificationsToDelete.length} duplicate welcome notifications for user ${userId}`);
      }
    } catch (error) {
      console.error('Error removing duplicate welcome notifications:', error);
    }
  }

  // Get notification preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const q = query(
        collection(this.db, 'notificationPreferences'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const data = querySnapshot.docs[0].data();
      return {
        userId: data.userId,
        emailNotifications: data.emailNotifications,
        pushNotifications: data.pushNotifications,
        rentalRequests: data.rentalRequests,
        rentalUpdates: data.rentalUpdates,
        reminders: data.reminders,
        systemUpdates: data.systemUpdates,
        updatedAt: data.updatedAt.toDate()
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const q = query(
        collection(this.db, 'notificationPreferences'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new preferences
        await addDoc(collection(this.db, 'notificationPreferences'), {
          userId,
          emailNotifications: true,
          pushNotifications: true,
          rentalRequests: true,
          rentalUpdates: true,
          reminders: true,
          systemUpdates: true,
          updatedAt: Timestamp.now(),
          ...preferences
        });
      } else {
        // Update existing preferences
        await updateDoc(querySnapshot.docs[0].ref, {
          ...preferences,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }
}

// Hook to use notification service
export const useNotificationService = () => {
  const { db } = useFirebase();
  return {
    createNotification: (userId: string, type: NotificationType, customData?: any) => new NotificationService(db).createNotification(userId, type, customData),
    getUserNotifications: (userId: string) => new NotificationService(db).getUserNotifications(userId),
    markAsRead: (notificationId: string) => new NotificationService(db).markAsRead(notificationId),
    markAllAsRead: (userId: string) => new NotificationService(db).markAllAsRead(userId),
    deleteNotification: (notificationId: string) => new NotificationService(db).deleteNotification(notificationId),
    getUnreadCount: (userId: string) => new NotificationService(db).getUnreadCount(userId),
    deleteExpiredNotifications: () => new NotificationService(db).deleteExpiredNotifications(),
    removeDuplicateWelcomeNotifications: (userId: string) => new NotificationService(db).removeDuplicateWelcomeNotifications(userId),
    getNotificationPreferences: (userId: string) => new NotificationService(db).getNotificationPreferences(userId),
    updateNotificationPreferences: (userId: string, preferences: Partial<NotificationPreferences>) => new NotificationService(db).updateNotificationPreferences(userId, preferences)
  };
}; 