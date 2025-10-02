const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up your service account)
// Make sure you have your Firebase service account key file
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function cleanTestData() {
  console.log('🧹 Starting data cleanup...');
  
  try {
    // 1. Clear all rental requests
    console.log('📋 Clearing rental requests...');
    const rentalRequestsSnapshot = await db.collection('rentalRequests').get();
    const rentalRequestsBatch = db.batch();
    rentalRequestsSnapshot.docs.forEach(doc => {
      rentalRequestsBatch.delete(doc.ref);
    });
    await rentalRequestsBatch.commit();
    console.log(`✅ Deleted ${rentalRequestsSnapshot.docs.length} rental requests`);

    // 2. Clear all completed rentals
    console.log('🏠 Clearing completed rentals...');
    const rentalsSnapshot = await db.collection('rentals').get();
    const rentalsBatch = db.batch();
    rentalsSnapshot.docs.forEach(doc => {
      rentalsBatch.delete(doc.ref);
    });
    await rentalsBatch.commit();
    console.log(`✅ Deleted ${rentalsSnapshot.docs.length} completed rentals`);

    // 3. Reset all user stats to zero
    console.log('👤 Resetting user statistics...');
    const usersSnapshot = await db.collection('users').get();
    const usersBatch = db.batch();
    
    usersSnapshot.docs.forEach(doc => {
      usersBatch.update(doc.ref, {
        'stats.totalRentals': 0,
        'stats.completedRentals': 0,
        'stats.totalEarnings': 0,
        'stats.totalSpent': 0,
        'stats.dogsRented': 0
      });
    });
    await usersBatch.commit();
    console.log(`✅ Reset stats for ${usersSnapshot.docs.length} users`);

    // 4. Reset dog rental counts
    console.log('🐕 Resetting dog rental statistics...');
    const dogsSnapshot = await db.collection('dogs').get();
    const dogsBatch = db.batch();
    
    dogsSnapshot.docs.forEach(doc => {
      dogsBatch.update(doc.ref, {
        totalRentals: 0,
        status: 'available',
        isAvailable: true
      });
    });
    await dogsBatch.commit();
    console.log(`✅ Reset stats for ${dogsSnapshot.docs.length} dogs`);

    console.log('🎉 Data cleanup completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • Rental Requests: ${rentalRequestsSnapshot.docs.length} deleted`);
    console.log(`   • Completed Rentals: ${rentalsSnapshot.docs.length} deleted`);
    console.log(`   • User Stats: ${usersSnapshot.docs.length} reset`);
    console.log(`   • Dog Stats: ${dogsSnapshot.docs.length} reset`);
    console.log('');
    console.log('✨ All users should now show:');
    console.log('   • Dogs Owned: (actual count)');
    console.log('   • Total Rentals: 0');
    console.log('   • Total Earnings/Paid: $0');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
cleanTestData();