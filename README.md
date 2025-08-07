# Dog Rental App

A React + TypeScript + Vite application for renting dogs with location-based discovery.

## Features

- 🐕 **Dog Management**: Add, edit, and manage your dogs for rent
- 💬 **Messaging System**: Chat between renters and dog owners
- 🗺️ **Maps Integration**: Location-based dog discovery
- 🔔 **Real-time Notifications**: Stay updated with rental activities
- 👤 **User Profiles**: Track your rental history and statistics
- 📱 **Responsive Design**: Works on desktop and mobile

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

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Inline styles + CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Maps**: Google Maps JavaScript API
- **State Management**: React hooks + Context API

## Project Structure

```
src/
├── components/          # React components
│   ├── Dogs/          # Dog-related components
│   ├── Rentals/       # Rental management
│   ├── Messaging/     # Chat system
│   ├── Maps/          # Maps integration
│   ├── Notifications/ # Notification system
│   └── User/          # User profile components
├── services/          # Firebase services
├── types/             # TypeScript type definitions
├── contexts/          # React contexts
└── utils/             # Utility functions
```
