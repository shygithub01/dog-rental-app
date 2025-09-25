import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
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
        <h1 style={{ fontSize: '2rem', color: '#1f2937', margin: '0 0 10px 0' }}>
          📊 System Overview
        </h1>
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

export default AdminOverview;