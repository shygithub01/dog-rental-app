import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const cleanupOrphanedData = async () => {
  console.log('Starting data cleanup...');
  
  try {
    // Get all rental requests
    const requestsQuery = query(collection(db, 'rentalRequests'));
    const requestsSnapshot = await getDocs(requestsQuery);
    
    let cleanedCount = 0;
    
    for (const requestDoc of requestsSnapshot.docs) {
      const requestData = requestDoc.data();
      
      // Check if the referenced dog still exists
      try {
        const dogDoc = await getDoc(doc(db, 'dogs', requestData.dogId));
        if (!dogDoc.exists()) {
          console.log(`Removing orphaned request for deleted dog: ${requestData.dogId}`);
          await deleteDoc(requestDoc.ref);
          cleanedCount++;
        }
      } catch (error) {
        console.error(`Error checking dog ${requestData.dogId}:`, error);
        // If we can't check, assume it's invalid and remove it
        await deleteDoc(requestDoc.ref);
        cleanedCount++;
      }
    }
    
    console.log(`Data cleanup complete. Removed ${cleanedCount} orphaned requests.`);
    return cleanedCount;
  } catch (error) {
    console.error('Error during data cleanup:', error);
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