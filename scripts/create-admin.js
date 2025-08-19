#!/usr/bin/env node

// Automated script to create admin user
// Usage: node scripts/create-admin.js <user-email>

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc, query, where } from 'firebase/firestore';

// Your Firebase config - copy from src/firebase/config.ts
const firebaseConfig = {
  apiKey: "AIzaSyDgqGHBYVVP0YZRZyYxqGQJHzOPEqLWKNQ",
  authDomain: "dog-rental-app.firebaseapp.com",
  projectId: "dog-rental-app",
  storageBucket: "dog-rental-app.appspot.com",
  messagingSenderId: "1011731918336",
  appId: "1:1011731918336:web:8f0b5b1c2d3e4f5a6b7c8d"
};

async function createAdminUser(userEmail) {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log(`👑 Creating admin user for: ${userEmail}`);
    
    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ User not found! Please sign in to the app first to create a user profile.');
      console.log('💡 Steps:');
      console.log('   1. Sign in to your app');
      console.log('   2. Run this script again');
      return;
    }
    
    // Get the first matching user
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log(`📧 Found user: ${userData.displayName || userData.email}`);
    console.log(`🆔 User ID: ${userId}`);
    
    // Update user to admin
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'admin',
      isAdmin: true,
      updatedAt: new Date()
    });
    
    console.log('✅ User successfully upgraded to admin!');
    console.log('🎉 Admin privileges granted:');
    console.log('   - role: "admin"');
    console.log('   - isAdmin: true');
    console.log('');
    console.log('🔄 Please refresh your app to see admin features!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Get email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.log('❌ Please provide user email as argument');
  console.log('📖 Usage: node scripts/create-admin.js <user-email>');
  console.log('📧 Example: node scripts/create-admin.js mohapatra.shyam@gmail.com');
  process.exit(1);
}

// Run the admin creation
createAdminUser(userEmail);
