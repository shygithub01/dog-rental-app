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
        role: userData.role || 'renter',
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
        role: data.role || 'renter',
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
        },
        phoneVerified: data.phoneVerified || false,
        addressVerified: data.addressVerified || false,
        photoVerified: data.photoVerified || false,
        idVerified: data.idVerified || false,
        address: data.address,
        birthDate: data.birthDate,
        idDocument: data.idDocument,
        verificationScore: data.verificationScore
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  // Get complete user profile with dogs, rentals, and reviews
  async getUserProfile(userId: string): Promise<UserProfileData | null> {
    try {
      await checkAndUpdateDogAvailability(this.db);
      
      const user = await this.getUser(userId);
      if (!user) return null;

      // Get user's dogs
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
          imageUrls: data.imageUrls || (data.imageUrl ? [data.imageUrl] : []),
          isAvailable: data.isAvailable,
          totalRentals: data.totalRentals || 0,
          averageRating: data.averageRating || 0,
          pricePerDay: data.pricePerDay || 0,
          temperament: data.temperament || [],
          goodWith: data.goodWith || [],
          activityLevel: data.activityLevel,
          specialNotes: data.specialNotes
        };
      });

      // Get rental REQUESTS where user is the renter
      let renterRequests: any[] = [];
      try {
        const renterRequestsQuery = query(
          collection(this.db, 'rentalRequests'),
          where('renterId', '==', userId)
        );
        const renterRequestsSnapshot = await getDocs(renterRequestsQuery);
        renterRequests = renterRequestsSnapshot.docs.map(doc => {
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
      } catch (error) {
        console.log('Error loading renter requests:', error);
      }

      // Get rental REQUESTS where user is the dog owner
      let ownerRequests: any[] = [];
      try {
        const ownerRequestsQuery = query(
          collection(this.db, 'rentalRequests'),
          where('dogOwnerId', '==', userId)
        );
        const ownerRequestsSnapshot = await getDocs(ownerRequestsQuery);
        ownerRequests = ownerRequestsSnapshot.docs.map(doc => {
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
      } catch (error) {
        console.log('Error loading owner requests:', error);
      }

      // Get COMPLETED/ACTIVE rentals where user is the renter
      let renterRentals: any[] = [];
      try {
        const renterRentalsQuery = query(
          collection(this.db, 'rentals'),
          where('renterId', '==', userId)
        );
        const renterRentalsSnapshot = await getDocs(renterRentalsQuery);
        renterRentals = renterRentalsSnapshot.docs.map(doc => {
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
      } catch (error) {
        console.log('No completed rentals as renter yet');
      }

      // Get COMPLETED/ACTIVE rentals where user is the dog owner
      let ownerRentals: any[] = [];
      try {
        const ownerRentalsQuery = query(
          collection(this.db, 'rentals'),
          where('dogOwnerId', '==', userId)
        );
        const ownerRentalsSnapshot = await getDocs(ownerRentalsQuery);
        ownerRentals = ownerRentalsSnapshot.docs.map(doc => {
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
      } catch (error) {
        console.log('No completed rentals as owner yet');
      }

      // Combine all: requests + completed rentals
      const allRentals = [...renterRequests, ...ownerRequests, ...renterRentals, ...ownerRentals];
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
      // Debug: Log the data to see what's happening
      console.log('DEBUG - Renter data:', {
        renterRequests: renterRequests.length,
        renterRentals: renterRentals.length,
        renterRequestsData: renterRequests.map(r => ({ id: r.id, cost: r.totalCost, status: r.status })),
        renterRentalsData: renterRentals.map(r => ({ id: r.id, cost: r.totalCost, status: r.status }))
      });

      // For now, let's use ONLY completed rentals to avoid double counting
      // This is a more reliable approach than trying to deduplicate
      const uniqueRenterTransactions = renterRentals; // Only use completed rentals
      const uniqueOwnerTransactions = ownerRentals; // Only use completed rentals
      
      const totalRentalsAsRenter = uniqueRenterTransactions.length;
      const totalRentalsAsOwner = uniqueOwnerTransactions.length;
      
      const completedRentalsAsRenter = uniqueRenterTransactions
        .filter(r => r.status === 'completed' || r.status === 'active' || r.status === 'approved').length;
      const completedRentalsAsOwner = uniqueOwnerTransactions
        .filter(r => r.status === 'completed' || r.status === 'active' || r.status === 'approved').length;
      
      const totalEarnings = uniqueOwnerTransactions
        .filter(r => r.status === 'completed' || r.status === 'active' || r.status === 'approved')
        .reduce((sum, r) => sum + r.totalCost, 0);
      
      const totalSpent = uniqueRenterTransactions
        .filter(r => r.status === 'completed' || r.status === 'active' || r.status === 'approved')
        .reduce((sum, r) => sum + r.totalCost, 0);

      const isOwner = dogs.length > 0;
      
      const updatedStats = {
        dogsOwned: dogs.length,
        dogsRented: totalRentalsAsRenter,
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
        renterRequests: renterRequests.length,
        ownerRequests: ownerRequests.length,
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

      if (stats.lastRentalDate) {
        updateData['stats.lastRentalDate'] = Timestamp.fromDate(stats.lastRentalDate);
      }

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
          role: data.role || 'renter',
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

  // Update user profile fields
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const docRef = doc(this.db, 'users', userId);
      const updateData: any = {
        lastActive: Timestamp.now()
      };

      if (updates.phoneNumber !== undefined) updateData.phoneNumber = updates.phoneNumber;
      if (updates.phoneVerified !== undefined) updateData.phoneVerified = updates.phoneVerified;
      if (updates.idDocument !== undefined) updateData.idDocument = updates.idDocument;
      if (updates.idVerified !== undefined) updateData.idVerified = updates.idVerified;
      if (updates.photoURL !== undefined) updateData.photoURL = updates.photoURL;
      if (updates.photoVerified !== undefined) updateData.photoVerified = updates.photoVerified;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.addressVerified !== undefined) updateData.addressVerified = updates.addressVerified;
      if (updates.birthDate !== undefined) updateData.birthDate = updates.birthDate;
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      if (updates.location !== undefined) updateData.location = updates.location;

      await updateDoc(docRef, updateData);
      console.log('User profile updated successfully!');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}

// Hook to use user service
export const useUserService = () => {
  const { db } = useFirebase();
  return new UserService(db);
};
