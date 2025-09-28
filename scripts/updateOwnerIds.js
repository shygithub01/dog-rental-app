// One-time script to update all dogs from 'shyam-user-001' to real Firebase user ID
// Run this in Firebase Console or as a Cloud Function

const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function updateDogOwnerIds() {
  const oldOwnerId = 'shyam-user-001';
  const newOwnerId = 'Y8qPWIVDbcaUGFKbU0wN2D46fRH3'; // Shyamalendu's real Firebase user ID
  
  console.log(`🔧 Updating dogs from owner ID: ${oldOwnerId}`);
  console.log(`🎯 To new owner ID: ${newOwnerId}`);
  
  try {
    // Get all dogs with the old owner ID
    const dogsSnapshot = await db.collection('dogs')
      .where('ownerId', '==', oldOwnerId)
      .get();
    
    console.log(`📋 Found ${dogsSnapshot.size} dogs to update`);
    
    if (dogsSnapshot.empty) {
      console.log('✅ No dogs found with old owner ID - they may already be updated!');
      return;
    }
    
    // Create batch update
    const batch = db.batch();
    let updateCount = 0;
    
    dogsSnapshot.forEach((doc) => {
      const dogRef = db.collection('dogs').doc(doc.id);
      batch.update(dogRef, { ownerId: newOwnerId });
      updateCount++;
      console.log(`📝 Queued update for: ${doc.data().name}`);
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log(`🎉 SUCCESS! Updated ${updateCount} dogs with new owner ID`);
    console.log('✅ Shyamalendu should now see all rental requests!');
    
  } catch (error) {
    console.error('❌ Error updating dog owner IDs:', error);
  }
}

// Export for Cloud Functions or run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { updateDogOwnerIds };
} else {
  // Run directly if in browser/node environment
  updateDogOwnerIds();
}