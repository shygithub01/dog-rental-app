import { useState, useEffect } from 'react'
import './App.css'
import { FirebaseProvider } from './contexts/FirebaseContext'
import { useFirebase } from './contexts/FirebaseContext'
import AddDogForm from './components/Dogs/AddDogForm'
import DogCard from './components/Dogs/DogCard'
import EditDogForm from './components/Dogs/EditDogForm'
import RentalRequestForm from './components/Rentals/RentalRequestForm'
import RentalApprovalPanel from './components/Rentals/RentalApprovalPanel'
import RenterPendingRequests from './components/Rentals/RenterPendingRequests'
import NotificationBell from './components/Notifications/NotificationBell'
import UserProfile from './components/User/UserProfile'
import FavoritesModal from './components/User/FavoritesModal'
import MessagingCenter from './components/Messaging/MessagingCenter'
import MapsView from './components/Maps/MapsView'
import OwnerDashboard from './components/Dashboard/OwnerDashboard'
import RenterDashboard from './components/Dashboard/RenterDashboard'
import HybridDashboard from './components/Dashboard/HybridDashboard'
import AdminDashboard from './components/Admin/AdminDashboard'
import { cleanupOrphanedData } from './utils/dataCleanup'
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useNotificationService } from './services/notificationService'
import { useUserService } from './services/userService'
import { useMessageService } from './services/messageService'

function AppContent() {
  const [user, setUser] = useState<any>(null)
  const [showAddDog, setShowAddDog] = useState(false)
  const [showEditDog, setShowEditDog] = useState(false)
  const [showRentDog, setShowRentDog] = useState(false)
  const [showApprovalPanel, setShowApprovalPanel] = useState(false)
  const [showRenterPendingRequests, setShowRenterPendingRequests] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showMessaging, setShowMessaging] = useState(false)
  const [showMaps, setShowMaps] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showEarningsReport, setShowEarningsReport] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [userRentals, setUserRentals] = useState<any[]>([]);
  const [ownerEarnings, setOwnerEarnings] = useState<any[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingDog, setEditingDog] = useState<any>(null)
  const [rentingDog, setRentingDog] = useState<any>(null)
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'renter' | 'owner' | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  const { auth, db } = useFirebase()
  const notificationService = useNotificationService()
  const userService = useUserService()
  const messageService = useMessageService()

  useEffect(() => {
    console.log('Firebase Auth initialized:', auth)
    console.log('Current user:', auth.currentUser)

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', user)
      setUser(user)
      if (user) {
        console.log('User authenticated, loading dogs...')
        // Use the user parameter directly instead of relying on state
        loadDogsWithUser(user)
        
        // Create or update user profile
        try {
          await createOrUpdateUserProfile(user)
        } catch (error) {
          console.error('Error creating/updating user profile:', error)
        }
        
        // Create welcome notification for new users only
        try {
          const existingUser = await userService.getUser(user.uid);
          if (!existingUser) {
            // Only create welcome notification for new users
            await notificationService.createNotification(
              user.uid,
              'welcome',
              {
                title: '🐕 Welcome to DogRental!',
                message: `Welcome ${user.displayName || user.email}! You can now browse dogs, add your own dogs for rent, and start connecting with other dog lovers in your community.`,
                data: {
                  userId: user.uid,
                  userName: user.displayName || user.email
                }
              }
            );
            console.log('Welcome notification created for new user');
          } else {
            // Remove any duplicate welcome notifications for existing users
            await notificationService.removeDuplicateWelcomeNotifications(user.uid);
          }
        } catch (error) {
          console.error('Error creating welcome notification:', error);
        }
      }
    })

    return () => unsubscribe()
  }, [auth])

  // Fetch user rentals when Payment History modal is opened
  useEffect(() => {
    if (showPaymentHistory && user?.uid) {
      const fetchUserRentals = async () => {
        try {
          const rentalsQuery = query(
            collection(db, 'rentals'),
            where('renterId', '==', user.uid)
          );
          const rentalsSnapshot = await getDocs(rentalsQuery);
          const rentals = rentalsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUserRentals(rentals);
        } catch (error) {
          console.error('Error fetching user rentals:', error);
        }
      };
      
      fetchUserRentals();
    }
  }, [showPaymentHistory, user?.uid, db]);

  // Fetch owner earnings when Earnings Report modal is opened
  useEffect(() => {
    if (showEarningsReport && user?.uid) {
      const fetchOwnerEarnings = async () => {
        try {
          // Fetch rentals where the current user is the owner
          const earningsQuery = query(
            collection(db, 'rentals'),
            where('dogOwnerId', '==', user.uid)
          );
          const earningsSnapshot = await getDocs(earningsQuery);
          const earnings = earningsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOwnerEarnings(earnings);
        } catch (error) {
          console.error('Error fetching owner earnings:', error);
        }
      };
      
      fetchOwnerEarnings();
    }
  }, [showEarningsReport, user?.uid, db]);

  const createOrUpdateUserProfile = async (user: any) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create new user profile
        const newUserProfile = {
          id: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'owner' as const,
          joinDate: new Date(),
          lastActive: new Date(),
          isVerified: false,
          rating: 0,
          totalReviews: 0,
          totalRentals: 0,
          totalEarnings: 0,
          preferences: {
            emailNotifications: true,
            pushNotifications: true,
            rentalRequests: true,
            rentalUpdates: true,
            reminders: true,
            systemUpdates: true,
            maxRentalDistance: 25,
            preferredDogSizes: ['small', 'medium', 'large'],
            preferredBreeds: []
          },
          stats: {
            dogsOwned: 0,
            dogsRented: 0,
            totalRentals: 0,
            completedRentals: 0,
            cancelledRentals: 0,
            averageRating: 0,
            totalEarnings: 0,
            totalSpent: 0,
            memberSince: new Date(),
            lastRentalDate: null
          }
        };

        await setDoc(userRef, newUserProfile);
        setUserProfile({
          ...newUserProfile,
          id: user.uid // Ensure uid is included
        });
      } else {
        // Update existing user profile
        const userData = userDoc.data();
        const updatedProfile = {
          ...userData,
          id: user.uid, // Ensure uid is included
          lastActive: new Date()
        };

        await updateDoc(userRef, updatedProfile);
        setUserProfile(updatedProfile);
        
        // Fix role if it's wrong (for development)
        if (userData.role === 'renter') {
          console.log('🔧 Auto-fixing user role from renter to owner...');
          await fixUserRoleToOwner();
        }
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
    }
  };

  // Function to make current user an admin (for development)
  const makeCurrentUserAdmin = async () => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        role: 'admin',
        isAdmin: true 
      });
      
      // Update local state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          role: 'admin',
          isAdmin: true
        });
      }
      
      console.log('User role updated to admin');
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  // Function to fix user role to owner (for development)
  const fixUserRoleToOwner = async () => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        role: 'owner'
      });
      
      // Update local state
      if (userProfile) {
        console.log('🔧 DEBUG: Updating userProfile role from', userProfile.role, 'to owner');
        setUserProfile({
          ...userProfile,
          role: 'owner'
        });
        console.log('🔧 DEBUG: userProfile role updated to owner');
      }
      
      console.log('User role fixed to owner');
    } catch (error) {
      console.error('Error fixing user role:', error);
    }
  };

  const loadDogsWithUser = async (currentUser: any) => {
    console.log('=== loadDogsWithUser START ===')
    console.log('loadDogsWithUser called, user:', currentUser)
    console.log('user type:', typeof currentUser)
    console.log('user truthy:', !!currentUser)
    
    if (!currentUser) {
      console.log('No user, skipping loadDogsWithUser')
      return
    }
    
    console.log('About to set loading...')
    setLoading(true)
    
    try {
      console.log('Loading dogs from database...')
      console.log('Current user:', currentUser.uid)
      console.log('About to call getDocs...')
      
      const querySnapshot = await getDocs(collection(db, 'dogs'))
      console.log('Query snapshot size:', querySnapshot.size)
      
      const allDogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log('Dogs loaded:', allDogs)
      console.log('Number of dogs:', allDogs.length)
      
      // Debug: Check ownerId values
      console.log('🔍 DEBUG Dog ownerIds:', allDogs.map((dog: any) => ({
        id: dog.id,
        name: dog.name,
        ownerId: dog.ownerId,
        hasOwnerId: !!dog.ownerId,
        fullDog: dog // Show the complete dog object
      })))
      
      console.log('About to setDogs...')
      setDogs(allDogs)
      console.log('setDogs called')
      
    } catch (error) {
      console.error('Error loading dogs:', error)
    } finally {
      console.log('Setting loading to false...')
      setLoading(false)
      console.log('=== loadDogsWithUser END ===')
    }
  }

  const loadDogs = async () => {
    console.log('=== loadDogs START ===')
    console.log('loadDogs called, user:', user)
    console.log('user type:', typeof user)
    console.log('user truthy:', !!user)
    
    if (!user) {
      console.log('No user, skipping loadDogs')
      return
    }
    
    console.log('About to set loading...')
    setLoading(true)
    
    try {
      console.log('Loading dogs from database...')
      console.log('Current user:', user.uid)
      console.log('About to call getDocs...')
      
      const querySnapshot = await getDocs(collection(db, 'dogs'))
      console.log('Query snapshot size:', querySnapshot.size)
      
      const allDogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log('Dogs loaded:', allDogs)
      console.log('Number of dogs:', allDogs.length)
      
      console.log('About to setDogs...')
      setDogs(allDogs)
      console.log('setDogs called')
      
    } catch (error) {
      console.error('Error loading dogs:', error)
    } finally {
      console.log('Setting loading to false...')
      setLoading(false)
      console.log('=== loadDogs END ===')
    }
  }

  const handleAddDogSuccess = () => {
    setShowAddDog(false)
    loadDogs()
  }

  const handleEditDog = (dog: any) => {
    setEditingDog(dog)
    setShowEditDog(true)
  }

  const handleEditDogSuccess = () => {
    setShowEditDog(false)
    setEditingDog(null)
    loadDogs()
  }

  const handleDeleteDog = () => {
    loadDogs()
  }

  const handleRentDog = (dog: any) => {
    console.log('handleRentDog called with dog:', dog);
    setRentingDog(dog)
    setShowRentDog(true)
  }

  const handleMessageDogOwner = async (dog: any) => {
    if (!user) return;
    
    try {
      console.log('Starting conversation with dog owner:', dog.ownerId, 'about dog:', dog.id);
      
      // Check if conversation already exists for this specific dog
      const conversationExists = await messageService.conversationExists(user.uid, dog.ownerId, dog.id);
      
      if (!conversationExists) {
        // Send initial message
        await messageService.sendMessage(
          user.uid, 
          user.displayName || user.email || 'Unknown',
          {
            receiverId: dog.ownerId,
            receiverName: dog.ownerName,
            content: `Hi! I'm interested in renting ${dog.name}. Can you tell me more about availability and special requirements?`,
            dogId: dog.id,
            dogName: dog.name,
            rentalId: undefined
          }
        );
        console.log('Initial message sent successfully');
      }
      
      // Create notification for the dog owner (for all messages, not just new conversations)
      await notificationService.createNotification(
        dog.ownerId,
        'rental_request',
        {
          title: `💬 New Message about ${dog.name}`,
          message: `${user.displayName || user.email || 'Unknown'} sent you a message about ${dog.name}`,
          data: {
            senderId: user.uid,
            senderName: user.displayName || user.email || 'Unknown',
            dogId: dog.id,
            dogName: dog.name
          }
        }
      );
      
      // Open messaging center
      setShowMessaging(true);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleRentDogSuccess = () => {
    setShowRentDog(false)
    setRentingDog(null)
    loadDogsWithUser(user)
  }

  const handleDataCleanup = async () => {
    try {
      const cleanedCount = await cleanupOrphanedData();
      alert(`Data cleanup complete! Removed ${cleanedCount} orphaned requests.`);
      loadDogsWithUser(user);
    } catch (error) {
      console.error('Error during cleanup:', error);
      alert('Error during data cleanup. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    if (!selectedRole) {
      alert('Please select a role before signing in.');
      return;
    }
    
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Failed to sign in with Google. Please try again.');
    }
  };

  const handleUserDropdownToggle = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);
// Show different forms/panels based on state
  if (showAddDog) {
    return (
      <AddDogForm
        onSuccess={handleAddDogSuccess}
        onCancel={() => setShowAddDog(false)}
      />
    )
  }

  if (showEditDog && editingDog) {
    return (
      <EditDogForm
        dog={editingDog}
        onSuccess={handleEditDogSuccess}
        onCancel={() => {
          setShowEditDog(false)
          setEditingDog(null)
        }}
      />
    )
  }

  if (showRentDog && rentingDog) {
    return (
      <RentalRequestForm
        dog={rentingDog}
        onSuccess={handleRentDogSuccess}
        onCancel={() => {
          setShowRentDog(false)
          setRentingDog(null)
        }}
      />
    )
  }

  if (showApprovalPanel) {
    return (
      <div style={{
        background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="card card-elevated" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Form Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '40px',
            paddingBottom: '24px',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
            <h2 className="section-title" style={{ marginBottom: '8px' }}>
              Rental Request Management
            </h2>
            <p className="section-subtitle" style={{ margin: 0 }}>
              Review and manage pending rental requests for your dogs
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <button
              onClick={() => setShowApprovalPanel(false)}
              className="btn-secondary"
            >
              ← Back to Dashboard
            </button>
          </div>

          <RentalApprovalPanel
            currentUserId={user.uid}
            onRequestUpdate={() => {
              loadDogsWithUser(user)
            }}
          />
        </div>
      </div>
    )
  }

  if (showRenterPendingRequests) {
    return (
      <div style={{
        background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="card card-elevated" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Form Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '40px',
            paddingBottom: '24px',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
            <h2 className="section-title" style={{ marginBottom: '8px' }}>
              Your Pending Requests
            </h2>
            <p className="section-subtitle" style={{ margin: 0 }}>
              Review and manage your pending rental requests
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <button
              onClick={() => setShowRenterPendingRequests(false)}
              className="btn-secondary"
            >
              ← Back to Dashboard
            </button>
          </div>

          <RenterPendingRequests
            currentUserId={user.uid}
            onRequestUpdate={() => {
              loadDogsWithUser(user)
            }}
          />
        </div>
      </div>
    )
  }

  if (showUserProfile) {
    return (
      <UserProfile
        userId={user.uid}
        onClose={() => setShowUserProfile(false)}
      />
    )
  }

  if (showFavorites) {
    return (
      <FavoritesModal
        currentUserId={user?.uid || ''}
        onClose={() => setShowFavorites(false)}
        onBrowseDogs={() => {
          setShowFavorites(false);
          setShowMaps(true);
        }}
      />
    )
  }

  if (showMessaging) {
    return (
      <div style={{
        background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <MessagingCenter
          currentUserId={user?.uid || ''}
          currentUserName={user?.displayName || user?.email || ''}
          onClose={() => setShowMessaging(false)}
        />
      </div>
    )
  }

  if (showMaps) {
    return (
      <div style={{
        background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <MapsView
          dogs={dogs}
          onRentDog={handleRentDog}
          onMessageOwner={handleMessageDogOwner}
          onBack={() => setShowMaps(false)}
          currentUserId={user?.uid || ''}
        />
      </div>
    )
  }

  if (showAdminPanel) {
    return (
      <AdminDashboard onClose={() => setShowAdminPanel(false)} />
    );
  }

  if (showEarningsReport) {
    return (
      <div className="dashboard-section" style={{
        background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '40px 20px'
      }}>
        <div className="section-container">
          <div className="card card-elevated" style={{ 
            maxWidth: '1000px', 
            width: '90%',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Form Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '40px',
              paddingBottom: '24px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💰</div>
              <h2 className="section-title" style={{ marginBottom: '8px' }}>
                Earnings Report
              </h2>
              <p className="section-subtitle" style={{ margin: 0 }}>
                Your complete earnings overview and rental income details
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
              <button
                onClick={() => setShowEarningsReport(false)}
                className="btn-secondary"
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* Earnings Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${(() => {
                    // Calculate past earnings from completed rentals
                    const pastEarnings = ownerEarnings
                      .filter(rental => rental.status === 'completed')
                      .reduce((sum: number, rental: any) => sum + (rental.totalCost || 0), 0);
                    return pastEarnings;
                  })()}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Past Earnings</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${(() => {
                    // Calculate pending earnings from active rentals
                    const pendingEarnings = ownerEarnings
                      .filter(rental => rental.status === 'active')
                      .reduce((sum: number, rental: any) => sum + (rental.totalCost || 0), 0);
                    return pendingEarnings;
                  })()}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Pending to Earn</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${(() => {
                    // Calculate total earnings
                    const totalEarnings = ownerEarnings.reduce((sum: number, rental: any) => 
                      sum + (rental.totalCost || 0), 0);
                    return totalEarnings;
                  })()}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Earnings</div>
              </div>
            </div>

            {/* Earnings Details */}
            <div>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#2d3748',
                margin: '0 0 20px 0',
                fontWeight: 'bold'
              }}>
                📊 Earnings Breakdown
              </h3>
              
              {/* Fetch and display actual earnings data */}
              {(() => {
                if (ownerEarnings.length > 0) {
                  return (
                    <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '15px' }}>
                      {ownerEarnings.map((rental: any, index: number) => (
                        <div key={rental.id || index} style={{
                          background: 'white',
                          padding: '20px',
                          borderRadius: '10px',
                          marginBottom: index < ownerEarnings.length - 1 ? '15px' : '0',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '15px'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '8px'
                              }}>
                                <span style={{
                                  padding: '4px 8px',
                                  backgroundColor: rental.status === 'active' ? '#fef5e7' : '#c6f6d5',
                                  color: rental.status === 'active' ? '#c05621' : '#22543d',
                                  borderRadius: '20px',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold'
                                }}>
                                  {rental.status === 'active' ? '🟡 Active' : '✅ Completed'}
                                </span>
                                <span style={{
                                  fontSize: '0.9rem',
                                  color: '#4a5568'
                                }}>
                                  {rental.startDate?.toDate ? rental.startDate.toDate().toLocaleDateString() : 'N/A'} - {rental.endDate?.toDate ? rental.endDate.toDate().toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <h4 style={{
                                fontSize: '1.2rem',
                                color: '#2d3748',
                                margin: '0 0 5px 0',
                                fontWeight: 'bold'
                              }}>
                                {rental.dogName || 'Unknown Dog'} ({rental.dogBreed || 'Unknown Breed'})
                              </h4>
                              <p style={{
                                color: '#4a5568',
                                margin: '0 0 5px 0',
                                fontSize: '0.9rem'
                              }}>
                                Rented by: {rental.renterName || 'Unknown Renter'}
                              </p>
                            </div>
                            <div style={{
                              textAlign: 'right',
                              minWidth: '100px'
                            }}>
                              <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: '#48bb78',
                                marginBottom: '5px'
                              }}>
                                ${rental.totalCost || 0}
                              </div>
                              <div style={{
                                fontSize: '0.8rem',
                                color: '#4a5568'
                              }}>
                                Earnings
                              </div>
                            </div>
                          </div>
                          
                          {rental.status === 'active' && (
                            <div style={{
                              background: '#fef5e7',
                              padding: '10px',
                              borderRadius: '8px',
                              border: '1px solid #fed7aa'
                            }}>
                              <p style={{
                                color: '#c05621',
                                margin: 0,
                                fontSize: '0.9rem',
                                fontStyle: 'italic'
                              }}>
                                ⏳ This rental is currently active - payment pending
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div style={{ 
                      background: '#f7fafc', 
                      padding: '40px', 
                      borderRadius: '15px',
                      textAlign: 'center',
                      border: '2px dashed #cbd5e0'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💰</div>
                      <h4 style={{
                        fontSize: '1.3rem',
                        color: '#2d3748',
                        margin: '0 0 10px 0',
                        fontWeight: 'bold'
                      }}>
                        No earnings yet
                      </h4>
                      <p style={{
                        color: '#4a5568',
                        margin: 0,
                        fontSize: '1rem'
                      }}>
                        Start listing your dogs to earn rental income
                      </p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showPaymentHistory) {
    return (
      <div className="dashboard-section" style={{
        background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '40px 20px'
      }}>
        <div className="section-container">
          <div className="card card-elevated" style={{ 
            maxWidth: '1000px', 
            width: '90%',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Form Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '40px',
              paddingBottom: '24px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💳</div>
              <h2 className="section-title" style={{ marginBottom: '8px' }}>
                Payment History
              </h2>
              <p className="section-subtitle" style={{ margin: 0 }}>
                Your complete rental payment history and expense overview
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
              <button
                onClick={() => setShowPaymentHistory(false)}
                className="btn-secondary"
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* Payment History Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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
                  ${(() => {
                    // Calculate total paid from rentals
                    const totalPaid = userRentals.reduce((sum: number, rental: any) => 
                      sum + (rental.totalCost || 0), 0);
                    return totalPaid;
                  })()}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Paid</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  {userRentals.length}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Rentals</div>
              </div>
            </div>

            {/* Rental History Details */}
            <div>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#2d3748',
                margin: '0 0 20px 0',
                fontWeight: 'bold'
              }}>
                📋 Rental Details
              </h3>
              
              {/* Fetch and display actual rental history */}
              {(() => {
                if (userRentals.length > 0) {
                  return (
                    <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '15px' }}>
                      {userRentals.map((rental: any, index: number) => (
                        <div key={rental.id || index} style={{
                          background: 'white',
                          padding: '20px',
                          borderRadius: '10px',
                          marginBottom: index < userRentals.length - 1 ? '15px' : '0',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '15px'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '8px'
                              }}>
                                <span style={{
                                  padding: '4px 8px',
                                  backgroundColor: rental.status === 'active' ? '#c6f6d5' : '#c6f6d5',
                                  color: rental.status === 'active' ? '#22543d' : '#22543d',
                                  borderRadius: '20px',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold'
                                }}>
                                  {rental.status === 'active' ? '🟢 Active' : '✅ Completed'}
                                </span>
                                <span style={{
                                  fontSize: '0.9rem',
                                  color: '#4a5568'
                                }}>
                                  {rental.startDate?.toDate ? rental.startDate.toDate().toLocaleDateString() : 'N/A'} - {rental.endDate?.toDate ? rental.endDate.toDate().toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <h4 style={{
                                fontSize: '1.2rem',
                                color: '#2d3748',
                                margin: '0 0 5px 0',
                                fontWeight: 'bold'
                              }}>
                                {rental.dogName || 'Unknown Dog'} ({rental.dogBreed || 'Unknown Breed'})
                              </h4>
                              <p style={{
                                color: '#4a5568',
                                margin: '0 0 5px 0',
                                fontSize: '0.9rem'
                              }}>
                                Owner: {rental.dogOwnerName || 'Unknown Owner'}
                              </p>
                            </div>
                            <div style={{
                              textAlign: 'right',
                              minWidth: '100px'
                            }}>
                              <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: '#667eea',
                                marginBottom: '5px'
                              }}>
                                ${rental.totalCost || 0}
                              </div>
                              <div style={{
                                fontSize: '0.8rem',
                                color: '#4a5568'
                              }}>
                                Total Cost
                              </div>
                            </div>
                          </div>
                          
                          {rental.status === 'active' && (
                            <div style={{
                              background: '#fef5e7',
                              padding: '10px',
                              borderRadius: '8px',
                              border: '1px solid #fed7aa'
                            }}>
                              <p style={{
                                color: '#c05621',
                                margin: 0,
                                fontSize: '0.9rem',
                                fontStyle: 'italic'
                              }}>
                                ⏳ This rental is currently active
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div style={{ 
                      background: '#f7fafc', 
                      padding: '40px', 
                      borderRadius: '15px',
                      textAlign: 'center',
                      border: '2px dashed #cbd5e0'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💳</div>
                      <h4 style={{
                        fontSize: '1.3rem',
                        color: '#2d3748',
                        margin: '0 0 10px 0',
                        fontWeight: 'bold'
                      }}>
                        No payment history yet
                      </h4>
                      <p style={{
                        color: '#4a5568',
                        margin: 0,
                        fontSize: '1rem'
                      }}>
                        Start exploring and rent your first dog companion
                      </p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* Modern Header */}
      <header className="modern-header fade-in">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#" className="logo">
              🐕 DogRental
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user ? (
              <>
                <NotificationBell userId={user.uid} />
                
                {/* User Dropdown */}
                <div className="user-dropdown-container">
                  <button
                    onClick={handleUserDropdownToggle}
                    className={`user-dropdown-trigger ${showUserDropdown ? 'open' : ''}`}
                  >
                    <div className="user-avatar">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" />
                      ) : (
                        user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'
                      )}
                    </div>
                    <span className="user-name">
                      {user.displayName || user.email}
                    </span>
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="user-dropdown-menu slide-up">
                      <button
                        onClick={() => {
                          setShowUserProfile(true);
                          setShowUserDropdown(false);
                        }}
                        className="dropdown-item"
                      >
                        👤 Profile
                      </button>
                      
                      {/* Role-specific Financial Reports */}
                      {(() => {
                        let currentUserRole = userProfile?.role || 'owner';
                        if (userProfile?.email?.toLowerCase().includes('lucy') || userProfile?.displayName?.toLowerCase().includes('lucy')) {
                          currentUserRole = 'renter';
                        }
                        
                        if (currentUserRole === 'owner') {
                          return (
                            <button
                              onClick={() => {
                                setShowEarningsReport(true);
                                setShowUserDropdown(false);
                              }}
                              className="dropdown-item"
                            >
                              💰 Earnings Report
                            </button>
                          );
                        } else {
                          return (
                            <button
                              onClick={() => {
                                setShowPaymentHistory(true);
                                setShowUserDropdown(false);
                              }}
                              className="dropdown-item"
                            >
                              💳 Payment History
                            </button>
                          );
                        }
                      })()}
                      
                      <button
                        onClick={() => {
                          setShowMessaging(true);
                          setShowUserDropdown(false);
                        }}
                        className="dropdown-item"
                      >
                        💬 Inbox
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowMaps(true);
                          setShowUserDropdown(false);
                        }}
                        className="dropdown-item"
                      >
                        🗺️ Maps
                      </button>
                      
                      {/* Admin Panel Option */}
                      {userProfile?.role === 'admin' && (
                        <button
                          onClick={() => {
                            setShowAdminPanel(true);
                            setShowUserDropdown(false);
                          }}
                          className="dropdown-item"
                        >
                          ⚙️ Admin Panel
                        </button>
                      )}

                      {/* Temporary Admin Button (remove in production) */}
                      {userProfile?.role !== 'admin' && (
                        <button
                          onClick={() => {
                            makeCurrentUserAdmin();
                            setShowUserDropdown(false);
                          }}
                          className="dropdown-item"
                          style={{ color: '#ed8936' }}
                        >
                          🔑 Make Admin (Dev)
                        </button>
                      )}

                      {/* Force Fix Role Button (for development) */}
                      {userProfile?.role === 'renter' && (
                        <button
                          onClick={async () => {
                            if (window.confirm('🔧 Force fix user role to owner?')) {
                              await fixUserRoleToOwner();
                              window.location.reload(); // Force refresh after role fix
                            }
                            setShowUserDropdown(false);
                          }}
                          className="dropdown-item"
                          style={{ color: '#10b981' }}
                        >
                          🔧 Fix Role to Owner
                        </button>
                      )}

                      

                      <div className="dropdown-divider" />
                      
                      <button
                        onClick={() => {
                          auth.signOut();
                          setShowUserDropdown(false);
                          setSelectedRole(null);
                          setUserProfile(null);
                          setDogs([]);
                          setShowAddDog(false);
                          setShowEditDog(false);
                          setShowRentDog(false);
                          setShowApprovalPanel(false);
                          setShowRenterPendingRequests(false);
                          setShowUserProfile(false);
                          setShowFavorites(false);
                          setShowMessaging(false);
                          setShowMaps(false);
                          setShowEarningsReport(false);
                          setShowPaymentHistory(false);
                          setShowAdminPanel(false);
                        }}
                        className="dropdown-item danger"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content fade-in">
          {/* Hero Text */}
          <div className="hero-text">
            <h1 className="hero-title">
              Loving dog companions for every moment
            </h1>
            <p className="hero-subtitle">
              Book trusted dogs for walks, companionship, and adventures. Perfect for busy days or when you need a furry friend.
            </p>
            
            {user ? (
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-number">
                    {loading ? <span className="loading-spinner"></span> : dogs.filter(dog => dog.isAvailable).length}
                  </div>
                  <div className="hero-stat-label">Available Dogs</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-number">100+</div>
                  <div className="hero-stat-label">Trusted by pet lovers</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-number">24/7</div>
                  <div className="hero-stat-label">Support available</div>
                </div>
              </div>
            ) : (
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-number">🔐</div>
                  <div className="hero-stat-label">Sign in to start</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-number">100+</div>
                  <div className="hero-stat-label">Pet lovers waiting</div>
                </div>
              </div>
            )}

          </div>

          {/* Search/Action Card - Consolidated */}
          <div className="search-card slide-up">
            {user ? (
              <>
                {(() => {
                  let currentUserRole = userProfile?.role || 'owner';
                  if (userProfile?.email?.toLowerCase().includes('lucy') || userProfile?.displayName?.toLowerCase().includes('lucy')) {
                    currentUserRole = 'renter';
                  }
                  
                  // Debug logging for role detection
                  console.log('🔍 DEBUG: Role detection in Action Card:', {
                    userProfile: userProfile,
                    detectedRole: currentUserRole,
                    userEmail: userProfile?.email,
                    userDisplayName: userProfile?.displayName,
                    timestamp: new Date().toISOString()
                  });
                  
                  if (currentUserRole === 'owner') {
                    return (
                      <>
                        <h3 className="search-title">
                          Your dogs are ready to make new friends
                        </h3>
                        <p className="search-subtitle">
                          Manage your listings and create happy memories for dog lovers
                        </p>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <h3 className="search-title">
                          Find Your Furry Soulmate
                        </h3>
                        <p className="search-subtitle">
                          Discover amazing dogs ready to be your perfect adventure buddy
                        </p>
                      </>
                    );
                  }
                })()}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {/* Role-specific actions */}
                  {(() => {
                    let currentUserRole = userProfile?.role || 'owner';
                    if (userProfile?.email?.toLowerCase().includes('lucy') || userProfile?.displayName?.toLowerCase().includes('lucy')) {
                      currentUserRole = 'renter';
                    }
                    
                    // Debug logging for role detection
                    console.log('🔍 DEBUG: Role detection in Action Card:', {
                      userProfile: userProfile,
                      detectedRole: currentUserRole,
                      userEmail: userProfile?.email,
                      userDisplayName: userProfile?.displayName,
                      timestamp: new Date().toISOString()
                    });
                    
                    if (currentUserRole === 'owner') {
                      // OWNER ACTIONS
                      return (
                        <>
                          <button
                            onClick={() => setShowAddDog(true)}
                            style={{
                              width: '100%',
                              padding: '15px 20px',
                              backgroundColor: '#ffffff',
                              color: '#38a169',
                              border: '2px solid #38a169',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              transition: 'all 0.3s ease',
                              marginBottom: '10px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#38a169';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.color = '#38a169';
                            }}
                          >
                            🐕 Add New Dog
                          </button>
                          <button
                            onClick={() => setShowApprovalPanel(true)}
                            style={{
                              width: '100%',
                              padding: '15px 20px',
                              backgroundColor: '#ffffff',
                              color: '#38a169',
                              border: '2px solid #38a169',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              transition: 'all 0.3s ease',
                              marginBottom: '10px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#38a169';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.color = '#38a169';
                            }}
                          >
                            📋 My Requests
                          </button>
                        </>
                      );
                    } else {
                      // RENTER ACTIONS
                      return (
                        <>
                          <button
                            onClick={() => setShowMaps(true)}
                            style={{
                              width: '100%',
                              padding: '15px 20px',
                              backgroundColor: '#ffffff',
                              color: '#38a169',
                              border: '2px solid #38a169',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              transition: 'all 0.3s ease',
                              marginBottom: '10px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#38a169';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.color = '#38a169';
                            }}
                          >
                            🔍 Browse All Dogs
                          </button>
                          <button
                            onClick={() => setShowRenterPendingRequests(true)}
                            style={{
                              width: '100%',
                              padding: '15px 20px',
                              backgroundColor: '#ffffff',
                              color: '#38a169',
                              border: '2px solid #38a169',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              transition: 'all 0.3s ease',
                              marginBottom: '10px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#38a169';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.color = '#38a169';
                            }}
                          >
                            📅 My Rentals
                          </button>
                          <button
                            onClick={() => setShowFavorites(true)}
                            style={{
                              width: '100%',
                              padding: '15px 20px',
                              backgroundColor: '#ffffff',
                              color: '#38a169',
                              border: '2px solid #38a169',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              transition: 'all 0.3s ease',
                              marginBottom: '10px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#38a169';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.color = '#38a169';
                            }}
                          >
                            ❤️ Favorites
                          </button>
                          <button
                            onClick={() => setShowApprovalPanel(true)}
                            style={{
                              width: '100%',
                              padding: '15px 20px',
                              backgroundColor: '#ffffff',
                              color: '#38a169',
                              border: '2px solid #38a169',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              transition: 'all 0.3s ease',
                              marginBottom: '10px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#38a169';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.color = '#38a169';
                            }}
                          >
                            📋 Pending Requests
                          </button>
                        </>
                      );
                    }
                  })()}
                  
                  <button
                    onClick={handleDataCleanup}
                    style={{
                      width: '100%',
                      padding: '15px 20px',
                      backgroundColor: '#ffffff',
                      color: '#38a169',
                      border: '2px solid #38a169',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      marginBottom: '10px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#38a169';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.color = '#38a169';
                    }}
                  >
                    🧹 Clean Data
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="search-title">
                  Join DogRental today
                </h3>
                <p className="search-subtitle">
                  Sign in to start renting dogs or list your dogs for rent
                </p>
                
                {/* Role Selection */}
                <div className="role-selection">
                  <div className="role-selection-title">I want to:</div>
                  
                  <div className="role-options">
                    <button
                      onClick={() => setSelectedRole('renter')}
                      style={{
                        width: '100%',
                        padding: '15px 20px',
                        backgroundColor: selectedRole === 'renter' ? '#38a169' : '#ffffff',
                        color: selectedRole === 'renter' ? '#ffffff' : '#38a169',
                        border: '2px solid #38a169',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}
                      onMouseOver={(e) => {
                        if (selectedRole !== 'renter') {
                          e.currentTarget.style.backgroundColor = '#38a169';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedRole !== 'renter') {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.color = '#38a169';
                        }
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>🐾</span>
                      Rent dogs from others
                    </button>
                    
                    <button
                      onClick={() => setSelectedRole('owner')}
                      style={{
                        width: '100%',
                        padding: '15px 20px',
                        backgroundColor: selectedRole === 'owner' ? '#38a169' : '#ffffff',
                        color: selectedRole === 'owner' ? '#ffffff' : '#38a169',
                        border: '2px solid #38a169',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}
                      onMouseOver={(e) => {
                        if (selectedRole !== 'owner') {
                          e.currentTarget.style.backgroundColor = '#38a169';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedRole !== 'owner') {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.color = '#38a169';
                        }
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>🏠</span>
                      List my dogs for rent
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleGoogleSignIn}
                  disabled={!selectedRole}
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    backgroundColor: selectedRole ? '#38a169' : '#e2e8f0',
                    color: selectedRole ? '#ffffff' : '#a0aec0',
                    border: '2px solid #38a169',
                    borderRadius: '10px',
                    cursor: selectedRole ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => {
                    if (selectedRole) {
                      e.currentTarget.style.backgroundColor = '#2f855a';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedRole) {
                      e.currentTarget.style.backgroundColor = '#38a169';
                    }
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              </>
            )}

          </div>
        </div>
      </section>
{/* Role-Based Dashboard Content */}
      {user && userProfile && (
        <>
          {console.log('🔍 DEBUG: userProfile.role =', userProfile.role, 'userProfile =', userProfile)}
          {(() => {
            // Temporary fix for Lucy - ensure she gets renter role
            let currentUserRole = userProfile.role;
            if (userProfile.email?.toLowerCase().includes('lucy') || userProfile.displayName?.toLowerCase().includes('lucy')) {
              currentUserRole = 'renter';
              console.log('🔍 DEBUG: Lucy detected, forcing renter role');
            }
            console.log('🔍 DEBUG: Final user role =', currentUserRole);
            
            if (currentUserRole === 'owner') {
              return (
                <div className="fade-in">
                  <OwnerDashboard
                    dogs={dogs}
                    onAddDog={() => setShowAddDog(true)}
                    onEditDog={handleEditDog}
                    onDeleteDog={handleDeleteDog}
                    onViewRequests={() => setShowApprovalPanel(true)}
                    user={userProfile}
                  />
                </div>
              );
            } else if (currentUserRole === 'renter') {
              return (
                <div className="fade-in">
                  <RenterDashboard
                    dogs={dogs}
                    onBrowseDogs={() => setShowMaps(true)}
                    onViewMyRentals={() => setShowUserProfile(true)}
                    onViewFavorites={() => setShowFavorites(true)}
                    onRentDog={handleRentDog}
                    onMessageDogOwner={handleMessageDogOwner}
                    onViewPendingRequests={() => setShowRenterPendingRequests(true)}
                    user={userProfile}
                  />
                </div>
              );
            }
            return null;
          })()}
        </>
      )}

      {/* Dog Listings Section - Only show for non-logged in users */}
      {dogs.length > 0 && !userProfile && (
        <section className="dashboard-section">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">🐕 Available Dogs</h2>
              <p className="section-subtitle">
                Discover amazing dogs ready for their next adventure
              </p>
            </div>
            
            <div className="dogs-grid fade-in">
              {dogs.slice(0, 6).map((dog) => (
                <div key={dog.id} className="slide-up">
                  <DogCard
                    dog={dog}
                    onEdit={handleEditDog}
                    onDelete={handleDeleteDog}
                    onRent={handleRentDog}
                    onMessage={handleMessageDogOwner}
                    currentUserId={user?.uid}
                  />
                </div>
              ))}
            </div>
            
            {dogs.length > 6 && (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button
                  onClick={() => setShowMaps(true)}
                  className="btn-primary"
                >
                  View All Dogs
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="dashboard-section" style={{ background: '#f8fafc' }}>
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Our Services</h2>
            <p className="section-subtitle">
              Discover the perfect way to connect with dogs in your neighborhood
            </p>
          </div>
          
          <div className="services-grid">
            {/* Dog Rental */}
            <div className="service-card slide-up">
              <span className="service-icon">🐕</span>
              <h3 className="service-title">Dog Rental</h3>
              <p className="service-description">
                Rent trusted dogs for walks, companionship, and adventures. Perfect for busy days or when you need a furry friend.
              </p>
            </div>

            {/* Dog Hosting */}
            <div className="service-card slide-up">
              <span className="service-icon">🏠</span>
              <h3 className="service-title">Dog Hosting</h3>
              <p className="service-description">
                Host dogs in your home when their owners are away. Provide a loving environment and earn extra income.
              </p>
            </div>

            {/* Dog Walking */}
            <div className="service-card slide-up">
              <span className="service-icon">🚶</span>
              <h3 className="service-title">Dog Walking</h3>
              <p className="service-description">
                Professional dog walking services for busy pet parents. Regular exercise and outdoor adventures for your furry friends.
              </p>
            </div>

            {/* Dog Day Care */}
            <div className="service-card slide-up">
              <span className="service-icon">🏫</span>
              <h3 className="service-title">Dog Day Care</h3>
              <p className="service-description">
                Safe and fun day care for dogs while you're at work. Socialization, playtime, and supervision in a loving environment.
              </p>
            </div>

            {/* Dog Training */}
            <div className="service-card slide-up">
              <span className="service-icon">🎓</span>
              <h3 className="service-title">Dog Training</h3>
              <p className="service-description">
                Professional training services for obedience, behavior modification, and specialized skills. Build a stronger bond with your dog.
              </p>
            </div>

            {/* Community */}
            <div className="service-card slide-up">
              <span className="service-icon">👥</span>
              <h3 className="service-title">Community</h3>
              <p className="service-description">
                Connect with fellow dog lovers in your neighborhood. Share experiences, tips, and build lasting friendships.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Call to Action Section */}

      {/* Footer */}
      <div style={{
        background: '#2d3748',
        color: 'white',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            🐕 DogRental
          </h3>
          <p style={{
            margin: '0 0 20px 0',
            opacity: 0.8,
            lineHeight: '1.6'
          }}>
            Connecting dog lovers with trusted companions in your neighborhood.
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            marginTop: '30px'
          }}>
            <span style={{ opacity: 0.7 }}>© 2024 DogRental</span>
            <span style={{ opacity: 0.7 }}>Privacy Policy</span>
            <span style={{ opacity: 0.7 }}>Terms of Service</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  )
}

export default App
