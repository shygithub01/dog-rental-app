import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export interface PlatformStatistics {
  // Dog Statistics
  dogs: {
    totalOwned: number;
    available: number;
    rented: number;
    pendingRequests: number;
    unavailable: number;
  };
  
  // Rental Statistics
  rentals: {
    totalRentals: number;
    activeRentals: number;
    completedRentals: number;
    pendingRentals: number;
    cancelledRentals: number;
  };
  
  // Financial Statistics
  earnings: {
    totalEarnings: number;
    pendingEarnings: number;
    completedEarnings: number;
    futureEarnings: number;
    averageRentalValue: number;
  };
  
  // User Statistics
  user: {
    totalRentalsAsRenter: number;
    activeRentalsAsRenter: number;
    totalSpentAsRenter: number;
    averageRating: number;
    joinDate: Date | null;
  };
}

class StatisticsService {
  private cache: Map<string, { data: PlatformStatistics; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getUserStatistics(userId: string, db: any): Promise<PlatformStatistics> {
    // Check cache first
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Fetch all relevant data in parallel
      const [dogsSnapshot, rentalsAsOwnerSnapshot, rentalsAsRenterSnapshot, userSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'dogs'), where('ownerId', '==', userId))),
        getDocs(query(collection(db, 'rentals'), where('ownerId', '==', userId))),
        getDocs(query(collection(db, 'rentals'), where('renterId', '==', userId))),
        getDocs(query(collection(db, 'users'), where('uid', '==', userId)))
      ]);

      // Process dogs data
      const dogs = dogsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const rentalsAsOwner = rentalsAsOwnerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const rentalsAsRenter = rentalsAsRenterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const userData = userSnapshot.docs[0]?.data();

      // Calculate dog statistics
      const dogStats = {
        totalOwned: dogs.length,
        available: dogs.filter(dog => dog.isAvailable && dog.status !== 'rented').length,
        rented: dogs.filter(dog => dog.status === 'rented').length,
        pendingRequests: dogs.filter(dog => dog.status === 'requested').length,
        unavailable: dogs.filter(dog => !dog.isAvailable).length
      };

      // Calculate rental statistics (as owner)
      const now = new Date();
      const rentalStats = {
        totalRentals: rentalsAsOwner.length,
        activeRentals: rentalsAsOwner.filter(rental => {
          const startDate = rental.startDate?.toDate?.() || new Date(rental.startDate);
          const endDate = rental.endDate?.toDate?.() || new Date(rental.endDate);
          return rental.status === 'active' || (startDate <= now && endDate >= now);
        }).length,
        completedRentals: rentalsAsOwner.filter(rental => rental.status === 'completed').length,
        pendingRentals: rentalsAsOwner.filter(rental => rental.status === 'pending').length,
        cancelledRentals: rentalsAsOwner.filter(rental => rental.status === 'cancelled').length
      };

      // Calculate financial statistics
      const completedRentals = rentalsAsOwner.filter(rental => rental.status === 'completed');
      const pendingRentals = rentalsAsOwner.filter(rental => rental.status === 'pending');
      const activeRentals = rentalsAsOwner.filter(rental => rental.status === 'active');
      
      const completedEarnings = completedRentals.reduce((sum, rental) => sum + (rental.totalCost || 0), 0);
      const pendingEarnings = pendingRentals.reduce((sum, rental) => sum + (rental.totalCost || 0), 0);
      const futureEarnings = activeRentals.reduce((sum, rental) => sum + (rental.totalCost || 0), 0);
      
      const earningsStats = {
        totalEarnings: completedEarnings,
        pendingEarnings,
        completedEarnings,
        futureEarnings,
        averageRentalValue: rentalsAsOwner.length > 0 ? 
          rentalsAsOwner.reduce((sum, rental) => sum + (rental.totalCost || 0), 0) / rentalsAsOwner.length : 0
      };

      // Calculate user statistics (as renter)
      const userStats = {
        totalRentalsAsRenter: rentalsAsRenter.length,
        activeRentalsAsRenter: rentalsAsRenter.filter(rental => {
          const startDate = rental.startDate?.toDate?.() || new Date(rental.startDate);
          const endDate = rental.endDate?.toDate?.() || new Date(rental.endDate);
          return rental.status === 'active' || (startDate <= now && endDate >= now);
        }).length,
        totalSpentAsRenter: rentalsAsRenter.reduce((sum, rental) => sum + (rental.totalCost || 0), 0),
        averageRating: userData?.averageRating || 0,
        joinDate: userData?.createdAt?.toDate?.() || null
      };

      const statistics: PlatformStatistics = {
        dogs: dogStats,
        rentals: rentalStats,
        earnings: earningsStats,
        user: userStats
      };

      // Cache the result
      this.cache.set(userId, {
        data: statistics,
        timestamp: Date.now()
      });

      return statistics;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw error;
    }
  }

  // Clear cache for a specific user (call this when data changes)
  clearUserCache(userId: string): void {
    this.cache.delete(userId);
  }

  // Clear all cache
  clearAllCache(): void {
    this.cache.clear();
  }

  // Get cached statistics without fetching (returns null if not cached)
  getCachedStatistics(userId: string): PlatformStatistics | null {
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }
}

export const statisticsService = new StatisticsService();