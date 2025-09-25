import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';
import AdminOverview from './AdminOverview';
import FinancialDashboard from './FinancialDashboard';
import UserManagement from './UserManagement';
import ContentModeration from './ContentModeration';
import SafetyCenter from './SafetyCenter';

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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { db } = useFirebase();
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'users' | 'content' | 'safety'>('overview');
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDogs: 0,
    totalRentals: 0,
    totalEarnings: 0,
    pendingApprovals: 0,
    activeRentals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch all collections for stats
      const [users, dogs, rentals] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'dogs')),
        getDocs(collection(db, 'rentals'))
      ]);

      const usersData = users.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const dogsData = dogs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const rentalsData = rentals.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate stats
      const stats: AdminStats = {
        totalUsers: usersData.length,
        totalDogs: dogsData.length,
        totalRentals: rentalsData.length,
        totalEarnings: rentalsData.reduce((sum: number, rental: any) => sum + (rental.totalCost || 0), 0),
        pendingApprovals: dogsData.filter((dog: any) => dog.status === 'pending').length,
        activeRentals: rentalsData.filter((rental: any) => rental.status === 'active').length
      };
      
      setAdminStats(stats);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
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
          <p>Loading enterprise admin dashboard...</p>
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
        maxWidth: '1400px',
        width: '95%',
        maxHeight: '95vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={() => {
            console.log('Admin dashboard close button clicked');
            if (onClose) {
              onClose();
            }
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#f3f4f6',
            border: '2px solid #e5e7eb',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#374151';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
          title="Close Admin Dashboard"
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#1f2937',
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }}>
            🚀 Enterprise Admin Dashboard
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '1.1rem',
            margin: 0
          }}>
            Advanced analytics, financial tracking, and system management
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          borderBottom: '2px solid #e5e7eb',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {[
            { key: 'overview', label: '📊 Analytics Overview' },
            { key: 'financial', label: '💰 Financial Dashboard' },
            { key: 'users', label: '👥 User Management' },
            { key: 'content', label: '📝 Content Moderation' },
            { key: 'safety', label: '🛡️ Safety Center' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '12px 20px',
                background: activeTab === tab.key ? '#FF6B35' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#4a5568',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === tab.key ? '0 2px 4px rgba(255, 107, 53, 0.3)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '500px' }}>
          {activeTab === 'overview' && (
            <AdminOverview 
              adminData={adminStats} 
              onRefresh={fetchAdminData}
            />
          )}

          {activeTab === 'financial' && (
            <FinancialDashboard 
              adminData={adminStats} 
              onRefresh={fetchAdminData}
            />
          )}

          {activeTab === 'users' && (
            <UserManagement 
              adminData={adminStats} 
              onRefresh={fetchAdminData}
            />
          )}

          {activeTab === 'content' && (
            <ContentModeration 
              adminData={adminStats} 
              onRefresh={fetchAdminData}
            />
          )}

          {activeTab === 'safety' && (
            <SafetyCenter 
              adminData={adminStats} 
              onRefresh={fetchAdminData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;