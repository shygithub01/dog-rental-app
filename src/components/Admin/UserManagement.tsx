import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';

interface UserManagementProps {
  adminData: any;
  onRefresh: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ adminData, onRefresh }) => {
  const { db } = useFirebase();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus]);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        lastActive: doc.data().lastActive?.toDate()
      }));
      
      // Sort by creation date (newest first)
      usersData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => {
        switch (filterStatus) {
          case 'verified': return user.isVerified;
          case 'suspended': return user.isSuspended;
          case 'admin': return user.role === 'admin';
          case 'active': return isActiveUser(user);
          default: return true;
        }
      });
    }

    setFilteredUsers(filtered);
  };

  const isActiveUser = (user: any) => {
    if (!user.lastActive) return false;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return user.lastActive > thirtyDaysAgo;
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      
      switch (action) {
        case 'verify':
          await updateDoc(userRef, { isVerified: true });
          break;
        case 'suspend':
          await updateDoc(userRef, { isSuspended: true });
          break;
        case 'unsuspend':
          await updateDoc(userRef, { isSuspended: false });
          break;
        case 'makeAdmin':
          if (window.confirm('Make this user an admin?')) {
            await updateDoc(userRef, { role: 'admin', isAdmin: true });
          }
          break;
      }
      
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading users...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', color: '#1f2937', margin: '0 0 10px 0' }}>
          👥 User Management
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Manage user accounts, verification, and permissions
        </p>
      </div>

      {/* Filters and Search */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          >
            <option value="all">All Users</option>
            <option value="active">Active (30d)</option>
            <option value="verified">Verified</option>
            <option value="suspended">Suspended</option>
            <option value="admin">Admins</option>
          </select>
          
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          overflowX: 'auto',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
              <tr>
                <th style={tableHeaderStyle}>User</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Role</th>
                <th style={tableHeaderStyle}>Joined</th>
                <th style={tableHeaderStyle}>Last Active</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: user.photoURL ? `url(${user.photoURL})` : '#f3f4f6',
                        backgroundSize: 'cover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem'
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
                    <StatusBadge user={user} />
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      background: user.role === 'admin' ? '#fef3c7' : '#f3f4f6',
                      color: user.role === 'admin' ? '#92400e' : '#374151'
                    }}>
                      {user.role || 'User'}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    {user.createdAt ? user.createdAt.toLocaleDateString() : 'Unknown'}
                  </td>
                  <td style={tableCellStyle}>
                    {user.lastActive ? user.lastActive.toLocaleDateString() : 'Never'}
                  </td>
                  <td style={tableCellStyle}>
                    <UserActions user={user} onAction={handleUserAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ user: any }> = ({ user }) => {
  if (user.isSuspended) {
    return <span style={{ ...badgeStyle, background: '#fef2f2', color: '#dc2626' }}>Suspended</span>;
  }
  if (user.isVerified) {
    return <span style={{ ...badgeStyle, background: '#f0fdf4', color: '#16a34a' }}>Verified</span>;
  }
  return <span style={{ ...badgeStyle, background: '#fef3c7', color: '#d97706' }}>Pending</span>;
};

const UserActions: React.FC<{ user: any; onAction: (id: string, action: string) => void }> = ({ user, onAction }) => (
  <div style={{ display: 'flex', gap: '5px' }}>
    {!user.isVerified && (
      <button
        onClick={() => onAction(user.id, 'verify')}
        style={{ ...actionButtonStyle, background: '#10b981' }}
        title="Verify User"
      >
        ✓
      </button>
    )}
    {user.isSuspended ? (
      <button
        onClick={() => onAction(user.id, 'unsuspend')}
        style={{ ...actionButtonStyle, background: '#f59e0b' }}
        title="Unsuspend User"
      >
        ↻
      </button>
    ) : (
      <button
        onClick={() => onAction(user.id, 'suspend')}
        style={{ ...actionButtonStyle, background: '#ef4444' }}
        title="Suspend User"
      >
        ⏸
      </button>
    )}
    {user.role !== 'admin' && (
      <button
        onClick={() => onAction(user.id, 'makeAdmin')}
        style={{ ...actionButtonStyle, background: '#8b5cf6' }}
        title="Make Admin"
      >
        👑
      </button>
    )}
  </div>
);

const tableHeaderStyle = {
  padding: '12px 15px',
  textAlign: 'left' as const,
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#374151',
  borderBottom: '2px solid #e5e7eb'
};

const tableCellStyle = {
  padding: '12px 15px',
  fontSize: '0.9rem'
};

const badgeStyle = {
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '0.8rem',
  fontWeight: '500'
};

const actionButtonStyle = {
  width: '30px',
  height: '30px',
  borderRadius: '6px',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  fontSize: '0.8rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default UserManagement;