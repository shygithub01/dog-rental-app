import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';

interface SafetyCenterProps {
  adminData: any;
  onRefresh: () => void;
}

const SafetyCenter: React.FC<SafetyCenterProps> = ({ adminData, onRefresh }) => {
  const { db } = useFirebase();
  const [safetyData, setSafetyData] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    suspendedUsers: 0,
    reportedIncidents: 0,
    pendingVerifications: 0,
    trustScore: 0,
    recentIncidents: [] as any[],
    verificationQueue: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSafetyData();
  }, []);

  const fetchSafetyData = async () => {
    try {
      const [usersSnapshot, dogsSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'dogs'))
      ]);

      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const dogs = dogsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      const verifiedUsers = users.filter(user => user.isVerified).length;
      const suspendedUsers = users.filter(user => user.isSuspended).length;
      const pendingVerifications = users.filter(user => !user.isVerified && !user.isSuspended).length;
      
      // Calculate trust score (0-100)
      const trustScore = users.length > 0 ? Math.round((verifiedUsers / users.length) * 100) : 0;

      setSafetyData({
        totalUsers: users.length,
        verifiedUsers,
        suspendedUsers,
        reportedIncidents: 0, // TODO: Implement incident tracking
        pendingVerifications,
        trustScore,
        recentIncidents: [], // TODO: Fetch from incidents collection
        verificationQueue: users.filter(user => !user.isVerified && !user.isSuspended).slice(0, 10)
      });

    } catch (error) {
      console.error('Error fetching safety data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        isVerified: true,
        verifiedAt: new Date()
      });
      fetchSafetyData();
    } catch (error) {
      console.error('Error verifying user:', error);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        isSuspended: true,
        suspendedAt: new Date()
      });
      fetchSafetyData();
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading safety data...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', color: '#1f2937', margin: '0 0 10px 0' }}>
          🛡️ Safety Center
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Monitor platform safety and user verification
        </p>
      </div>

      {/* Safety Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <SafetyMetricCard
          title="Trust Score"
          value={`${safetyData.trustScore}%`}
          icon="🎯"
          color={safetyData.trustScore >= 80 ? '#10b981' : safetyData.trustScore >= 60 ? '#f59e0b' : '#ef4444'}
          subtitle={`${safetyData.verifiedUsers}/${safetyData.totalUsers} verified`}
        />
        <SafetyMetricCard
          title="Verified Users"
          value={safetyData.verifiedUsers}
          icon="✅"
          color="#10b981"
          subtitle={`${((safetyData.verifiedUsers / safetyData.totalUsers) * 100).toFixed(1)}% of total`}
        />
        <SafetyMetricCard
          title="Pending Verification"
          value={safetyData.pendingVerifications}
          icon="⏳"
          color="#f59e0b"
          subtitle="Awaiting review"
        />
        <SafetyMetricCard
          title="Suspended Users"
          value={safetyData.suspendedUsers}
          icon="🚫"
          color="#ef4444"
          subtitle="Safety violations"
        />
      </div>

      {/* Verification Queue */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>👥 Verification Queue</h3>
        
        {safetyData.verificationQueue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎉</div>
            <p>All users are verified! Great job maintaining platform safety.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={tableHeaderStyle}>User</th>
                  <th style={tableHeaderStyle}>Joined</th>
                  <th style={tableHeaderStyle}>Status</th>
                  <th style={tableHeaderStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {safetyData.verificationQueue.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: user.photoURL ? `url(${user.photoURL})` : '#f3f4f6',
                          backgroundSize: 'cover',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem'
                        }}>
                          {!user.photoURL && '👤'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>
                            {user.displayName || 'No Name'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        background: '#fef3c7',
                        color: '#92400e'
                      }}>
                        Pending
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleVerifyUser(user.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          ✓ Verify
                        </button>
                        <button
                          onClick={() => handleSuspendUser(user.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          🚫 Suspend
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safety Guidelines */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>📋 Safety Guidelines</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px'
        }}>
          <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#166534' }}>✅ Verification Criteria</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#166534', fontSize: '0.9rem' }}>
              <li>Valid email address</li>
              <li>Profile photo uploaded</li>
              <li>Phone number verified</li>
              <li>No reported violations</li>
            </ul>
          </div>
          
          <div style={{ padding: '15px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde047' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>⚠️ Warning Signs</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e', fontSize: '0.9rem' }}>
              <li>Multiple user reports</li>
              <li>Suspicious activity patterns</li>
              <li>Incomplete profile information</li>
              <li>Payment issues</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const SafetyMetricCard: React.FC<{
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

const tableHeaderStyle = {
  padding: '12px 15px',
  textAlign: 'left' as const,
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#374151'
};

const tableCellStyle = {
  padding: '12px 15px',
  fontSize: '0.9rem'
};

export default SafetyCenter;