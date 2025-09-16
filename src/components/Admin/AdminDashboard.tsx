import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';
// import VerificationProgress from './VerificationProgress';
import { VerificationService } from '../../services/verificationService';

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
  const [isResetting, setIsResetting] = useState(false);
  const [userSafetyStatus, setUserSafetyStatus] = useState<{[key: string]: boolean}>({});
  const [verificationService] = useState(() => new VerificationService(db));
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);
  
  // Remove auto-verification to prevent loops
  // Admin verification now happens only when manually triggered

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

      // Don't auto-load safety status or verification scores
      // Let users manually trigger these operations
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh verification score for a specific user
  const handleRefreshVerificationScore = async (userId: string) => {
    try {
      const verificationScore = await verificationService.calculateVerificationScore(userId);
      
      // Update local users state with new verification score
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, verificationScore }
            : user
        )
      );
      
      console.log(`✅ Verification score refreshed for user ${userId}:`, verificationScore);
    } catch (error) {
      console.error('Error refreshing verification score:', error);
      alert('Error refreshing verification score: ' + error);
    }
  };

  const handleUserAction = async (userId: string, action: 'verify' | 'suspend' | 'delete') => {
    try {
      // Get the user being acted upon
      const targetUser = users.find(u => u.id === userId);
      
      // Protect admin accounts from dangerous actions
      if (targetUser && targetUser.role === 'admin') {
        if (action === 'delete' || action === 'suspend') {
          alert('🛡️ Cannot perform this action on admin accounts. Admin accounts are protected for system security.');
          return;
        }
      }
      
      if (action === 'delete') {
        // Check if user can be safely deleted
        const canDelete = await checkUserDeletionSafety(userId);
        if (!canDelete) {
          alert('❌ Cannot delete this user. They have transaction history (dogs, rentals, messages, etc.) that must be preserved.');
          return;
        }
        
        // Double confirmation for deletion
        if (!window.confirm(`⚠️ Are you sure you want to delete this user?\n\nThis action cannot be undone.`)) {
          return;
        }
      }

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
          console.log(`✅ User ${userId} deleted successfully`);
          break;
      }
      
      // Refresh data
      fetchAdminData();
    } catch (error) {
      console.error(`Error performing ${action} on user:`, error);
      alert(`Error performing ${action} on user: ${error}`);
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

  const resetAllData = async () => {
    if (!window.confirm('⚠️ WARNING: This will DELETE ALL DATA from the entire system!\n\nThis action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    if (!window.confirm('🚨 FINAL WARNING: This will permanently delete:\n\n• All users\n• All dogs\n• All rentals\n• All rental requests\n• All messages\n• All notifications\n• All other data\n\nType "YES" to confirm:')) {
      return;
    }

    const confirmation = prompt('Type "YES" to confirm complete data deletion:');
    if (confirmation !== 'YES') {
      alert('Data reset cancelled.');
      return;
    }

    setIsResetting(true);
    console.log('🗑️ Starting COMPLETE data reset...');

    try {
      let totalDeleted = 0;
      const collectionsToDelete = [
        'notifications', 'messages', 'rentalRequests', 'rentals', 'dogs', 'users',
        'reviews', 'payments', 'bookmarks', 'favorites', 'reports', 'favorites',
        'userFavorites', 'dogFavorites', 'rentalHistory', 'userHistory'
      ];

      // Delete collections one by one to ensure complete cleanup
      for (const collectionName of collectionsToDelete) {
        try {
          console.log(`🗑️ Deleting collection: ${collectionName}`);
          const snapshot = await getDocs(collection(db, collectionName));
          
          if (!snapshot.empty) {
            // Use individual deletes for more reliable cleanup
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            
            totalDeleted += snapshot.docs.length;
            console.log(`✅ Deleted ${snapshot.docs.length} documents from ${collectionName}`);
          } else {
            console.log(`ℹ️ Collection ${collectionName} is already empty`);
          }
        } catch (error) {
          console.log(`ℹ️ Could not access collection ${collectionName}:`, error);
        }
      }

      // Additional cleanup - try to delete any other collections that might exist
      console.log('🔍 Performing additional cleanup...');
      
      // Force clear any cached data
      try {
        // Clear any local storage or session storage
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Cleared local storage and session storage');
      } catch (error) {
        console.log('ℹ️ Could not clear local storage:', error);
      }

      console.log(`🎉 COMPLETE DATA RESET SUCCESSFUL!`);
      console.log(`📊 Total documents deleted: ${totalDeleted}`);
      
      // Clear local state
      setUsers([]);
      setDogs([]);
      setRentals([]);
      setAdminStats({
        totalUsers: 0,
        totalDogs: 0,
        totalRentals: 0,
        totalEarnings: 0,
        pendingApprovals: 0,
        activeRentals: 0
      });

      // Show success message
      alert(`🎉 COMPLETE data reset successful!\n\nTotal documents deleted: ${totalDeleted}\n\nAll data has been permanently removed from the system.\n\nPlease refresh the page completely.`);

      // Force complete page refresh to clear all React state
      console.log('🔄 Forcing complete page refresh...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('❌ Error during data reset:', error);
      alert(`❌ Error during data reset: ${error}\n\nPlease check the console for details.`);
    } finally {
      setIsResetting(false);
    }
  };

  const checkUserDeletionSafety = async (userId: string): Promise<boolean> => {
    try {
      console.log(`🔍 Checking deletion safety for user: ${userId}`);
      
      // Check if user owns any dogs
      const userDogs = dogs.filter(dog => dog.ownerId === userId);
      if (userDogs.length > 0) {
        console.log(`🚫 User ${userId} owns ${userDogs.length} dogs - cannot delete`);
        return false;
      }
      
      // Check if user has any rental history (as renter or owner)
      const userRentals = rentals.filter(rental => 
        rental.renterId === userId || 
        rental.userId === userId || 
        rental.uid === userId || 
        rental.user === userId || 
        rental.renter === userId || 
        rental.dogOwnerId === userId || 
        rental.ownerId === userId
      );
      
      if (userRentals.length > 0) {
        console.log(`🚫 User ${userId} has ${userRentals.length} rental records - cannot delete`);
        return false;
      }
      
      // Check if user has any pending rental requests
      try {
        const rentalRequestsSnapshot = await getDocs(collection(db, 'rentalRequests'));
        const userRequests = rentalRequestsSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.renterId === userId || data.userId === userId || data.uid === userId;
        });
        
        if (userRequests.length > 0) {
          console.log(`🚫 User ${userId} has ${userRequests.length} pending requests - cannot delete`);
          return false;
        }
      } catch (error) {
        console.log('ℹ️ Could not check rental requests:', error);
      }
      
      // Check if user has any messages
      try {
        const messagesSnapshot = await getDocs(collection(db, 'messages'));
        const userMessages = messagesSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.senderId === userId || data.receiverId === userId || data.userId === userId;
        });
        
        if (userMessages.length > 0) {
          console.log(`🚫 User ${userId} has ${userMessages.length} messages - cannot delete`);
          return false;
        }
      } catch (error) {
        console.log('ℹ️ Could not check messages:', error);
      }
      
      // Check if user has any notifications
      try {
        const notificationsSnapshot = await getDocs(collection(db, 'notifications'));
        const userNotifications = notificationsSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.userId === userId || data.recipientId === userId || data.uid === userId;
        });
        
        if (userNotifications.length > 0) {
          console.log(`🚫 User ${userId} has ${userNotifications.length} notifications - cannot delete`);
          return false;
        }
      } catch (error) {
        console.log('ℹ️ Could not check notifications:', error);
      }
      
      // Check if user has any reviews
      try {
        const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
        const userReviews = reviewsSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.reviewerId === userId || data.revieweeId === userId || data.userId === userId;
        });
        
        if (userReviews.length > 0) {
          console.log(`🚫 User ${userId} has ${userReviews.length} reviews - cannot delete`);
          return false;
        }
      } catch (error) {
        console.log('ℹ️ Could not check reviews:', error);
      }
      
      // Check if user has any payments
      try {
        const paymentsSnapshot = await getDocs(collection(db, 'payments'));
        const userPayments = paymentsSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.payerId === userId || data.payeeId === userId || data.userId === userId;
        });
        
        if (userPayments.length > 0) {
          console.log(`🚫 User ${userId} has ${userPayments.length} payments - cannot delete`);
          return false;
        }
      } catch (error) {
        console.log('ℹ️ Could not check payments:', error);
      }
      
      // Check if user has any favorites/bookmarks
      try {
        const favoritesSnapshot = await getDocs(collection(db, 'favorites'));
        const userFavorites = favoritesSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.userId === userId || data.ownerId === userId;
        });
        
        if (userFavorites.length > 0) {
          console.log(`🚫 User ${userId} has ${userFavorites.length} favorites - cannot delete`);
          return false;
        }
      } catch (error) {
        console.log('ℹ️ Could not check favorites:', error);
      }
      
      console.log(`✅ User ${userId} is safe to delete - no transaction history found`);
      return true;
    } catch (error) {
      console.error(`❌ Error checking user deletion safety for ${userId}:`, error);
      // If we can't determine safety, assume unsafe
      return false;
    }
  };

  // Calculate verification scores for all users
  const calculateAllVerificationScores = async () => {
    if (isVerifying) {
      console.log('⏳ Verification already in progress...');
      return;
    }
    
    setIsVerifying(true);
    console.log('📊 Starting verification score calculation for all users...');
    
    try {
      for (const user of users) {
        try {
          const verificationScore = await verificationService.calculateVerificationScore(user.id);
          
          // Update local users state
          setUsers(prevUsers => 
            prevUsers.map(u => 
              u.id === user.id 
                ? { ...u, verificationScore }
                : u
            )
          );
          
          console.log(`✅ Verification score calculated for ${user.displayName || user.email}: ${verificationScore.percentage}%`);
        } catch (error) {
          console.error(`❌ Error calculating verification score for user ${user.id}:`, error);
        }
      }
      
      console.log('🎉 All verification scores calculated successfully!');
    } catch (error) {
      console.error('❌ Error in bulk verification score calculation:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const updateAllUserSafetyStatus = async () => {
    console.log('🔄 Starting safety status update for all users...');
    const safetyStatus: {[key: string]: boolean} = {};
    
    for (const user of users) {
      console.log(`🔍 Checking safety for user: ${user.displayName || user.email} (${user.id})`);
      const isSafe = await checkUserDeletionSafety(user.id);
      safetyStatus[user.id] = isSafe;
      console.log(`✅ User ${user.displayName || user.email}: ${isSafe ? 'SAFE' : 'UNSAFE'} to delete`);
    }
    
    console.log('📊 Final safety status:', safetyStatus);
    setUserSafetyStatus(safetyStatus);
  };

  const getDetailedSafetyInfo = async (userId: string): Promise<string> => {
    try {
      let reasons: string[] = [];
      
      // Check dogs
      const userDogs = dogs.filter(dog => dog.ownerId === userId);
      if (userDogs.length > 0) {
        reasons.push(`Owns ${userDogs.length} dog(s): ${userDogs.map(d => d.name).join(', ')}`);
      }
      
      // Check rentals
      const userRentals = rentals.filter(rental => 
        rental.renterId === userId || 
        rental.userId === userId || 
        rental.uid === userId || 
        rental.user === userId || 
        rental.renter === userId || 
        rental.dogOwnerId === userId || 
        rental.ownerId === userId
      );
      if (userRentals.length > 0) {
        reasons.push(`Has ${userRentals.length} rental record(s)`);
      }
      
      // Check rental requests
      try {
        const rentalRequestsSnapshot = await getDocs(collection(db, 'rentalRequests'));
        const userRequests = rentalRequestsSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.renterId === userId || data.userId === userId || data.uid === userId;
        });
        if (userRequests.length > 0) {
          reasons.push(`Has ${userRequests.length} pending rental request(s)`);
        }
      } catch (error) {
        // Ignore errors for this check
      }
      
      // Check messages
      try {
        const messagesSnapshot = await getDocs(collection(db, 'messages'));
        const userMessages = messagesSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.senderId === userId || data.receiverId === userId || data.userId === userId;
        });
        if (userMessages.length > 0) {
          reasons.push(`Has ${userMessages.length} message(s)`);
        }
      } catch (error) {
        // Ignore errors for this check
      }
      
      if (reasons.length === 0) {
        return "✅ Safe to delete - no transaction history";
      }
      
      return `❌ Cannot delete:\n${reasons.join('\n')}`;
    } catch (error) {
      return "❓ Unable to determine safety status";
    }
  };

  const fixDogStatuses = async () => {
    if (!window.confirm('🔧 Fix all dog statuses to "available"?\n\nThis will reset any dogs with incorrect status from before the data reset.')) {
      return;
    }

    try {
      console.log('🔧 Starting dog status fix...');
      const batch = writeBatch(db);
      let fixedCount = 0;

      // Get all dogs
      const dogsSnapshot = await getDocs(collection(db, 'dogs'));
      
      dogsSnapshot.docs.forEach(doc => {
        const dogData = doc.data();
        // Fix any dogs that don't have proper status or have wrong status
        if (dogData.status !== 'available' || !dogData.isAvailable) {
          batch.update(doc.ref, {
            status: 'available',
            isAvailable: true
          });
          fixedCount++;
          console.log(`🔧 Fixed dog: ${dogData.name} (${doc.id})`);
        }
      });

      if (fixedCount > 0) {
        await batch.commit();
        console.log(`✅ Fixed ${fixedCount} dog statuses`);
        alert(`🔧 Fixed ${fixedCount} dog statuses to "available"`);
        
        // Refresh the data
        fetchAdminData();
      } else {
        console.log('ℹ️ No dog statuses needed fixing');
        alert('ℹ️ All dog statuses are already correct');
      }
    } catch (error) {
      console.error('❌ Error fixing dog statuses:', error);
      alert(`❌ Error fixing dog statuses: ${error}`);
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
                background: activeTab === tab.key ? '#6A32B0' : 'transparent',
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
                background: 'linear-gradient(135deg, #8A52D0 0%, #6A32B0 100%)',
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
            
            {/* Reset All Data Button */}
            <div style={{
              background: '#fff5f5',
              border: '2px solid #fed7d7',
              borderRadius: '15px',
              padding: '25px',
              marginTop: '30px',
              textAlign: 'center'
            }}>
              <h3 style={{
                color: '#c53030',
                margin: '0 0 15px 0',
                fontSize: '1.3rem'
              }}>
                🗑️ Development Data Reset
              </h3>
              <p style={{
                color: '#744210',
                margin: '0 0 20px 0',
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                <strong>⚠️ WARNING:</strong> This will permanently delete ALL data from the entire system.<br/>
                Use only for development/testing purposes. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={resetAllData}
                  disabled={isResetting}
                  style={{
                    padding: '15px 30px',
                    backgroundColor: isResetting ? '#cbd5e0' : '#e53e3e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: isResetting ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isResetting) {
                      e.currentTarget.style.backgroundColor = '#c53030';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isResetting) {
                      e.currentTarget.style.backgroundColor = isResetting ? '#cbd5e0' : '#e53e3e';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isResetting ? '🔄 Resetting...' : '🗑️ Reset All Data (Dev)'}
                </button>
                
                <button
                  onClick={fixDogStatuses}
                  style={{
                    padding: '15px 30px',
                    backgroundColor: '#6A32B0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#8A52D0';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#6A32B0';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  🔧 Fix Dog Statuses
                </button>

                <button
                  onClick={() => {
                    const commands = `
🔥 NUCLEAR OPTION - Firebase Console Commands 🔥

If the reset button above doesn't work, use these commands in Firebase Console:

1. Go to Firebase Console > Firestore Database
2. Click on each collection and delete ALL documents manually
3. Collections to clear:
   - users
   - dogs  
   - rentals
   - rentalRequests
   - messages
   - notifications
   - reviews
   - payments
   - bookmarks
   - favorites
   - reports

4. Or use Firebase CLI (if you have it):
   firebase firestore:delete --all-collections --force

5. After clearing, refresh this page completely
                    `;
                    alert(commands);
                  }}
                  style={{
                    padding: '15px 30px',
                    backgroundColor: '#9f7a0a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#744210';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#9f7a0a';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  ☢️ Nuclear Option
                </button>
              </div>
              {isResetting && (
                <div style={{
                  marginTop: '15px',
                  color: '#744210',
                  fontSize: '0.9rem'
                }}>
                  Please wait while all data is being deleted...
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#2d3748' }}>User Management</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={updateAllUserSafetyStatus}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6A32B0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  title="Refresh safety status for all users"
                >
                  🔄 Refresh Safety Status
                </button>
                
                  <button
                    onClick={calculateAllVerificationScores}
                    disabled={isVerifying}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isVerifying ? '#cbd5e0' : '#6A32B0',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isVerifying ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      opacity: isVerifying ? 0.7 : 1
                    }}
                    title="🤖 AI-Powered Verification: Analyzes photos, documents, behavior patterns, and more"
                  >
                    {isVerifying ? '⏳ Verifying...' : '🤖 Verify All Users'}
                  </button>
              </div>
            </div>
            
            {/* AI Verification System Info */}
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f0fff4',
              border: '1px solid #9ae6b4',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#22543d' }}>
                🤖 AI-Powered Verification System
              </h4>
              <div style={{ color: '#2f855a', lineHeight: '1.6' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>🔐 Admin Users:</strong> Automatically verified with 100% score
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>📸 Photo Analysis:</strong> Face detection, quality check, inappropriate content detection
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>📄 Document Verification:</strong> OCR text extraction, authenticity check, fraud detection
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>📧 Email/Phone:</strong> Domain reputation, carrier validation, disposable email detection
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>🧠 Behavioral Analysis:</strong> Pattern recognition, risk assessment, activity consistency
                </p>
              </div>
            </div>
            
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
                    <div style={{ marginTop: '5px', fontSize: '11px', color: '#718096' }}>
                      Safety Status: {userSafetyStatus[user.id] === undefined ? '⏳ Loading...' : 
                                    userSafetyStatus[user.id] === true ? '✅ Safe to delete' : '❌ Unsafe to delete'}
                    </div>
                    
                    {/* Verification Progress - Temporarily disabled */}
                    {/* <div style={{ marginTop: '10px' }}>
                      <VerificationProgress 
                        user={user}
                        verificationScore={user.verificationScore || null}
                        onRefreshScore={() => handleRefreshVerificationScore(user.id)}
                      />
                    </div> */}
                    {userSafetyStatus[user.id] === false && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        backgroundColor: '#fed7d7',
                        border: '1px solid #feb2b2',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#c53030',
                        cursor: 'pointer'
                      }}
                      onClick={async () => {
                        const info = await getDetailedSafetyInfo(user.id);
                        alert(`🔍 Safety Check Details for ${user.displayName || user.email}:\n\n${info}`);
                      }}
                      title="Click to see detailed safety information"
                      >
                        ⚠️ Has transaction history - click for details
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Show verification status with category breakdown */}
                    {user.verificationScore ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Overall Score */}
                        <div style={{
                          padding: '8px 16px',
                          backgroundColor: user.verificationScore.percentage >= 80 ? '#6A32B0' : 
                                         user.verificationScore.percentage >= 60 ? '#ed8936' : '#e53e3e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          {user.verificationScore.percentage}% Verified
                        </div>
                        
                        {/* Category Breakdown */}
                        <div style={{
                          padding: '10px',
                          backgroundColor: '#f7fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '10px',
                          maxWidth: '220px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ 
                            fontWeight: 'bold', 
                            marginBottom: '6px', 
                            color: '#2d3748',
                            fontSize: '11px',
                            textAlign: 'center',
                            paddingBottom: '4px',
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                            📊 Verification Breakdown
                          </div>
                          {(() => {
                            // Define logical order for categories
                            const categoryOrder = [
                              'email',
                              'phone', 
                              'photo',
                              'basicInfo',
                              'idDocument',
                              'address',
                              'activity',
                              'reviews'
                            ];
                            
                            // Sort categories in logical order
                            return categoryOrder.map(category => {
                              const data = user.verificationScore.breakdown[category];
                              if (!data) return null;
                              
                              const isMaxScore = data.score === data.maxScore;
                              const categoryName = category === 'basicInfo' ? 'Basic Info' : 
                                                 category === 'idDocument' ? 'ID Document' : 
                                                 category.charAt(0).toUpperCase() + category.slice(1);
                              
                              return (
                                <div key={category} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '3px',
                                  padding: '2px 4px',
                                  borderRadius: '3px',
                                  backgroundColor: isMaxScore ? '#f0fff4' : '#fff5f5',
                                  border: `1px solid ${isMaxScore ? '#9ae6b4' : '#fed7d7'}`
                                }}>
                                  <span style={{ 
                                    color: isMaxScore ? '#6A32B0' : '#e53e3e',
                                    fontWeight: isMaxScore ? 'bold' : 'normal',
                                    fontSize: '9px'
                                  }}>
                                    {isMaxScore ? '✅' : '❌'} {categoryName}
                                  </span>
                                  <span style={{ 
                                    fontWeight: 'bold',
                                    color: isMaxScore ? '#6A32B0' : '#e53e3e',
                                    fontSize: '9px'
                                  }}>
                                    {data.score}/{data.maxScore}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: '8px 16px',
                        backgroundColor: '#6A32B0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        textAlign: 'center'
                      }}>
                        Calculating...
                      </div>
                    )}
                    
                    {/* Protect admin accounts from suspension */}
                    {user.role !== 'admin' && (
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
                    )}
                    
                    {/* Protect admin accounts from deletion */}
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleUserAction(user.id, 'delete')}
                        disabled={userSafetyStatus[user.id] === false}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: userSafetyStatus[user.id] === false ? '#cbd5e0' : '#e53e3e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: userSafetyStatus[user.id] === false ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          opacity: userSafetyStatus[user.id] === false ? 0.6 : 1
                        }}
                      >
                        {userSafetyStatus[user.id] === false ? '🚫 Cannot Delete' : 'Delete'}
                      </button>
                    )}
                    
                    {/* Show admin protection message */}
                    {user.role === 'admin' && (
                      <div style={{
                        padding: '8px 16px',
                        backgroundColor: '#6A32B0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        🛡️ Admin Protected
                      </div>
                    )}
                    
                    {/* Show admin auto-verification status */}
                    {user.role === 'admin' && user.verificationScore && (
                      <div style={{
                        padding: '8px 16px',
                        backgroundColor: '#6A32B0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        🤖 AI Auto-Verified
                      </div>
                    )}
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
                        backgroundColor: '#6A32B0',
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
                  <div style={{ fontSize: '2rem', color: '#6A32B0', marginBottom: '10px' }}>
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
                  <div style={{ fontSize: '2rem', color: '#6A32B0', marginBottom: '10px' }}>
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
