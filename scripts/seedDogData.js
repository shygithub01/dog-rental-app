import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyBvOkBH0CqgShJ_wAjOWnVtNCzqShphI30",
  authDomain: "dog-rental-app.firebaseapp.com",
  projectId: "dog-rental-app",
  storageBucket: "dog-rental-app.firebasestorage.app",
  messagingSenderId: "649517070731",
  appId: "1:649517070731:web:0b8c4a1a5c5d5e5f5g5h5i"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Dog breeds for randomization
const breeds = [
  'Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'Bulldog',
  'Poodle', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund',
  'Siberian Husky', 'Boxer', 'Border Collie', 'Chihuahua', 'Shih Tzu',
  'Boston Terrier', 'Pomeranian', 'Australian Shepherd', 'Cocker Spaniel',
  'French Bulldog', 'Great Dane', 'Mastiff', 'Pit Bull', 'Jack Russell Terrier'
];

const sizes = ['small', 'medium', 'large'];
const temperaments = ['Calm', 'Energetic', 'Playful', 'Gentle', 'Protective', 'Social', 'Independent', 'Cuddly'];
const goodWithOptions = ['Kids', 'Other Dogs', 'Cats', 'Strangers', 'Seniors'];
const activityLevels = ['Low', 'Medium', 'High'];

// Sample descriptions
const descriptions = [
  "A friendly and well-trained dog who loves to play and cuddle. Great with families and other pets.",
  "This sweet pup is perfect for active families who enjoy outdoor adventures and long walks.",
  "A gentle soul who loves attention and is great with children. House-trained and obedient.",
  "An energetic companion who loves to play fetch and go on hikes. Very social and friendly.",
  "A calm and loving dog who enjoys quiet time and gentle walks. Perfect for seniors or families.",
  "This playful pup loves toys, treats, and meeting new people. Great for first-time dog owners.",
  "A loyal and protective companion who is also gentle and loving with family members.",
  "An intelligent and well-behaved dog who knows basic commands and loves to learn new tricks."
];

// Generate coordinates within 5-25 miles of 23059 (Glen Allen, VA)
// 23059 coordinates: approximately 37.6501° N, 77.5047° W
const baseLatitude = 37.6501;
const baseLongitude = -77.5047;

function generateRandomCoordinates() {
  // Generate random distance between 5-25 miles
  const minDistance = 5;
  const maxDistance = 25;
  const distance = Math.random() * (maxDistance - minDistance) + minDistance;
  
  // Convert miles to degrees (rough approximation)
  const milesPerDegree = 69; // approximately
  const maxOffset = distance / milesPerDegree;
  
  // Generate random angle
  const angle = Math.random() * 2 * Math.PI;
  
  // Calculate offset
  const latOffset = Math.cos(angle) * maxOffset * (Math.random() * 0.8 + 0.2); // 20-100% of max distance
  const lngOffset = Math.sin(angle) * maxOffset * (Math.random() * 0.8 + 0.2);
  
  return {
    lat: baseLatitude + latOffset,
    lng: baseLongitude + lngOffset
  };
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateRandomAge() {
  return Math.floor(Math.random() * 12) + 1; // 1-12 years
}

function generateRandomPrice() {
  return Math.floor(Math.random() * 101) + 50; // $50-$150
}

// Virginia cities near 23059
const locations = [
  'Glen Allen, VA',
  'Richmond, VA', 
  'Henrico, VA',
  'Short Pump, VA',
  'Mechanicsville, VA',
  'Ashland, VA',
  'Innsbrook, VA',
  'Sandston, VA',
  'Tuckahoe, VA',
  'Lakeside, VA'
];

// Sample owner names
const ownerNames = [
  'Sarah Johnson', 'Mike Davis', 'Emily Chen', 'David Wilson',
  'Jessica Brown', 'Chris Martinez', 'Amanda Taylor', 'Ryan Anderson',
  'Lisa Thompson', 'Kevin White', 'Maria Garcia', 'James Miller',
  'Nicole Rodriguez', 'Brandon Lee', 'Ashley Clark', 'Tyler Hall'
];

// Dog image URLs (using placeholder images)
const dogImageUrls = [
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1546975490-e8b92a360b24?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop'
];

async function seedDogData() {
  console.log('🐕 Starting to seed dog data...');
  
  try {
    // Create dogs Stanny3 through Stanny25 (23 new dogs)
    for (let i = 3; i <= 25; i++) {
      const coordinates = generateRandomCoordinates();
      const breed = getRandomElement(breeds);
      const size = getRandomElement(sizes);
      const temperament = getRandomElements(temperaments, Math.floor(Math.random() * 4) + 1);
      const goodWith = getRandomElements(goodWithOptions, Math.floor(Math.random() * 3) + 1);
      const activityLevel = getRandomElement(activityLevels);
      const age = generateRandomAge();
      const pricePerDay = generateRandomPrice();
      const location = getRandomElement(locations);
      const ownerName = getRandomElement(ownerNames);
      const description = getRandomElement(descriptions);
      const imageUrl = getRandomElement(dogImageUrls);
      
      const dogData = {
        name: `Stanny${i}`,
        breed: breed,
        age: age,
        size: size,
        description: description,
        pricePerDay: pricePerDay,
        location: location,
        coordinates: coordinates,
        imageUrl: imageUrl,
        imageUrls: [imageUrl],
        temperament: temperament,
        goodWith: goodWith,
        activityLevel: activityLevel,
        specialNotes: `Stanny${i} is a wonderful ${breed.toLowerCase()} who loves spending time with people!`,
        ownerId: 'Y8qPWIVDbcaUGFKbU0wN2D46fRH3', // Shyamalendu's real Firebase user ID
        ownerName: 'Shyamalendu Mohapatra',
        isAvailable: true,
        status: 'available',
        adminReviewed: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        averageRating: Math.round((Math.random() * 2 + 3) * 10) / 10 // 3.0-5.0 rating
      };
      
      await addDoc(collection(db, 'dogs'), dogData);
      console.log(`✅ Added ${dogData.name} - ${dogData.breed} in ${dogData.location} ($${dogData.pricePerDay}/day)`);
      
      // Small delay to avoid overwhelming Firebase
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🎉 Successfully seeded 23 new dogs (Stanny3 - Stanny25)!');
    console.log('📍 All dogs are located within 5-25 miles of 23059 (Glen Allen, VA)');
    console.log('💰 Prices range from $50-$150 per day');
    
  } catch (error) {
    console.error('❌ Error seeding dog data:', error);
  }
}

// Run the seeding function
seedDogData();