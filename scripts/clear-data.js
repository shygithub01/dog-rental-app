#!/usr/bin/env node

// Simple script to clear all Firebase data
// Usage: node scripts/clear-data.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

// Your Firebase config (copy from src/firebase/config.ts)
const firebaseConfig = {
  apiKey: "AIzaSyCX7lbqN6uYrisjdrD0fehWd0Bbbo5AfDU",
  authDomain: "dog-rental-app.firebaseapp.com",
  projectId: "dog-rental-app",
  storageBucket: "dog-rental-app.firebasestorage.app",
  messagingSenderId: "1011731918336",
  appId: "1:1011731918336:web:e0713a7dbbadc8964772e5"
};

async function clearAllData() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('🧹 Starting data cleanup...');
    
    const collections = ['users', 'dogs', 'rentals', 'messages', 'notifications', 'reviews'];
    
    for (const collectionName of collections) {
      console.log(`🗑️ Clearing ${collectionName} collection...`);
      
      const querySnapshot = await getDocs(collection(db, collectionName));
      console.log(`   Found ${querySnapshot.size} documents`);
      
      if (querySnapshot.size > 0) {
        const batch = writeBatch(db);
        
        querySnapshot.docs.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
        });
        
        await batch.commit();
        console.log(`   ✅ Deleted ${querySnapshot.size} documents`);
      }
    }
    
    console.log('🎉 All data cleared successfully!');
    console.log('🔄 Please refresh your app to see the changes.');
    
  } catch (error) {
    console.error('❌ Error during data cleanup:', error);
  }
}

// Run the cleanup
clearAllData();
