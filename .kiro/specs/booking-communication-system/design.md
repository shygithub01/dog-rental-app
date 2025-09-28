# Booking & Communication System Design

## Overview

The Booking & Communication System enhances the Dog Rental App with professional-grade availability management, booking workflows, and real-time communication features. The system is built on Firebase's real-time capabilities and integrates seamlessly with the existing rental request flow, leveraging current components like RentalRequestForm, RentalApprovalPanel, MultiImageUpload, PhotoCarousel, and the existing notification system.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Calendar UI   │    │   Chat UI       │    │  Booking UI     │
│                 │    │                 │    │                 │
│ - Date Picker   │    │ - Message List  │    │ - Confirmation  │
│ - Availability  │    │ - Typing Ind.   │    │ - Cancellation  │
│ - Bulk Actions  │    │ - Read Receipts │    │ - Status Track  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Service Layer  │
                    │                 │
                    │ - BookingService│
                    │ - ChatService   │
                    │ - CalendarSvc   │
                    │ - NotificationSvc│
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Firebase      │
                    │                 │
                    │ - Firestore     │
                    │ - Real-time DB  │
                    │ - Cloud Funcs   │
                    └─────────────────┘
```

### Data Flow

1. **Calendar Management**: Owner sets availability → Updates Firestore → Real-time sync to all viewers
2. **Booking Flow**: Renter selects dates → Creates booking request → Owner approves → Calendar blocks dates
3. **Real-time Chat**: Message sent → Firebase Real-time DB → Instant delivery to recipients
4. **Read Receipts**: Message viewed → Status update → Real-time sync to sender

## Components and Interfaces

### 1. Calendar Management System

#### CalendarView Component
```typescript
interface CalendarViewProps {
  dogId: string;
  ownerId: string;
  mode: 'owner' | 'renter';
  selectedDates?: Date[];
  onDateSelect?: (dates: Date[]) => void;
  onAvailabilityChange?: (dates: Date[], status: AvailabilityStatus) => void;
  // Integration with existing components
  isMobile?: boolean; // Use existing useIsMobile hook
  dog?: Dog; // Include dog data with personality traits and images
}

interface AvailabilityStatus {
  available: boolean;
  blocked: boolean;
  booked: boolean;
  reason?: string;
  // Integration with existing rental system
  rentalRequestId?: string;
  bookingId?: string;
}

// Integration with existing Dog interface
interface Dog {
  id: string;
  name: string;
  breed: string;
  imageUrls?: string[]; // Support existing multi-image system
  temperament?: string[];
  goodWith?: string[];
  activityLevel?: string;
  // ... other existing fields
}
```

#### CalendarService
```typescript
class CalendarService {
  async setAvailability(dogId: string, dates: Date[], status: AvailabilityStatus): Promise<void>
  async getAvailability(dogId: string, startDate: Date, endDate: Date): Promise<AvailabilityMap>
  async bulkUpdateAvailability(dogId: string, pattern: RecurringPattern): Promise<void>
  subscribeToAvailabilityChanges(dogId: string, callback: (availability: AvailabilityMap) => void): Unsubscribe
}
```

### 2. Booking Management System

#### BookingConfirmation Component
```typescript
interface BookingConfirmationProps {
  booking: BookingRequest;
  onConfirm: (bookingId: string) => void;
  onCancel: (bookingId: string, reason: string) => void;
  onModify: (bookingId: string, changes: BookingChanges) => void;
  // Integration with existing components
  isMobile?: boolean;
  showDogImages?: boolean; // Use PhotoCarousel for dog images
}

interface BookingRequest {
  id: string;
  dogId: string;
  dogName: string;
  dogBreed: string;
  dogImageUrl?: string; // Backward compatibility
  dogImageUrls?: string[]; // Support existing multi-image system
  renterId: string;
  renterName: string;
  ownerId: string;
  ownerName: string;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  totalCost: number;
  daysDiff: number;
  specialRequests?: string;
  contactPhone?: string;
  cancellationPolicy: CancellationPolicy;
  createdAt: Date;
  expiresAt: Date;
  // Integration with existing rental system
  temperament?: string[];
  goodWith?: string[];
  activityLevel?: string;
}
```

#### BookingService
```typescript
class BookingService {
  async createBooking(request: CreateBookingRequest): Promise<BookingRequest>
  async confirmBooking(bookingId: string): Promise<void>
  async cancelBooking(bookingId: string, reason: string): Promise<CancellationResult>
  async getBookingHistory(userId: string): Promise<BookingRequest[]>
  subscribeToBookingUpdates(userId: string, callback: (bookings: BookingRequest[]) => void): Unsubscribe
}
```

### 3. Real-Time Chat System

#### ChatWindow Component
```typescript
interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  participants: ChatParticipant[];
  bookingContext?: BookingRequest;
  onSendMessage: (content: string, type: MessageType) => void;
  // Integration with existing components
  isMobile?: boolean; // Use existing useIsMobile hook
  onImageUpload?: (images: string[]) => void; // Use existing MultiImageUpload
  onClose?: () => void; // Consistent with existing modal patterns
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  readBy: ReadReceipt[];
  editedAt?: Date;
  // Integration with existing image system
  imageUrls?: string[]; // Support multiple images like existing system
  metadata?: {
    bookingUpdate?: BookingUpdateMetadata;
    systemMessage?: boolean;
  };
}

interface ChatParticipant {
  id: string;
  name: string;
  photoURL?: string;
  role?: 'owner' | 'renter' | 'admin';
  isOnline?: boolean;
  lastSeen?: Date;
}
```

#### ChatService
```typescript
class ChatService {
  async sendMessage(conversationId: string, message: CreateMessageRequest): Promise<ChatMessage>
  async markAsRead(messageId: string, userId: string): Promise<void>
  async getConversationHistory(conversationId: string, limit?: number): Promise<ChatMessage[]>
  subscribeToMessages(conversationId: string, callback: (messages: ChatMessage[]) => void): Unsubscribe
  subscribeToTypingIndicators(conversationId: string, callback: (typing: TypingIndicator[]) => void): Unsubscribe
}
```

### 4. Typing Indicators System

#### TypingIndicator Component
```typescript
interface TypingIndicatorProps {
  conversationId: string;
  currentUserId: string;
  participants: ChatParticipant[];
}

interface TypingIndicator {
  userId: string;
  userName: string;
  timestamp: Date;
  isTyping: boolean;
}
```

#### TypingService
```typescript
class TypingService {
  startTyping(conversationId: string, userId: string): void
  stopTyping(conversationId: string, userId: string): void
  subscribeToTypingUpdates(conversationId: string, callback: (indicators: TypingIndicator[]) => void): Unsubscribe
}
```

## Data Models

### Calendar Availability Schema
```typescript
// Collection: dogAvailability
interface DogAvailability {
  dogId: string;
  ownerId: string;
  availability: {
    [dateString: string]: {
      available: boolean;
      blocked: boolean;
      booked: boolean;
      bookingId?: string;
      reason?: string;
      updatedAt: Date;
    }
  };
  recurringPatterns: RecurringPattern[];
  updatedAt: Date;
}
```

### Booking Schema
```typescript
// Collection: bookings
interface Booking {
  id: string;
  dogId: string;
  dogName: string;
  dogImageUrl: string;
  renterId: string;
  renterName: string;
  ownerId: string;
  ownerName: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  totalCost: number;
  cancellationPolicy: CancellationPolicy;
  conversationId: string;
  createdAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  expiresAt: Date;
}
```

### Chat Conversation Schema
```typescript
// Collection: conversations
interface Conversation {
  id: string;
  participants: string[];
  participantDetails: {
    [userId: string]: {
      name: string;
      photoURL?: string;
      lastReadAt: Date;
    }
  };
  bookingId?: string;
  dogId?: string;
  dogName?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Message Schema
```typescript
// Collection: messages
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'system' | 'booking_update' | 'image';
  timestamp: Date;
  readBy: {
    [userId: string]: {
      readAt: Date;
    }
  };
  editedAt?: Date;
  metadata?: {
    bookingUpdate?: BookingUpdateMetadata;
    imageUrl?: string;
  };
}
```

## Error Handling

### Calendar Errors
- **Double Booking Prevention**: Check availability before confirming bookings
- **Concurrent Updates**: Use Firestore transactions for availability changes
- **Invalid Date Ranges**: Validate date selections on client and server
- **Permission Errors**: Ensure only dog owners can modify their calendar

### Booking Errors
- **Expired Requests**: Auto-cancel bookings past expiration time
- **Payment Failures**: Handle payment processing errors gracefully
- **Cancellation Conflicts**: Prevent cancellation of active rentals
- **Data Consistency**: Use transactions for booking state changes

### Chat Errors
- **Message Delivery**: Queue messages for offline users
- **Connection Issues**: Implement reconnection logic with exponential backoff
- **Rate Limiting**: Prevent spam with message rate limits
- **Content Validation**: Sanitize and validate message content

### Read Receipt Errors
- **Batch Updates**: Handle bulk read receipt updates efficiently
- **Privacy Settings**: Respect user preferences for read receipt sharing
- **Sync Issues**: Resolve conflicts in read status across devices

## Testing Strategy

### Unit Tests
- **Calendar Logic**: Test date calculations, availability checks, recurring patterns
- **Booking Workflows**: Test state transitions, validation, cancellation policies
- **Message Handling**: Test message creation, delivery, read receipt updates
- **Service Integration**: Mock Firebase services for isolated testing

### Integration Tests
- **Real-time Updates**: Test Firebase real-time synchronization
- **Cross-Component Communication**: Test calendar-booking-chat integration
- **Notification Delivery**: Test notification triggers and delivery
- **Data Consistency**: Test transaction handling across services

### End-to-End Tests
- **Complete Booking Flow**: Test from calendar selection to booking confirmation
- **Chat Conversations**: Test real-time messaging with multiple users
- **Mobile Responsiveness**: Test all features on mobile devices
- **Offline Scenarios**: Test behavior with poor network connectivity

### Performance Tests
- **Real-time Scalability**: Test with multiple concurrent users
- **Message History Loading**: Test pagination and lazy loading
- **Calendar Rendering**: Test performance with large date ranges
- **Notification Volume**: Test system under high notification load

## Security Considerations

### Authentication & Authorization
- **Calendar Access**: Only dog owners can modify availability
- **Booking Permissions**: Validate user permissions for booking actions
- **Message Privacy**: Ensure users can only access their conversations
- **Admin Access**: Provide controlled access for dispute resolution

### Data Protection
- **Message Encryption**: Encrypt sensitive message content
- **Personal Information**: Protect user contact details and payment info
- **Audit Logging**: Log all booking and calendar changes for accountability
- **Data Retention**: Implement policies for message and booking data cleanup

### Input Validation
- **Date Validation**: Prevent invalid or malicious date inputs
- **Message Content**: Sanitize and validate all message content
- **File Uploads**: Secure handling of image uploads in chat
- **Rate Limiting**: Prevent abuse of real-time features

## Performance Optimization

### Real-time Efficiency
- **Connection Pooling**: Optimize Firebase real-time connections
- **Selective Subscriptions**: Subscribe only to relevant data updates
- **Message Batching**: Batch multiple updates for efficiency
- **Typing Debouncing**: Optimize typing indicator updates

### Data Loading
- **Lazy Loading**: Load message history on demand
- **Calendar Caching**: Cache availability data with smart invalidation
- **Booking Pagination**: Paginate booking history for large datasets
- **Image Optimization**: Optimize chat image loading and caching

### Mobile Performance
- **Offline Support**: Cache critical data for offline access
- **Background Sync**: Sync data when app returns to foreground
- **Battery Optimization**: Minimize background processing
- **Network Efficiency**: Optimize data usage on mobile networks