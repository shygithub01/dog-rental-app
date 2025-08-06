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
    console.log('🔥 Firebase Provider initialized');
    console.log('Auth:', auth);
    console.log('Firestore:', db);
    console.log('Storage:', storage);
  }, []);

  return (
    <FirebaseContext.Provider value={firebaseValue}>
      {children}
    </FirebaseContext.Provider>
  );
}; 