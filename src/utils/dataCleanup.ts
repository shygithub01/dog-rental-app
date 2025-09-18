import { collection, getDocs, deleteDoc, doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const cleanupOrphanedData = async (db: any) => {
  console.log('🧹 Starting orphaned data cleanup...');
  
  try {
    const batch = writeBatch(db);
    
    // Clear all collections
    const collections = ['users', 'dogs', 'rentals', 'messages', 'notifications', 'reviews'];
    
    for (const collectionName of collections) {
      console.log(`🗑️ Clearing collection: ${collectionName}`);
      const querySnapshot = await getDocs(collection(db, collectionName));
      
      querySnapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
      
      console.log(`✅ Deleted ${querySnapshot.size} documents from ${collectionName}`);
    }
    
    await batch.commit();
    console.log('🎉 All data cleared successfully!');
    
    // Reload the page to reset all state
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error during data cleanup:', error);
    throw error;
  }
};

// Comprehensive cleanup function for fresh start
export const clearAllData = async (db: any) => {
  console.log('🧹 Starting COMPLETE data cleanup...');
  
  try {
    const batch = writeBatch(db);
    
    // Clear all collections
    const collections = ['users', 'dogs', 'rentals', 'messages', 'notifications', 'reviews'];
    
    for (const collectionName of collections) {
      console.log(`🗑️ Clearing collection: ${collectionName}`);
      const querySnapshot = await getDocs(collection(db, collectionName));
      
      querySnapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
      
      console.log(`✅ Deleted ${querySnapshot.size} documents from ${collectionName}`);
    }
    
    await batch.commit();
    console.log('🎉 ALL DATA CLEARED! Fresh start ready!');
    
    // Reload the page to reset all state
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error during complete data cleanup:', error);
    throw error;
  }
};

export const validateDogData = async (dogId: string) => {
  try {
    const dogDoc = await getDoc(doc(db, 'dogs', dogId));
    return dogDoc.exists();
  } catch (error) {
    console.error(`Error validating dog ${dogId}:`, error);
    return false;
  }
}; 