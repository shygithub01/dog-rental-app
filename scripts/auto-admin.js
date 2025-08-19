#!/usr/bin/env node

// Automated script to make the first/latest user an admin
// Usage: node scripts/auto-admin.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, orderBy, query, limit } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDgqGHBYVVP0YZRZyYxqGQJHzOPEqLWKNQ",
  authDomain: "dog-rental-app.firebaseapp.com",
  projectId: "dog-rental-app",
  storageBucket: "dog-rental-app.appspot.com",
  messagingSenderId: "1011731918336",
  appId: "1:1011731918336:web:8f0b5b1c2d3e4f5a6b7c8d"
};

async function makeLatestUserAdmin() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('👑 Finding latest user to make admin...');
    
    // Get the most recent user
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('joinDate', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No users found! Please sign in to the app first.');
      console.log('💡 Steps:');
      console.log('   1. Go to your app');
      console.log('   2. Sign in with Google');
      console.log('   3. Run this script again');
      return;
    }
    
    // Get the latest user
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log(`📧 Found user: ${userData.displayName || userData.email}`);
    console.log(`🆔 User ID: ${userId}`);
    console.log(`📅 Joined: ${userData.joinDate?.toDate?.() || 'Unknown'}`);
    
    // Check if already admin
    if (userData.role === 'admin' && userData.isAdmin === true) {
      console.log('✅ User is already an admin!');
      console.log('🎉 Admin privileges confirmed:');
      console.log('   - role: "admin"');
      console.log('   - isAdmin: true');
      return;
    }
    
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
    console.log('🎯 You should now see:');
    console.log('   - Admin Action Cards');
    console.log('   - "⚙️ Admin Panel" in dropdown');
    console.log('   - Access to /admin route');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Run the admin creation
makeLatestUserAdmin();
