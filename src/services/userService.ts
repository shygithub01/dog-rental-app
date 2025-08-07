import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, getDoc, Timestamp, limit } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import type { User, UserProfileData, CreateUserData, UpdateUserData, UserPreferences, UserStats } from '../types/User';
import type { DogSummary, RentalSummary, ReviewSummary } from '../types/User';

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

      await addDoc(collection(this.db, 'users'), {
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
      const q = query(
        collection(this.db, 'users'),
        where('id', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        phoneNumber: data.phoneNumber,
        location: data.location,
        bio: data.bio,
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
      const user = await this.getUser(userId);
      if (!user) return null;

      // Get user's dogs
      const dogsQuery = query(
        collection(this.db, 'dogs'),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
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

      // Get recent rentals
      const rentalsQuery = query(
        collection(this.db, 'rentals'),
        where('renterId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const rentalsSnapshot = await getDocs(rentalsQuery);
      const recentRentals: RentalSummary[] = rentalsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          dogName: data.dogName,
          dogBreed: data.dogBreed,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          status: data.status,
          totalCost: data.totalCost
        };
      });

      // Get reviews (placeholder for now)
      const reviews: ReviewSummary[] = [];

      return {
        user,
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
      const q = query(
        collection(this.db, 'users'),
        where('id', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('User not found');
      }

      const docRef = querySnapshot.docs[0].ref;
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
      const q = query(
        collection(this.db, 'users'),
        where('id', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('User not found');
      }

      const docRef = querySnapshot.docs[0].ref;
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
      const q = query(
        collection(this.db, 'users'),
        where('id', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('User not found');
      }

      const docRef = querySnapshot.docs[0].ref;
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
  async searchUsers(searchTerm: string, limit: number = 10): Promise<User[]> {
    try {
      const q = query(
        collection(this.db, 'users'),
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff'),
        orderBy('displayName'),
        limit(limit)
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