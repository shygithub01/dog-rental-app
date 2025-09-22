# Dog Rental App

A React + TypeScript + Vite application for renting dogs with location-based discovery.

## Features

- 🐕 **Dog Management**: Add, edit, and manage your dogs for rent
- 📸 **Multi-Image Upload**: Upload up to 5 photos per dog with carousel display
- 🌟 **Dog Personality Profiles**: Detailed temperament, compatibility, and activity level tracking
- 💬 **Messaging System**: Chat between renters and dog owners
- 🗺️ **Maps Integration**: Location-based dog discovery with GPS coordinates
- 🔔 **Real-time Notifications**: Stay updated with rental activities
- 👤 **User Profiles**: Track your rental history and statistics with enhanced dog displays
- 📱 **Responsive Design**: Works on desktop and mobile
- 🎨 **Modern UI**: Glass morphism design with smooth animations

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Maps API key (for maps feature)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Google Maps Setup

To enable the maps feature:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Maps JavaScript API
4. Create credentials (API key)
5. Add the API key to your `.env` file as `VITE_GOOGLE_MAPS_API_KEY`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Recent Updates

### v2.0 - Enhanced Dog Profiles & Multi-Image Support
- ✅ Multi-image upload system (up to 5 photos per dog)
- ✅ Interactive photo carousel with navigation
- ✅ Comprehensive personality profiling system
- ✅ Enhanced user profile with improved dog displays
- ✅ Modern glass morphism UI design
- ✅ GPS coordinate integration for accurate location mapping
- ✅ Improved form validation and user experience

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Inline styles + CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Maps**: Google Maps JavaScript API
- **State Management**: React hooks + Context API

## Key Features Detail

### 📸 Multi-Image Support
- Upload up to 5 photos per dog
- Interactive photo carousel for browsing
- Automatic image optimization and storage
- Fallback emoji display when no images available

### 🌟 Enhanced Dog Profiles
- **Temperament Tags**: Calm, Energetic, Playful, Gentle, Protective, Social, Independent, Cuddly
- **Compatibility**: Good with Kids, Other Dogs, Cats, Strangers, Seniors
- **Activity Levels**: Low (couch potato), Medium (moderate walks), High (needs lots of exercise)
- **Special Notes**: Custom notes for training, medical needs, or quirks

### 🗺️ Location Features
- GPS coordinate integration for accurate mapping
- Distance-based dog discovery
- Privacy-focused location sharing (coordinates used only for distance calculations)

### 🎨 Modern Design
- Glass morphism UI elements
- Smooth fade-in animations
- Responsive grid layouts
- Interactive button states with hover effects

## 🚀 Roadmap & Future Enhancements

### 🎯 High Priority Features
- [ ] **Advanced Search & Filtering**
  - Filter by dog size, breed, temperament, activity level
  - Price range filtering
  - Availability calendar integration
  - Advanced location radius search

- [ ] **Booking & Payment System**
  - Calendar-based availability management
  - Stripe/PayPal payment integration
  - Booking confirmation and cancellation system
  - Automatic refund processing

- [ ] **Enhanced Messaging System**
  - Real-time chat with typing indicators
  - Photo sharing in messages
  - Voice message support
  - Message read receipts

### 🔧 User Experience Improvements
- [ ] **Mobile App Development**
  - React Native mobile app
  - Push notifications
  - Offline capability
  - Camera integration for instant photo uploads

- [ ] **Advanced User Profiles**
  - Verification badges for trusted users
  - User reviews and rating system
  - Rental history with photos and reviews
  - Favorite dogs and wishlist functionality

- [ ] **Smart Matching Algorithm**
  - AI-powered dog-renter compatibility matching
  - Personality-based recommendations
  - Location and schedule optimization
  - Machine learning for improved suggestions

### 🛡️ Safety & Trust Features
- [ ] **Identity Verification**
  - Government ID verification
  - Background check integration
  - Phone number verification
  - Social media account linking

- [ ] **Insurance & Safety**
  - Pet insurance integration
  - Emergency contact system
  - GPS tracking during rentals
  - Incident reporting system

### 📊 Analytics & Business Features
- [ ] **Owner Dashboard**
  - Earnings analytics and reporting
  - Booking calendar management
  - Performance metrics (views, bookings, ratings)
  - Tax document generation

- [ ] **Admin Panel**
  - User management and moderation
  - Content moderation tools
  - Analytics dashboard
  - Support ticket system

### 🌟 Advanced Features
- [ ] **Social Features**
  - Dog owner community forums
  - Photo sharing and dog stories
  - Local dog events and meetups
  - Referral program with rewards

- [ ] **AI & Automation**
  - Automated photo tagging and categorization
  - Smart pricing recommendations
  - Chatbot for customer support
  - Predictive availability suggestions

### 🔧 Technical Improvements
- [ ] **Performance Optimization**
  - Image lazy loading and optimization
  - Progressive Web App (PWA) features
  - Caching strategies
  - Database query optimization

- [ ] **Testing & Quality**
  - Comprehensive unit test coverage
  - End-to-end testing with Cypress
  - Performance monitoring
  - Error tracking and reporting

## Project Structure

```
src/
├── components/          # React components
│   ├── Common/        # Reusable components (PhotoCarousel, MultiImageUpload)
│   ├── Dogs/          # Dog-related components (AddDogForm, EditDogForm)
│   ├── Rentals/       # Rental management
│   ├── Messaging/     # Chat system
│   ├── Maps/          # Maps integration
│   ├── Notifications/ # Notification system
│   ├── User/          # User profile components
│   └── Demo/          # Design showcase components
├── services/          # Firebase services
├── types/             # TypeScript type definitions
├── contexts/          # React contexts
└── utils/             # Utility functions
```

## 🤝 Contributing

We welcome contributions! Here are some ways you can help:

1. **Pick a feature from the roadmap** and implement it
2. **Report bugs** or suggest improvements
3. **Improve documentation** and add code comments
4. **Write tests** for existing functionality
5. **Optimize performance** and user experience

### Getting Started with Development
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request with a detailed description

### Development Guidelines
- Follow TypeScript best practices
- Maintain responsive design principles
- Write clean, documented code
- Test your changes across different devices
- Follow the existing code style and patterns
