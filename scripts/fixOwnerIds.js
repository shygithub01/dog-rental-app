// Quick script to check and fix owner ID mismatches
// Run this in browser console on your app

async function checkOwnerIdMismatch() {
  // This should be run in the browser console where Firebase is available
  console.log('🔍 Checking for owner ID mismatches...');
  
  try {
    // Get current user
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      console.log('❌ No user logged in');
      return;
    }
    
    console.log('👤 Current user ID:', currentUser.uid);
    console.log('👤 Current user email:', currentUser.email);
    
    // Get all dogs owned by current user
    const dogsSnapshot = await firebase.firestore()
      .collection('dogs')
      .where('ownerId', '==', currentUser.uid)
      .get();
    
    const userDogs = [];
    dogsSnapshot.forEach(doc => {
      userDogs.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('🐕 Dogs owned by current user:', userDogs);
    
    // Get all rental requests
    const requestsSnapshot = await firebase.firestore()
      .collection('rentalRequests')
      .get();
    
    const allRequests = [];
    requestsSnapshot.forEach(doc => {
      allRequests.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('📋 All rental requests:', allRequests);
    
    // Find requests that should belong to current user
    const matchingRequests = allRequests.filter(request => 
      userDogs.some(dog => dog.id === request.dogId)
    );
    
    console.log('🎯 Requests that should belong to current user:', matchingRequests);
    
    // Check for mismatches
    const mismatches = matchingRequests.filter(request => 
      request.dogOwnerId !== currentUser.uid
    );
    
    if (mismatches.length > 0) {
      console.log('⚠️ Found mismatches:', mismatches);
      console.log('🔧 To fix, run: fixOwnerIdMismatches()');
    } else {
      console.log('✅ No mismatches found');
    }
    
  } catch (error) {
    console.error('❌ Error checking mismatches:', error);
  }
}

async function fixOwnerIdMismatches() {
  console.log('🔧 Fixing owner ID mismatches...');
  
  try {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      console.log('❌ No user logged in');
      return;
    }
    
    // Get user's dogs
    const dogsSnapshot = await firebase.firestore()
      .collection('dogs')
      .where('ownerId', '==', currentUser.uid)
      .get();
    
    const userDogIds = [];
    dogsSnapshot.forEach(doc => {
      userDogIds.push(doc.id);
    });
    
    // Get all rental requests
    const requestsSnapshot = await firebase.firestore()
      .collection('rentalRequests')
      .get();
    
    const batch = firebase.firestore().batch();
    let fixCount = 0;
    
    requestsSnapshot.forEach(doc => {
      const request = doc.data();
      if (userDogIds.includes(request.dogId) && request.dogOwnerId !== currentUser.uid) {
        console.log(`🔧 Fixing request ${doc.id}: ${request.dogOwnerId} → ${currentUser.uid}`);
        batch.update(doc.ref, { 
          dogOwnerId: currentUser.uid,
          dogOwnerName: currentUser.displayName || currentUser.email 
        });
        fixCount++;
      }
    });
    
    if (fixCount > 0) {
      await batch.commit();
      console.log(`✅ Fixed ${fixCount} rental requests`);
    } else {
      console.log('✅ No fixes needed');
    }
    
  } catch (error) {
    console.error('❌ Error fixing mismatches:', error);
  }
}

// Export functions to global scope
window.checkOwnerIdMismatch = checkOwnerIdMismatch;
window.fixOwnerIdMismatches = fixOwnerIdMismatches;

console.log('🛠️ Owner ID fix tools loaded!');
console.log('📋 Run: checkOwnerIdMismatch() to check for issues');
console.log('🔧 Run: fixOwnerIdMismatches() to fix issues');