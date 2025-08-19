// Utility script to create admin accounts
// Run this in your browser console or as a one-time script

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const createAdminAccount = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await setDoc(userRef, {
      ...userData,
      role: 'admin',
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    
    console.log('✅ Admin account created successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    return false;
  }
};

// Example usage:
// createAdminAccount('user_uid_here', {
//   email: 'admin@example.com',
//   displayName: 'Admin User'
// });
