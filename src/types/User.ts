export type UserRole = 'owner' | 'renter' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  role: UserRole;
  joinDate: Date;
  lastActive: Date;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  totalRentals: number;
  totalEarnings: number;
  preferences: UserPreferences;
  stats: UserStats;
  isAdmin?: boolean; // Alternative admin flag
  
  // Verification fields
  phoneVerified?: boolean;
  addressVerified?: boolean;
  photoVerified?: boolean;
  idVerified?: boolean;
  address?: string;
  birthDate?: string;
  idDocument?: string;
  
  // Verification score
  verificationScore?: {
    percentage: number;
    verificationLevel: string;
    breakdown: {
      email: { score: number; maxScore: number };
      phone: { score: number; maxScore: number };
      photo: { score: number; maxScore: number };
      basicInfo: { score: number; maxScore: number };
      idDocument: { score: number; maxScore: number };
      address: { score: number; maxScore: number };
      activity: { score: number; maxScore: number };
      reviews: { score: number; maxScore: number };
    };
  };
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  rentalRequests: boolean;
  rentalUpdates: boolean;
  reminders: boolean;
  systemUpdates: boolean;
  maxRentalDistance: number; // in miles
  preferredDogSizes: ('small' | 'medium' | 'large')[];
  preferredBreeds: string[];
}

export interface UserStats {
  dogsOwned: number;
  dogsRented: number;
  totalRentals: number;
  completedRentals: number;
  cancelledRentals: number;
  averageRating: number;
  totalEarnings: number;
  totalSpent: number;
  memberSince: Date;
  lastRentalDate?: Date;
}

export interface UserProfileData {
  user: User;
  dogs: DogSummary[];
  recentRentals: RentalSummary[];
  reviews: ReviewSummary[];
}

export interface DogSummary {
  id: string;
  name: string;
  breed: string;
  imageUrl?: string;
  isAvailable: boolean;
  totalRentals: number;
  averageRating: number;
}

export interface RentalSummary {
  id: string;
  dogName: string;
  dogBreed: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'cancelled';
  totalCost: number;
}

export interface ReviewSummary {
  id: string;
  dogName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface CreateUserData {
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  role?: UserRole;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  preferences?: Partial<UserPreferences>;
} 