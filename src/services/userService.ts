import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, getDoc, Timestamp, limit, setDoc } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import type { User, UserProfileData, CreateUserData, UpdateUserData, UserPreferences, UserStats } from '../types/User';
import type { DogSummary, RentalSummary, ReviewSummary } from '../types/User';
import { checkAndUpdateDogAvailability } from '../utils/rentalUtils';

export class UserService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Create a new user profile
  async createUser(userId: string, userData: CreateUserData): Promise<void> {
    try {
      const defaultPreferences: UserPreferences = {
        emailNotifications: true,
        pushNotifications: true,
        rentalRequests: true,
        rentalUpdates: true,
        reminders: true,
        systemUpdates: true,
        maxRentalDistance: 25,
        preferredDogSizes: ['small', 'medium', 'large'],
        preferredBreeds: []
      };

      const defaultStats: UserStats = {
        dogsOwned: 0,
        dogsRented: 0,
        totalRentals: 0,
        completedRentals: 0,
        cancelledRentals: 0,
        averageRating: 0,
        totalEarnings: 0,
        totalSpent: 0,
        memberSince: new Date()
      };

      const user: Omit<User, 'id'> = {
        ...userData,
        role: userData.role || 'hybrid', // Default to hybrid if no role specified
        joinDate: new Date(),
        lastActive: new Date(),
        isVerified: false,
        rating: 0,
        totalReviews: 0,
        totalRentals: 0,
        totalEarnings: 0,
        preferences: defaultPreferences,
        stats: defaultStats
      };

      // Use setDoc with the userId as the document ID
      await setDoc(doc(this.db, 'users', userId), {
        ...user,
        joinDate: Timestamp.fromDate(user.joinDate),
        lastActive: Timestamp.fromDate(user.lastActive),
        memberSince: Timestamp.fromDate(defaultStats.memberSince)
      });

      console.log('User profile created successfully!');
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Get user profile by ID
  async getUser(userId: string): Promise<User | null> {
    try {
      const docRef = doc(this.db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      return {
        id: docSnap.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        phoneNumber: data.phoneNumber,
        location: data.location,
        bio: data.bio,
        role: data.role || 'hybrid', // Default to hybrid if no role exists
        joinDate: data.joinDate.toDate(),
        lastActive: data.lastActive.toDate(),
        isVerified: data.isVerified,
        rating: data.rating,
        totalReviews: data.totalReviews,
        totalRentals: data.totalRentals,
        totalEarnings: data.totalEarnings,
        preferences: data.preferences,
        stats: {
          ...data.stats,
          memberSince: data.stats.memberSince.toDate(),
          lastRentalDate: data.stats.lastRentalDate?.toDate()
        }
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  // Get complete user profile with dogs, rentals, and reviews
  async getUserProfile(userId: string): Promise<UserProfileData | null> {
    try {
      // First, check and update dog availability
      await checkAndUpdateDogAvailability(this.db);
      
      const user = await this.getUser(userId);
      if (!user) return null;

      // Get user's dogs (simplified query to avoid index requirement)
      const dogsQuery = query(
        collection(this.db, 'dogs'),
        where('ownerId', '==', userId)
      );
      const dogsSnapshot = await getDocs(dogsQuery);
      const dogs: DogSummary[] = dogsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          breed: data.breed,
          imageUrl: data.imageUrl,
          isAvailable: data.isAvailable,
          totalRentals: data.totalRentals || 0,
          averageRating: data.averageRating || 0
        };
      });

      // Get rentals where user is the renter
      const renterRentalsQuery = query(
        collection(this.db, 'rentals'),
        where('renterId', '==', userId)
      );
      const renterRentalsSnapshot = await getDocs(renterRentalsQuery);
      const renterRentals = renterRentalsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          dogName: data.dogName,
          dogBreed: data.dogBreed,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          status: data.status,
          totalCost: data.totalCost,
          type: 'rented' as const
        };
      });

      // Get rentals where user is the dog owner (for earnings)
      const ownerRentalsQuery = query(
        collection(this.db, 'rentals'),
        where('dogOwnerId', '==', userId)
      );
      const ownerRentalsSnapshot = await getDocs(ownerRentalsQuery);
      const ownerRentals = ownerRentalsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          dogName: data.dogName,
          dogBreed: data.dogBreed,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          status: data.status,
          totalCost: data.totalCost,
          type: 'owned' as const
        };
      });

      // Combine all rentals for display
      const allRentals = [...renterRentals, ...ownerRentals];
      const recentRentals: RentalSummary[] = allRentals
        .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
        .slice(0, 5)
        .map(rental => ({
          id: rental.id,
          dogName: rental.dogName,
          dogBreed: rental.dogBreed,
          startDate: rental.startDate,
          endDate: rental.endDate,
          status: rental.status,
          totalCost: rental.totalCost
        }));

      // Get reviews (placeholder for now)
      const reviews: ReviewSummary[] = [];

      // Calculate updated stats based on actual data
      const totalRentalsAsRenter = renterRentals.length;
      const totalRentalsAsOwner = ownerRentals.length;
      const completedRentalsAsRenter = renterRentals.filter(r => r.status === 'completed' || r.status === 'active').length;
      const completedRentalsAsOwner = ownerRentals.filter(r => r.status === 'completed' || r.status === 'active').length;
      
      const totalEarnings = ownerRentals
        .filter(r => r.status === 'completed' || r.status === 'active')
        .reduce((sum, r) => sum + r.totalCost, 0);
      
      const totalSpent = renterRentals
        .filter(r => r.status === 'completed' || r.status === 'active')
        .reduce((sum, r) => sum + r.totalCost, 0);

      // Determine if user is primarily an owner or renter
      const isOwner = dogs.length > 0;
      
      const updatedStats = {
        dogsOwned: dogs.length,
        dogsRented: totalRentalsAsRenter,
        // For owners: show their dogs' rentals. For renters: show their own rentals
        totalRentals: isOwner ? totalRentalsAsOwner : totalRentalsAsRenter,
        completedRentals: isOwner ? completedRentalsAsOwner : completedRentalsAsRenter,
        cancelledRentals: allRentals.filter(r => r.status === 'cancelled').length,
        averageRating: user.stats.averageRating,
        totalEarnings: totalEarnings,
        totalSpent: totalSpent,
        memberSince: user.stats.memberSince,
        lastRentalDate: allRentals.length > 0 ? allRentals[0].startDate : undefined
      };

      console.log('Calculated stats:', {
        dogsOwned: updatedStats.dogsOwned,
        totalRentals: updatedStats.totalRentals,
        completedRentals: updatedStats.completedRentals,
        totalEarnings: updatedStats.totalEarnings,
        totalSpent: updatedStats.totalSpent,
        renterRentals: renterRentals.length,
        ownerRentals: ownerRentals.length,
        isOwner: isOwner
      });

      // Update user stats in database if they're different
      if (
        updatedStats.dogsOwned !== user.stats.dogsOwned ||
        updatedStats.totalRentals !== user.stats.totalRentals ||
        updatedStats.totalEarnings !== user.stats.totalEarnings
      ) {
        try {
          await this.updateUserStats(userId, updatedStats);
          console.log('Updated user stats based on actual data');
        } catch (error) {
          console.error('Error updating user stats:', error);
        }
      }

      // Return profile with updated stats
      const updatedUser = {
        ...user,
        stats: updatedStats
      };

      return {
        user: updatedUser,
        dogs,
        recentRentals,
        reviews
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUser(userId: string, updateData: UpdateUserData): Promise<void> {
    try {
      const docRef = doc(this.db, 'users', userId);
      await updateDoc(docRef, {
        ...updateData,
        lastActive: Timestamp.now()
      });

      console.log('User profile updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const docRef = doc(this.db, 'users', userId);
      await updateDoc(docRef, {
        'preferences': preferences,
        lastActive: Timestamp.now()
      });

      console.log('User preferences updated successfully!');
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // Update user stats
  async updateUserStats(userId: string, stats: Partial<UserStats>): Promise<void> {
    try {
      const docRef = doc(this.db, 'users', userId);
      const updateData: any = {
        lastActive: Timestamp.now()
      };

      // Convert Date objects to Timestamps
      if (stats.lastRentalDate) {
        updateData['stats.lastRentalDate'] = Timestamp.fromDate(stats.lastRentalDate);
      }

      // Add other stats
      Object.keys(stats).forEach(key => {
        if (key !== 'lastRentalDate') {
          updateData[`stats.${key}`] = stats[key as keyof UserStats];
        }
      });

      await updateDoc(docRef, updateData);

      console.log('User stats updated successfully!');
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // Search users
  async searchUsers(searchTerm: string, resultLimit: number = 10): Promise<User[]> {
    try {
      const q = query(
        collection(this.db, 'users'),
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff'),
        orderBy('displayName'),
        limit(resultLimit)
      );
      
      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          phoneNumber: data.phoneNumber,
          location: data.location,
          bio: data.bio,
          role: data.role || 'hybrid', // Default to hybrid if no role exists
          joinDate: data.joinDate.toDate(),
          lastActive: data.lastActive.toDate(),
          isVerified: data.isVerified,
          rating: data.rating,
          totalReviews: data.totalReviews,
          totalRentals: data.totalRentals,
          totalEarnings: data.totalEarnings,
          preferences: data.preferences,
          stats: {
            ...data.stats,
            memberSince: data.stats.memberSince.toDate(),
            lastRentalDate: data.stats.lastRentalDate?.toDate()
          }
        });
      });

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}

// Hook to use user service
export const useUserService = () => {
  const { db } = useFirebase();
  return new UserService(db);
}; 