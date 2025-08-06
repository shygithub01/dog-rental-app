import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyCX7lbqN6uYrisjdrD0fehWd0Bbbo5AfDU",
  authDomain: "dog-rental-app.firebaseapp.com",
  projectId: "dog-rental-app",
  storageBucket: "dog-rental-app.firebasestorage.app",
  messagingSenderId: "1011731918336",
  appId: "1:1011731918336:web:e0713a7dbbadc8964772e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 