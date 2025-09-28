// Quick fix script to update dog owner IDs
// Run this in browser console while signed in as Shyamalendu

async function fixDogOwnerIds() {
  console.log('🔧 Starting to fix dog owner IDs...');
  
  try {
    // Get current user (Shyamalendu)
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      console.error('❌ No user signed in! Please sign in as Shyamalendu first.');
      return;
    }
    
    const realUserId = currentUser.uid;
    console.log('✅ Found Shyamalendu\'s real user ID:', realUserId);
    
    // Get all dogs with the old hardcoded owner ID
    const dogsRef = firebase.firestore().collection('dogs');
    const snapshot = await dogsRef.where('ownerId', '==', 'shyam-user-001').get();
    
    console.log(`📋 Found ${snapshot.size} dogs with old owner ID 'shyam-user-001'`);
    
    if (snapshot.empty) {
      console.log('✅ No dogs need fixing - all owner IDs are already correct!');
      return;
    }
    
    // Update each dog with the real user ID
    let updatedCount = 0;
    const batch = firebase.firestore().batch();
    
    snapshot.forEach((doc) => {
      const dogRef = firebase.firestore().collection('dogs').doc(doc.id);
      batch.update(dogRef, { ownerId: realUserId });
      updatedCount++;
      console.log(`📝 Queued update for dog: ${doc.data().name}`);
    });
    
    // Commit all updates
    await batch.commit();
    
    console.log(`🎉 SUCCESS! Updated ${updatedCount} dogs with Shyamalendu's real user ID: ${realUserId}`);
    console.log('✅ Now Shyamalendu should see all rental requests!');
    
    // Refresh the page to see changes
    console.log('🔄 Refreshing page to show changes...');
    setTimeout(() => window.location.reload(), 2000);
    
  } catch (error) {
    console.error('❌ Error fixing dog owner IDs:', error);
  }
}

// Run the fix
fixDogOwnerIds();