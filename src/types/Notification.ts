export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export type NotificationType = 
  | 'rental_request'
  | 'rental_approved'
  | 'rental_rejected'
  | 'rental_reminder'
  | 'rental_started'
  | 'rental_completed'
  | 'rental_cancelled'
  | 'welcome'
  | 'system';

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  rentalRequests: boolean;
  rentalUpdates: boolean;
  reminders: boolean;
  systemUpdates: boolean;
  updatedAt: Date;
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
} 