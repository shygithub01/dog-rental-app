import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

export const checkAndUpdateDogAvailability = async (db: any) => {
  try {
    console.log('Checking for dogs with expired rentals...');
    
    // Get all active rentals
    const activeRentalsQuery = query(
      collection(db, 'rentals'),
      where('status', '==', 'active')
    );
    
    const activeRentalsSnapshot = await getDocs(activeRentalsQuery);
    const now = new Date();
    let updatedCount = 0;

    for (const rentalDoc of activeRentalsSnapshot.docs) {
      const rentalData = rentalDoc.data();
      const endDate = rentalData.endDate.toDate();
      
      // If rental has ended, update dog availability and rental status
      if (endDate < now) {
        console.log(`Rental ${rentalDoc.id} has ended, updating availability...`);
        
        // Update rental status to completed
        await updateDoc(doc(db, 'rentals', rentalDoc.id), {
          status: 'completed',
          completedAt: Timestamp.now()
        });
        
        // Update dog availability
        await updateDoc(doc(db, 'dogs', rentalData.dogId), {
          isAvailable: true,
          status: 'available',
          rentedBy: null,
          rentedAt: null,
          updatedAt: Timestamp.now()
        });
        
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      console.log(`Updated ${updatedCount} dogs to available status`);
    } else {
      console.log('No dogs needed availability updates');
    }
    
    return updatedCount;
  } catch (error) {
    console.error('Error checking dog availability:', error);
    throw error;
  }
};

export const getRentalStatus = (startDate: Date, endDate: Date): 'upcoming' | 'active' | 'completed' => {
  const now = new Date();
  
  if (now < startDate) {
    return 'upcoming';
  } else if (now >= startDate && now <= endDate) {
    return 'active';
  } else {
    return 'completed';
  }
}; 