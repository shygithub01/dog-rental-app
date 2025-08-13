import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';

interface AdminDashboardProps {
  onClose: () => void;
}

interface AdminStats {
  totalUsers: number;
  totalDogs: number;
  totalRentals: number;
  totalEarnings: number;
  pendingApprovals: number;
  activeRentals: number;
}

interface RentalData {
  id: string;
  totalCost?: number;
  status?: string;
  [key: string]: any;
}

interface DogData {
  id: string;
  status?: string;
  [key: string]: any;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { db } = useFirebase();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'analytics'>('overview');
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDogs: 0,
    totalRentals: 0,
    totalEarnings: 0,
    pendingApprovals: 0,
    activeRentals: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [dogs, setDogs] = useState<DogData[]>([]);
  const [rentals, setRentals] = useState<RentalData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);

      // Fetch all rentals
      const rentalsSnapshot = await getDocs(collection(db, 'rentals'));
      const rentalsData = rentalsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as RentalData[];
      setRentals(rentalsData);

      // Fetch all dogs
      const dogsSnapshot = await getDocs(collection(db, 'dogs'));
      const dogsData = dogsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as DogData[];
      setDogs(dogsData);

      // Calculate admin stats
      const stats: AdminStats = {
        totalUsers: usersData.length,
        totalDogs: dogsData.length,
        totalRentals: rentalsData.length,
        totalEarnings: rentalsData.reduce((sum, rental) => sum + (rental.totalCost || 0), 0),
        pendingApprovals: dogsData.filter(dog => dog.status === 'pending').length,
        activeRentals: rentalsData.filter(rental => rental.status === 'active').length
      };
      setAdminStats(stats);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'verify' | 'suspend' | 'delete') => {
    try {
      const userRef = doc(db, 'users', userId);
      
      switch (action) {
        case 'verify':
          await updateDoc(userRef, { isVerified: true });
          break;
        case 'suspend':
          await updateDoc(userRef, { isSuspended: true });
          break;
        case 'delete':
          await deleteDoc(userRef);
          break;
      }
      
      // Refresh data
      fetchAdminData();
    } catch (error) {
      console.error(`Error performing ${action} on user:`, error);
    }
  };

  const handleDogApproval = async (dogId: string, approved: boolean) => {
    try {
      const dogRef = doc(db, 'dogs', dogId);
      await updateDoc(dogRef, { 
        status: approved ? 'available' : 'rejected',
        adminReviewed: true,
        reviewedAt: new Date()
      });
      
      // Refresh data
      fetchAdminData();
    } catch (error) {
      console.error('Error updating dog approval:', error);
    }
  };

  if (loading) {
    return (
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
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⏳</div>
          <p>Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
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
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '1200px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#2d3748',
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }}>
            🛠️ Admin Dashboard
          </h1>
          <p style={{
            color: '#4a5568',
            fontSize: '1.1rem',
            margin: 0
          }}>
            System administration and management
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          borderBottom: '2px solid #e2e8f0'
        }}>
          {[
            { key: 'overview', label: '📊 Overview', icon: '📊' },
            { key: 'users', label: '👥 Users', icon: '👥' },
            { key: 'content', label: '📝 Content', icon: '📝' },
            { key: 'analytics', label: '📈 Analytics', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '12px 20px',
                background: activeTab === tab.key ? '#4299e1' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#4a5568',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ marginBottom: '20px', color: '#2d3748' }}>System Overview</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  {adminStats.totalUsers}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Users</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  {adminStats.totalDogs}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Dogs</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  {adminStats.totalRentals}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Rentals</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${adminStats.totalEarnings}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Earnings</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 style={{ marginBottom: '20px', color: '#2d3748' }}>User Management</h2>
            <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '15px' }}>
              {users.map(user => (
                <div key={user.id} style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '10px',
                  marginBottom: '15px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#2d3748' }}>
                      {user.displayName || user.email}
                    </h3>
                    <p style={{ margin: '0 0 5px 0', color: '#4a5568', fontSize: '14px' }}>
                      Role: {user.role || 'renter'}
                    </p>
                    <p style={{ margin: 0, color: '#718096', fontSize: '12px' }}>
                      {user.email}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {!user.isVerified && (
                      <button
                        onClick={() => handleUserAction(user.id, 'verify')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#48bb78',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => handleUserAction(user.id, 'suspend')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ed8936',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Suspend
                    </button>
                    <button
                      onClick={() => handleUserAction(user.id, 'delete')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#e53e3e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <h2 style={{ marginBottom: '20px', color: '#2d3748' }}>Content Moderation</h2>
            <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '15px' }}>
              {dogs.filter(dog => dog.status === 'pending').map(dog => (
                <div key={dog.id} style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '10px',
                  marginBottom: '15px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>
                    {dog.name} ({dog.breed})
                  </h3>
                  <p style={{ margin: '0 0 10px 0', color: '#4a5568' }}>
                    Owner: {dog.ownerName || 'Unknown'}
                  </p>
                  <p style={{ margin: '0 0 15px 0', color: '#718096', fontSize: '14px' }}>
                    {dog.description || 'No description provided'}
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleDogApproval(dog.id, true)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#48bb78',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleDogApproval(dog.id, false)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#e53e3e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
              {dogs.filter(dog => dog.status === 'pending').length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#4a5568' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>✅</div>
                  <p>No pending dog approvals</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 style={{ marginBottom: '20px', color: '#2d3748' }}>System Analytics</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              <div style={{
                background: '#f7fafc',
                padding: '20px',
                borderRadius: '15px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>User Growth</h3>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '2rem', color: '#4299e1', marginBottom: '10px' }}>
                    📈
                  </div>
                  <p style={{ color: '#4a5568' }}>User analytics coming soon</p>
                </div>
              </div>
              <div style={{
                background: '#f7fafc',
                padding: '20px',
                borderRadius: '15px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>Rental Trends</h3>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '2rem', color: '#48bb78', marginBottom: '10px' }}>
                    📊
                  </div>
                  <p style={{ color: '#4a5568' }}>Rental analytics coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
