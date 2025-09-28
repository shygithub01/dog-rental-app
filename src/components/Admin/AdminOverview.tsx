import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, addDoc, Timestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AdminOverviewProps {
  adminData: any;
  onRefresh: () => void;
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ adminData, onRefresh }) => {
  const { db } = useFirebase();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDogs: 0,
    totalRentals: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    recentSignups: 0,
    conversionRate: 0,
    avgRentalValue: 0,
    topPerformingDogs: [] as any[],
    recentActivity: [] as any[],
    dailyRevenue: [] as any[],
    userGrowth: [] as any[],
    dogsBySize: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      // Fetch comprehensive stats
      const [users, dogs, rentals] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'dogs')),
        getDocs(collection(db, 'rentals'))
      ]);

      const usersData = users.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const dogsData = dogs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const rentalsData = rentals.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      // Calculate advanced metrics
      const totalRevenue = rentalsData.reduce((sum, rental) => sum + (rental.totalCost || 0), 0);
      const activeUsers = usersData.filter(user => {
        const lastActive = user.lastActive?.toDate();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return lastActive && lastActive > thirtyDaysAgo;
      }).length;

      const recentSignups = usersData.filter(user => {
        const createdAt = user.createdAt?.toDate();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return createdAt && createdAt > sevenDaysAgo;
      }).length;

      // Generate chart data
      const dailyRevenue = generateDailyRevenueData(rentalsData);
      const userGrowth = generateUserGrowthData(usersData);
      const dogsBySize = generateDogsBySizeData(dogsData);

      setStats({
        totalUsers: usersData.length,
        totalDogs: dogsData.length,
        totalRentals: rentalsData.length,
        totalRevenue,
        activeUsers,
        pendingApprovals: dogsData.filter(dog => dog.status === 'pending').length,
        recentSignups,
        conversionRate: usersData.length > 0 ? (rentalsData.length / usersData.length) * 100 : 0,
        avgRentalValue: rentalsData.length > 0 ? totalRevenue / rentalsData.length : 0,
        topPerformingDogs: dogsData.slice(0, 5),
        recentActivity: [],
        dailyRevenue,
        userGrowth,
        dogsBySize
      });

    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data generation functions
  const generateDailyRevenueData = (rentals: any[]) => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayRentals = rentals.filter(rental => {
        const rentalDate = rental.createdAt?.toDate?.() || rental.createdAt;
        return rentalDate && 
               rentalDate.toDateString() === date.toDateString();
      });
      const dayRevenue = dayRentals.reduce((sum, rental) => sum + (rental.totalCost || 0), 0);
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
        rentals: dayRentals.length
      });
    }
    return last7Days;
  };

  const generateUserGrowthData = (users: any[]) => {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayUsers = users.filter(user => {
        const userDate = user.createdAt?.toDate?.() || user.createdAt;
        return userDate && userDate.toDateString() === date.toDateString();
      });
      
      if (i % 5 === 0) { // Show every 5th day to avoid crowding
        last30Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          users: dayUsers.length,
          cumulative: users.filter(u => {
            const uDate = u.createdAt?.toDate?.() || u.createdAt;
            return uDate && uDate <= date;
          }).length
        });
      }
    }
    return last30Days;
  };

  const generateDogsBySizeData = (dogs: any[]) => {
    const sizeCount = { small: 0, medium: 0, large: 0 };
    dogs.forEach(dog => {
      if (dog.size && sizeCount.hasOwnProperty(dog.size)) {
        sizeCount[dog.size as keyof typeof sizeCount]++;
      }
    });
    
    return [
      { name: 'Small', value: sizeCount.small, color: '#3b82f6' },
      { name: 'Medium', value: sizeCount.medium, color: '#f59e0b' },
      { name: 'Large', value: sizeCount.large, color: '#10b981' }
    ];
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading overview...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h1 style={{ fontSize: '2rem', color: '#1f2937', margin: 0 }}>
            📊 System Overview
          </h1>
          <div>
            <SmartSeedDogsButton />
          </div>
        </div>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Real-time insights and key performance metrics
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <MetricCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="#3b82f6"
          subtitle={`${stats.activeUsers} active (30d)`}
        />
        <MetricCard
          title="Total Dogs"
          value={stats.totalDogs}
          icon="🐕"
          color="#f59e0b"
          subtitle={`${stats.pendingApprovals} pending approval`}
        />
        <MetricCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon="💰"
          color="#10b981"
          subtitle={`Avg: $${stats.avgRentalValue.toFixed(0)} per rental`}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon="📈"
          color="#8b5cf6"
          subtitle={`${stats.recentSignups} new users (7d)`}
        />
      </div>

      {/* Real-time Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Daily Revenue Chart */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>💰 Daily Revenue (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: any, name: string) => [
                  name === 'revenue' ? `$${value}` : value,
                  name === 'revenue' ? 'Revenue' : 'Rentals'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Chart */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>👥 User Growth (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: any, name: string) => [
                  value,
                  name === 'users' ? 'New Users' : 'Total Users'
                ]}
              />
              <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {/* Dogs by Size Distribution */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>🐕 Dogs by Size</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats.dogsBySize}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {stats.dogsBySize.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: any) => [value, 'Dogs']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px' }}>
            {stats.dogsBySize.map((entry: any, index: number) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: entry.color, 
                  borderRadius: '50%' 
                }} />
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>⚡ Quick Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280' }}>Platform Health</span>
              <span style={{ 
                padding: '4px 8px', 
                backgroundColor: '#10b981', 
                color: 'white', 
                borderRadius: '12px', 
                fontSize: '0.8rem' 
              }}>
                Excellent
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280' }}>Active Rentals</span>
              <span style={{ fontWeight: 'bold', color: '#1f2937' }}>
                {stats.totalRentals}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280' }}>Pending Approvals</span>
              <span style={{ 
                fontWeight: 'bold', 
                color: stats.pendingApprovals > 0 ? '#f59e0b' : '#10b981' 
              }}>
                {stats.pendingApprovals}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280' }}>New Users (7d)</span>
              <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                {stats.recentSignups}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: `2px solid ${color}20`
  }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
      <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>{icon}</span>
      <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{title}</span>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 'bold', color, marginBottom: '5px' }}>
      {value}
    </div>
    {subtitle && (
      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
        {subtitle}
      </div>
    )}
  </div>
);

// Smart Seed Dogs Button Component with User Selection
const SmartSeedDogsButton: React.FC = () => {
  const { db, auth } = useFirebase();
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDogBatch, setSelectedDogBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);

  // Load users and available dog batches
  useEffect(() => {
    loadUsersAndBatches();
  }, []);

  const loadUsersAndBatches = async () => {
    try {
      // Get all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Get existing dogs to determine which batches are used
      const dogsSnapshot = await getDocs(collection(db, 'dogs'));
      const existingDogs = dogsSnapshot.docs.map(doc => doc.data());
      
      // Filter out only admin users (users can own multiple dog batches)
      const availableUsers = allUsers.filter((user: any) => {
        // Exclude admin users only
        if (user.role === 'admin' || user.isAdmin === true) {
          return false;
        }
        return true;
      });
      
      setUsers(availableUsers);


      
      // Define all possible batches
      const allBatches = [
        'Stanny1-10 (10 dogs)',
        'Stanny11-20 (10 dogs)', 
        'Stanny21-30 (10 dogs)',
        'Stanny31-40 (10 dogs)',
        'Stanny41-50 (10 dogs)'
      ];

      // Check which batches are already used
      const usedBatches = new Set();
      existingDogs.forEach(dog => {
        const name = dog.name;
        if (name && name.startsWith('Stanny')) {
          const num = parseInt(name.replace('Stanny', ''));
          if (num >= 1 && num <= 10) usedBatches.add('Stanny1-10 (10 dogs)');
          else if (num >= 11 && num <= 20) usedBatches.add('Stanny11-20 (10 dogs)');
          else if (num >= 21 && num <= 30) usedBatches.add('Stanny21-30 (10 dogs)');
          else if (num >= 31 && num <= 40) usedBatches.add('Stanny31-40 (10 dogs)');
          else if (num >= 41 && num <= 50) usedBatches.add('Stanny41-50 (10 dogs)');
        }
      });

      // Only show available batches
      const available = allBatches.filter(batch => !usedBatches.has(batch));
      setAvailableBatches(available);

    } catch (error) {
      console.error('Error loading users and batches:', error);
    }
  };

  // Dog data arrays
  const breeds = [
    'Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'Bulldog',
    'Poodle', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund',
    'Siberian Husky', 'Boxer', 'Border Collie', 'Chihuahua', 'Shih Tzu',
    'Boston Terrier', 'Pomeranian', 'Australian Shepherd', 'Cocker Spaniel'
  ];

  const sizes = ['small', 'medium', 'large'];
  const temperaments = ['Calm', 'Energetic', 'Playful', 'Gentle', 'Protective', 'Social', 'Independent', 'Cuddly'];
  const goodWithOptions = ['Kids', 'Other Dogs', 'Cats', 'Strangers', 'Seniors'];
  const activityLevels = ['Low', 'Medium', 'High'];
  const locations = [
    'Glen Allen, VA', 'Richmond, VA', 'Henrico, VA', 'Short Pump, VA',
    'Mechanicsville, VA', 'Ashland, VA', 'Innsbrook, VA', 'Sandston, VA'
  ];

  const descriptions = [
    "A friendly and well-trained dog who loves to play and cuddle. Great with families and other pets.",
    "This sweet pup is perfect for active families who enjoy outdoor adventures and long walks.",
    "A gentle soul who loves attention and is great with children. House-trained and obedient.",
    "An energetic companion who loves to play fetch and go on hikes. Very social and friendly."
  ];

  const dogImageUrls = [
    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop', // Golden Retriever
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop', // Husky
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop', // Beagle
    'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=300&fit=crop', // Bulldog
    'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=300&fit=crop', // Border Collie
    'https://images.unsplash.com/photo-1546975490-e8b92a360b24?w=400&h=300&fit=crop', // German Shepherd
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop', // Labrador
    'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=300&fit=crop', // Poodle
    'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=400&h=300&fit=crop', // Rottweiler
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop', // Boxer
    'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=400&h=300&fit=crop', // Chihuahua
    'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=400&h=300&fit=crop', // Shih Tzu
    'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&h=300&fit=crop', // Yorkshire Terrier
    'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=400&h=300&fit=crop', // Dachshund
    'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=300&fit=crop', // Boston Terrier
    'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=400&h=300&fit=crop', // Pomeranian
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', // Australian Shepherd
    'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop', // Cocker Spaniel
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=300&fit=crop', // Mixed breed 1
    'https://images.unsplash.com/photo-1529429617124-95b109e86bb8?w=400&h=300&fit=crop', // Mixed breed 2
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=300&fit=crop', // Mixed breed 3
    'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=400&h=300&fit=crop', // Mixed breed 4
    'https://images.unsplash.com/photo-1504595403659-9088ce801e29?w=400&h=300&fit=crop', // Mixed breed 5
    'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=300&fit=crop'  // Mixed breed 6
  ];

  const getRandomElement = (array: any[]) => array[Math.floor(Math.random() * array.length)];
  const getRandomElements = (array: any[], count: number) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const generateRandomCoordinates = () => {
    const baseLatitude = 37.6501;
    const baseLongitude = -77.5047;
    const distance = Math.random() * 20 + 5; // 5-25 miles
    const milesPerDegree = 69;
    const maxOffset = distance / milesPerDegree;
    const angle = Math.random() * 2 * Math.PI;
    const latOffset = Math.cos(angle) * maxOffset * (Math.random() * 0.8 + 0.2);
    const lngOffset = Math.sin(angle) * maxOffset * (Math.random() * 0.8 + 0.2);
    
    return {
      lat: baseLatitude + latOffset,
      lng: baseLongitude + lngOffset
    };
  };

  const seedDogs = async () => {
    if (!selectedUser || !selectedDogBatch) {
      setMessage('❌ Please select both user and dog batch');
      return;
    }

    setSeeding(true);
    setMessage('🐕 Starting to seed dog data...');

    try {
      // Parse batch range
      const batchRanges = {
        'Stanny1-10 (10 dogs)': { start: 1, end: 10 },
        'Stanny11-20 (10 dogs)': { start: 11, end: 20 },
        'Stanny21-30 (10 dogs)': { start: 21, end: 30 },
        'Stanny31-40 (10 dogs)': { start: 31, end: 40 },
        'Stanny41-50 (10 dogs)': { start: 41, end: 50 }
      };

      const range = batchRanges[selectedDogBatch as keyof typeof batchRanges];
      
      // Get the selected user data directly from database
      const userDoc = await getDoc(doc(db, 'users', selectedUser));
      const selectedUserData = userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;

      for (let i = range.start; i <= range.end; i++) {
        const coordinates = generateRandomCoordinates();
        const breed = getRandomElement(breeds);
        const size = getRandomElement(sizes);
        const temperament = getRandomElements(temperaments, Math.floor(Math.random() * 4) + 1);
        const goodWith = getRandomElements(goodWithOptions, Math.floor(Math.random() * 3) + 1);
        const activityLevel = getRandomElement(activityLevels);
        const age = Math.floor(Math.random() * 12) + 1;
        const pricePerDay = Math.floor(Math.random() * 101) + 50;
        const location = getRandomElement(locations);
        const description = getRandomElement(descriptions);
        // Use index to ensure unique images - cycle through the array
        const imageUrl = dogImageUrls[(i - 3) % dogImageUrls.length];

        const dogData = {
          name: `Stanny${i}`,
          breed: breed || 'Mixed Breed',
          age: age || 2,
          size: size || 'medium',
          description: description || 'A wonderful dog looking for adventure!',
          pricePerDay: pricePerDay || 75,
          location: location || 'Glen Allen, VA',
          coordinates: coordinates || { lat: 37.6501, lng: -77.5047 },
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
          imageUrls: [imageUrl || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop'],
          temperament: temperament && temperament.length > 0 ? temperament : ['Friendly'],
          goodWith: goodWith && goodWith.length > 0 ? goodWith : ['Kids'],
          activityLevel: activityLevel || 'Medium',
          specialNotes: `Stanny${i} is a wonderful ${(breed || 'mixed breed').toLowerCase()} who loves spending time with people!`,
          ownerId: selectedUser || 'unknown',
          ownerName: (selectedUserData as any)?.displayName || (selectedUserData as any)?.email || 'Unknown User',
          isAvailable: true,
          status: 'available',
          adminReviewed: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          averageRating: Math.round((Math.random() * 2 + 3) * 10) / 10
        };

        console.log('Creating dog:', dogData.name, 'for owner:', dogData.ownerName);

        try {
          await addDoc(collection(db, 'dogs'), dogData);
          setMessage(`✅ Added ${dogData.name} - ${dogData.breed} ($${dogData.pricePerDay}/day)`);
        } catch (error) {
          console.error('Error adding dog:', dogData.name, error);
          setMessage(`❌ Error adding ${dogData.name}: ${error}`);
          throw error; // Re-throw to stop the loop
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const dogCount = range.end - range.start + 1;
      setMessage(`🎉 Successfully seeded ${dogCount} dogs (${selectedDogBatch}) for ${selectedUserData?.displayName || selectedUserData?.email}!`);
      
      // Refresh available batches
      await loadUsersAndBatches();
      setShowModal(false);
      setTimeout(() => setMessage(''), 5000);

    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <>
      <div style={{ textAlign: 'right' }}>
        <button
          onClick={() => setShowModal(true)}
          disabled={seeding}
          style={{
            padding: '12px 24px',
            backgroundColor: seeding ? '#9ca3af' : '#FF6B35',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: seeding ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '8px'
          }}
        >
          {seeding ? '🔄 Seeding...' : '🌱 Smart Seed Dogs'}
        </button>
        {message && (
          <div style={{
            fontSize: '0.8rem',
            color: message.includes('❌') ? '#dc2626' : message.includes('✅') || message.includes('🎉') ? '#16a34a' : '#6b7280',
            marginTop: '4px',
            maxWidth: '300px',
            textAlign: 'right'
          }}>
            {message}
          </div>
        )}
      </div>

      {/* Smart Seeding Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', textAlign: 'center' }}>
              🌱 Smart Dog Seeding
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                👤 Select User (Dog Owner):
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">Choose a user...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.displayName || user.email} ({user.role || 'user'})
                  </option>
                ))}
              </select>
              {users.length === 0 && (
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                  ℹ️ No available users. Only admin users are filtered out.
                </p>
              )}
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                🐕 Select Dog Batch:
              </label>
              <select
                value={selectedDogBatch}
                onChange={(e) => setSelectedDogBatch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">Choose a batch...</option>
                {availableBatches.map(batch => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
              {availableBatches.length === 0 && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px' }}>
                  ⚠️ All dog batches have been used. Clear existing dogs to create new batches.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={seedDogs}
                disabled={!selectedUser || !selectedDogBatch || seeding}
                style={{
                  padding: '10px 20px',
                  background: (!selectedUser || !selectedDogBatch || seeding) ? '#9ca3af' : '#FF6B35',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!selectedUser || !selectedDogBatch || seeding) ? 'not-allowed' : 'pointer'
                }}
              >
                {seeding ? '🔄 Creating Dogs...' : '🌱 Create Dogs'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminOverview;