import React, { createContext, useContext, useEffect } from 'react';
import type { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';

interface FirebaseContextType {
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const firebaseValue = {
    auth,
    db,
    storage
  };

  useEffect(() => {
    console.log('Auth:', auth);
    console.log('Firestore:', db);
    console.log('Storage:', storage);
    
    // Suppress Firebase IDP Vault errors (browser extension conflicts)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('[IDP][Vault]') || 
          message.includes('Invalid JSON format') ||
          message.includes('Received invalid message')) {
        // Suppress these specific Firebase IDP errors
        return;
      }
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <FirebaseContext.Provider value={firebaseValue}>
      {children}
    </FirebaseContext.Provider>
  );
}; 