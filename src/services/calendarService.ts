import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';

export interface AvailabilityStatus {
  available: boolean;
  blocked: boolean;
  booked: boolean;
  reason?: string;
  rentalId?: string;
  price?: number; // Allow custom pricing per date
}

export interface DogAvailability {
  dogId: string;
  ownerId: string;
  availability: {
    [dateString: string]: AvailabilityStatus; // Format: 'YYYY-MM-DD'
  };
  defaultAvailable: boolean;
  recurringPatterns?: RecurringPattern[];
  updatedAt: Date;
}

export interface RecurringPattern {
  id: string;
  type: 'weekly' | 'monthly';
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  daysOfMonth?: number[]; // 1-31
  available: boolean;
  startDate: Date;
  endDate?: Date;
  reason?: string;
}

export class CalendarService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Get availability for a specific dog
  async getDogAvailability(dogId: string): Promise<DogAvailability | null> {
    try {
      const docRef = doc(this.db, 'dogAvailability', dogId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        dogId: data.dogId,
        ownerId: data.ownerId,
        availability: data.availability || {},
        defaultAvailable: data.defaultAvailable ?? true,
        recurringPatterns: data.recurringPatterns || [],
        updatedAt: data.updatedAt.toDate()
      };
    } catch (error) {
      console.error('Error getting dog availability:', error);
      throw error;
    }
  }

  // Set availability for specific dates
  async setAvailability(
    dogId: string, 
    ownerId: string, 
    dates: Date[], 
    status: Omit<AvailabilityStatus, 'booked'>
  ): Promise<void> {
    try {
      const docRef = doc(this.db, 'dogAvailability', dogId);
      
      // Get existing availability or create new
      let existingData = await this.getDogAvailability(dogId);
      if (!existingData) {
        existingData = {
          dogId,
          ownerId,
          availability: {},
          defaultAvailable: true,
          updatedAt: new Date()
        };
      }

      // Update availability for each date
      const updatedAvailability = { ...existingData.availability };
      dates.forEach(date => {
        const dateString = this.formatDate(date);
        updatedAvailability[dateString] = {
          ...status,
          booked: existingData.availability[dateString]?.booked || false
        };
      });

      await setDoc(docRef, {
        dogId,
        ownerId,
        availability: updatedAvailability,
        defaultAvailable: existingData.defaultAvailable,
        recurringPatterns: existingData.recurringPatterns || [],
        updatedAt: Timestamp.now()
      });

    } catch (error) {
      console.error('Error setting availability:', error);
      throw error;
    }
  }

  // Bulk update availability (for date ranges)
  async bulkUpdateAvailability(
    dogId: string,
    ownerId: string,
    startDate: Date,
    endDate: Date,
    status: Omit<AvailabilityStatus, 'booked'>
  ): Promise<void> {
    const dates = this.getDateRange(startDate, endDate);
    await this.setAvailability(dogId, ownerId, dates, status);
  }

  // Mark dates as booked (called when rental is approved)
  async markAsBooked(dogId: string, dates: Date[], rentalId: string): Promise<void> {
    try {
      const docRef = doc(this.db, 'dogAvailability', dogId);
      const existingData = await this.getDogAvailability(dogId);
      
      if (!existingData) return;

      const updatedAvailability = { ...existingData.availability };
      dates.forEach(date => {
        const dateString = this.formatDate(date);
        updatedAvailability[dateString] = {
          available: false,
          blocked: false,
          booked: true,
          rentalId,
          reason: 'Booked rental'
        };
      });

      await updateDoc(docRef, {
        availability: updatedAvailability,
        updatedAt: Timestamp.now()
      });

    } catch (error) {
      console.error('Error marking as booked:', error);
      throw error;
    }
  }

  // Unmark dates as booked (called when rental is cancelled)
  async unmarkAsBooked(dogId: string, dates: Date[]): Promise<void> {
    try {
      const docRef = doc(this.db, 'dogAvailability', dogId);
      const existingData = await this.getDogAvailability(dogId);
      
      if (!existingData) return;

      const updatedAvailability = { ...existingData.availability };
      dates.forEach(date => {
        const dateString = this.formatDate(date);
        if (updatedAvailability[dateString]?.booked) {
          updatedAvailability[dateString] = {
            available: true,
            blocked: false,
            booked: false
          };
        }
      });

      await updateDoc(docRef, {
        availability: updatedAvailability,
        updatedAt: Timestamp.now()
      });

    } catch (error) {
      console.error('Error unmarking as booked:', error);
      throw error;
    }
  }

  // Check if dates are available for booking
  async checkAvailability(dogId: string, dates: Date[]): Promise<boolean> {
    try {
      const availability = await this.getDogAvailability(dogId);
      if (!availability) return true;

      return dates.every(date => {
        const dateString = this.formatDate(date);
        const dayStatus = availability.availability[dateString];
        
        if (!dayStatus) {
          return availability.defaultAvailable;
        }
        
        return dayStatus.available && !dayStatus.blocked && !dayStatus.booked;
      });

    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }

  // Get available dates in a range
  async getAvailableDates(dogId: string, startDate: Date, endDate: Date): Promise<Date[]> {
    try {
      const availability = await this.getDogAvailability(dogId);
      const dateRange = this.getDateRange(startDate, endDate);
      
      if (!availability) {
        return dateRange;
      }

      return dateRange.filter(date => {
        const dateString = this.formatDate(date);
        const dayStatus = availability.availability[dateString];
        
        if (!dayStatus) {
          return availability.defaultAvailable;
        }
        
        return dayStatus.available && !dayStatus.blocked && !dayStatus.booked;
      });

    } catch (error) {
      console.error('Error getting available dates:', error);
      return [];
    }
  }

  // Utility methods
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  private getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }
}

// Hook to use calendar service
export const useCalendarService = () => {
  const { db } = useFirebase();
  return new CalendarService(db);
};