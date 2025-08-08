import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc, Timestamp, getDoc } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import type { Dog, CreateDogData, UpdateDogData } from '../types/Dog';

export const useDogService = () => {
  const { db } = useFirebase();

  // Add a new dog
  const addDog = async (dogData: CreateDogData, ownerId: string, ownerName: string) => {
    try {
      const docRef = await addDoc(collection(db, 'dogs'), {
        ...dogData,
        ownerId,
        ownerName,
        isAvailable: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding dog:', error);
      throw error;
    }
  };

  // Get all dogs
  const getAllDogs = async (): Promise<Dog[]> => {
    try {
      const q = query(collection(db, 'dogs'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Dog[];
    } catch (error) {
      console.error('Error getting dogs:', error);
      throw error;
    }
  };

  // Get dogs by owner
  const getDogsByOwner = async (ownerId: string): Promise<Dog[]> => {
    try {
      const q = query(
        collection(db, 'dogs'), 
        where('ownerId', '==', ownerId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Dog[];
    } catch (error) {
      console.error('Error getting owner dogs:', error);
      throw error;
    }
  };

  // Get a single dog
  const getDog = async (dogId: string): Promise<Dog | null> => {
    try {
      const docRef = doc(db, 'dogs', dogId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate()
        } as Dog;
      }
      return null;
    } catch (error) {
      console.error('Error getting dog:', error);
      throw error;
    }
  };

  // Update a dog
  const updateDog = async (dogId: string, updateData: UpdateDogData) => {
    try {
      const dogRef = doc(db, 'dogs', dogId);
      await updateDoc(dogRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating dog:', error);
      throw error;
    }
  };

  // Add coordinates to existing dogs (utility function)
  const addCoordinatesToDog = async (dogId: string, coordinates: { lat: number; lng: number }) => {
    try {
      const dogRef = doc(db, 'dogs', dogId);
      await updateDoc(dogRef, {
        coordinates,
        updatedAt: Timestamp.now()
      });
      console.log(`Added coordinates to dog ${dogId}:`, coordinates);
    } catch (error) {
      console.error('Error adding coordinates to dog:', error);
      throw error;
    }
  };

  // Get dogs without coordinates (utility function)
  const getDogsWithoutCoordinates = async (): Promise<Dog[]> => {
    try {
      const q = query(collection(db, 'dogs'), where('coordinates', '==', null));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Dog[];
    } catch (error) {
      console.error('Error getting dogs without coordinates:', error);
      throw error;
    }
  };

  // Delete a dog
  const deleteDog = async (dogId: string) => {
    try {
      const docRef = doc(db, 'dogs', dogId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting dog:', error);
      throw error;
    }
  };

  return {
    addDog,
    getAllDogs,
    getDogsByOwner,
    getDog,
    updateDog,
    deleteDog,
    addCoordinatesToDog,
    getDogsWithoutCoordinates
  };
}; 