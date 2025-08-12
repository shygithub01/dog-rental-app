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
import MessagingCenter from './components/Messaging/MessagingCenter'
import MapsView from './components/Maps/MapsView'
import OwnerDashboard from './components/Dashboard/OwnerDashboard'
import RenterDashboard from './components/Dashboard/RenterDashboard'
import { cleanupOrphanedData } from './utils/dataCleanup'
import { collection, getDocs } from 'firebase/firestore'
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
  const [showMessaging, setShowMessaging] = useState(false)
  const [showMaps, setShowMaps] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false);
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

  const createOrUpdateUserProfile = async (user: any) => {
    try {
      console.log('Creating/updating user profile for:', user.uid);
      
      // Check if user profile exists
      const existingUser = await userService.getUser(user.uid);
      console.log('Existing user found:', existingUser);
      
      if (!existingUser) {
        // Create new user profile with selected role
        console.log('Creating new user profile with role:', selectedRole);
        await userService.createUser(user.uid, {
          email: user.email,
          displayName: user.displayName || user.email,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber,
          location: '',
          bio: '',
          role: selectedRole || 'owner'
        });
        console.log('New user profile created successfully!');
        
        // Set user profile with the new role
        setUserProfile({
          ...user,
          role: selectedRole
        });
      } else {
        // Check if existing user has a proper role set
        const userRole = existingUser.role || selectedRole;
        console.log('Existing user role:', existingUser.role, 'Selected role:', selectedRole, 'Using role:', userRole);
        
        // Update existing user profile with latest info and ensure role is set
        console.log('Updating existing user profile...');
        await userService.updateUser(user.uid, {
          displayName: user.displayName || user.email,
          photoURL: user.photoURL,
          email: user.email,
          role: userRole || 'owner' // Ensure role is set
        });
        console.log('User profile updated successfully!');
        
        // Set user profile with the correct role
        setUserProfile({
          ...user,
          role: userRole
        });
      }
    } catch (error) {
      console.error('Error in createOrUpdateUserProfile:', error);
      throw error;
    }
  }

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
        background: 'linear-gradient(135deg, #f6f8fc 0%, #e8f2ff 100%)',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 24px 48px rgba(16, 24, 64, 0.08), 0 8px 16px rgba(16, 24, 64, 0.04)',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          border: '1px solid #e6effb'
        }}>
          {/* Enhanced Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
            paddingBottom: '32px',
            borderBottom: '2px solid #f0f7ff'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, #007cff 0%, #0066dd 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 24px auto',
              boxShadow: '0 8px 24px rgba(0, 124, 255, 0.2)'
            }}>
              📋
            </div>
            <h2 style={{
              fontSize: '2.75rem',
              background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              margin: '0 0 16px 0',
              fontWeight: '700',
              letterSpacing: '-0.02em'
            }}>
              Rental Request Management
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '1.2rem',
              margin: 0,
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Review and manage pending rental requests for your dogs with ease
            </p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '40px'
          }}>
            <button
              onClick={() => setShowApprovalPanel(false)}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minWidth: '140px',
                boxShadow: '0 4px 12px rgba(100, 116, 139, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(100, 116, 139, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 116, 139, 0.3)'
              }}
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
        background: 'linear-gradient(135deg, #f6f8fc 0%, #e8f2ff 100%)',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 24px 48px rgba(16, 24, 64, 0.08), 0 8px 16px rgba(16, 24, 64, 0.04)',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          border: '1px solid #e6effb'
        }}>
          {/* Enhanced Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
            paddingBottom: '32px',
            borderBottom: '2px solid #f0f7ff'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 24px auto',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)'
            }}>
              📋
            </div>
            <h2 style={{
              fontSize: '2.75rem',
              background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              margin: '0 0 16px 0',
              fontWeight: '700',
              letterSpacing: '-0.02em'
            }}>
              Your Pending Requests
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '1.2rem',
              margin: 0,
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Track and manage all your rental requests in one place
            </p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '40px'
          }}>
            <button
              onClick={() => setShowRenterPendingRequests(false)}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minWidth: '140px',
                boxShadow: '0 4px 12px rgba(100, 116, 139, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(100, 116, 139, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 116, 139, 0.3)'
              }}
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

  if (showMessaging) {
    return (
      <MessagingCenter
        currentUserId={user?.uid || ''}
        currentUserName={user?.displayName || user?.email || ''}
        onClose={() => setShowMessaging(false)}
      />
    )
  }

  if (showMaps) {
    return (
      <MapsView
        dogs={dogs}
        onRentDog={handleRentDog}
        onMessageOwner={handleMessageDogOwner}
        onBack={() => setShowMaps(false)}
      />
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff'
    }}>
      {/* Enhanced Header */}
      <header style={{
        background: '#ffffff',
        padding: '16px 0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #007cff 0%, #0066dd 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 4px 12px rgba(0, 124, 255, 0.2)'
            }}>
              🐕
            </div>
            <h1 style={{
              fontSize: '1.75rem',
              background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              margin: 0,
              fontWeight: '800',
              letterSpacing: '-0.02em'
            }}>
              DogRental
            </h1>
          </div>

          {/* Navigation */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <NotificationBell userId={user.uid} />
              
              {/* Enhanced User Dropdown */}
              <div className="user-dropdown-container" style={{ position: 'relative' }}>
                <button
                  onClick={handleUserDropdownToggle}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9'
                    e.currentTarget.style.borderColor = '#cbd5e1'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: user.photoURL ? 'transparent' : 'linear-gradient(135deg, #007cff 0%, #0066dd 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}>
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1e293b',
                      lineHeight: '1.2'
                    }}>
                      {user.displayName || user.email}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#64748b',
                      lineHeight: '1.2'
                    }}>
                      {userProfile?.role || 'User'}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#64748b',
                    transition: 'transform 0.2s',
                    transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </div>
                </button>
                
                {/* Enhanced Dropdown Menu */}
                {showUserDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    marginTop: '8px',
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: '1px solid #e2e8f0',
                    minWidth: '220px',
                    zIndex: 1000,
                    padding: '8px',
                    backdropFilter: 'blur(8px)'
                  }}>
                    {/* Dropdown Items */}
                    {[
                      { icon: '👤', label: 'Profile', action: () => { setShowUserProfile(true); setShowUserDropdown(false); } },
                      { icon: '💬', label: 'Inbox', action: () => { setShowMessaging(true); setShowUserDropdown(false); } },
                      { icon: '🗺️', label: 'Maps', action: () => { setShowMaps(true); setShowUserDropdown(false); } }
                    ].map((item, index) => (
                      <button
                        key={index}
                        onClick={item.action}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          borderRadius: '12px',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8fafc'
                          e.currentTarget.style.transform = 'translateX(4px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.transform = 'translateX(0)'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                    
                    <div style={{
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)',
                      margin: '8px 0'
                    }} />
                    
                    <button
                      onClick={() => {
                        auth.signOut();
                        setShowUserDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        borderRadius: '12px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fef2f2'
                        e.currentTarget.style.transform = 'translateX(4px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>🚪</span>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

{/* Enhanced Hero Section - CSS Responsive Version */}
      <section className="hero">
        <div className="hero-content">
          {/* Hero Content */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 16px',
              borderRadius: '50px',
              marginBottom: '32px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <span style={{ fontSize: '16px' }}>✨</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Trusted by 1000+ pet lovers</span>
            </div>
            
            <h1 className="hero-title">
              Find the perfect
              <br />
              <span style={{ color: '#fbbf24' }}>dog companion</span>
            </h1>
            
            <p className="hero-subtitle">
              Book trusted, loving dogs for walks, companionship, and adventures. 
              Perfect for busy days or when you need a furry friend by your side.
            </p>

            {user ? (
              <div className="hero-stats">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  padding: '12px 20px',
                  borderRadius: '16px',
                  backdropFilter: 'blur(10px)',
                  marginRight: '20px'
                }}>
                  <span style={{ fontSize: '24px' }}>📊</span>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                      {loading ? '...' : dogs.filter(dog => dog.isAvailable).length}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>Available Dogs</div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  padding: '12px 20px',
                  borderRadius: '16px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <span style={{ fontSize: '24px' }}>⭐</span>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>4.9</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>Average Rating</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  className="primary-btn"
                  onClick={() => document.querySelector('.hero-widget')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{
                    padding: '16px 32px',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: '#1a202c',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 8px 24px rgba(251, 191, 36, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Get Started Free
                  <span>→</span>
                </button>
                
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center'
                }}>
                  <span style={{ opacity: 0.9 }}>✓ No setup fees</span>
                  <span style={{ opacity: 0.9 }}>✓ Instant booking</span>
                </div>
              </div>
            )}
          </div>

          {/* Signup Form - only for non-authenticated users */}
          {!user && (
            <div className="hero-widget">
              <div style={{
                textAlign: 'center',
                marginBottom: '32px'
              }}>
                <h3 style={{
                  fontSize: '2rem',
                  background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  margin: '0 0 12px 0',
                  fontWeight: '700'
                }}>
                  Join DogRental
                </h3>
                <p style={{
                  color: '#64748b',
                  margin: 0,
                  fontSize: '1.1rem',
                  lineHeight: '1.5'
                }}>
                  Start your journey with loving dog companions
                </p>
              </div>
              
              {/* Role Selection */}
              <div style={{ marginBottom: '32px' }}>
                <p style={{
                  color: '#1e293b',
                  margin: '0 0 20px 0',
                  fontWeight: '600',
                  fontSize: '1.1rem'
                }}>
                  What brings you here?
                </p>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {[
                    {
                      role: 'renter',
                      icon: '🐾',
                      title: 'Find dog companions',
                      desc: 'Rent dogs for walks and adventures'
                    },
                    {
                      role: 'owner',
                      icon: '🏠',
                      title: 'Share your dogs',
                      desc: 'List your dogs and earn money'
                    }
                  ].map((option) => (
                    <button
                      key={option.role}
                      onClick={() => setSelectedRole(option.role as 'renter' | 'owner')}
                      style={{
                        padding: '20px 24px',
                        background: selectedRole === option.role 
                          ? 'linear-gradient(135deg, #007cff 0%, #0066dd 100%)' 
                          : '#f8fafc',
                        color: selectedRole === option.role ? 'white' : '#334155',
                        border: selectedRole === option.role 
                          ? 'none' 
                          : '2px solid #e2e8f0',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        boxShadow: selectedRole === option.role 
                          ? '0 8px 24px rgba(0, 124, 255, 0.2)' 
                          : '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: selectedRole === option.role 
                          ? 'rgba(255, 255, 255, 0.2)' 
                          : '#e2e8f0',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        transition: 'all 0.3s'
                      }}>
                        {option.icon}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: '700',
                          marginBottom: '4px'
                        }}>
                          {option.title}
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          opacity: selectedRole === option.role ? 0.9 : 0.7
                        }}>
                          {option.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={!selectedRole}
                className="primary-btn"
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  background: selectedRole 
                    ? 'linear-gradient(135deg, #4285f4 0%, #3367d6 100%)' 
                    : '#e2e8f0',
                  color: selectedRole ? 'white' : '#94a3b8',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: selectedRole ? 'pointer' : 'not-allowed',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: selectedRole 
                    ? '0 8px 24px rgba(66, 133, 244, 0.3)' 
                    : 'none'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {selectedRole ? 'Continue with Google' : 'Select an option above'}
              </button>

              {/* Trust Indicators */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '32px',
                padding: '24px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '16px',
                gap: '20px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #007cff 0%, #0066dd 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    marginBottom: '4px'
                  }}>
                    {loading ? '...' : dogs.filter(dog => dog.isAvailable).length}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#64748b',
                    fontWeight: '600'
                  }}>
                    Available Dogs
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    marginBottom: '4px'
                  }}>
                    {dogs.length}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#64748b',
                    fontWeight: '600'
                  }}>
                    Total Dogs
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    marginBottom: '4px'
                  }}>
                    4.9
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#64748b',
                    fontWeight: '600'
                  }}>
                    Rating
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* Dashboard Content */}
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
                <OwnerDashboard
                  dogs={dogs}
                  onAddDog={() => setShowAddDog(true)}
                  onEditDog={handleEditDog}
                  onDeleteDog={handleDeleteDog}
                  onViewRequests={() => setShowApprovalPanel(true)}
                  onViewEarnings={() => setShowUserProfile(true)}
                  user={userProfile}
                />
              );
            } else if (currentUserRole === 'renter') {
              return (
                <RenterDashboard
                  dogs={dogs}
                  onBrowseDogs={() => setShowMaps(true)}
                  onViewMyRentals={() => setShowUserProfile(true)}
                  onViewFavorites={() => setShowUserProfile(true)}
                  onRentDog={handleRentDog}
                  onMessageDogOwner={handleMessageDogOwner}
                  onViewPendingRequests={() => setShowRenterPendingRequests(true)}
                  user={userProfile}
                />
              );
            }
            return null;
          })()}
        </>
      )}

      {/* Quick Actions Section (for authenticated users) */}
      {user && (
        <section style={{
          background: 'linear-gradient(135deg, #f6f8fc 0%, #e8f2ff 100%)',
          padding: '80px 24px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              margin: '0 0 16px 0',
              fontWeight: '700'
            }}>
              Quick Actions
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#64748b',
              margin: '0 0 60px 0',
              maxWidth: '600px',
              margin: '0 auto 60px auto'
            }}>
              Manage your experience with these convenient shortcuts
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              {/* Only show "Add My Dog" for owners */}
              {(() => {
                let currentUserRole = userProfile?.role || 'owner';
                if (userProfile?.email?.toLowerCase().includes('lucy') || userProfile?.displayName?.toLowerCase().includes('lucy')) {
                  currentUserRole = 'renter';
                }
                
                const actions = [
                  {
                    icon: '📋',
                    title: 'My Requests',
                    desc: 'View and manage rental requests',
                    color: 'linear-gradient(135deg, #007cff 0%, #0066dd 100%)',
                    action: () => setShowApprovalPanel(true)
                  },
                  {
                    icon: '🧹',
                    title: 'Clean Data',
                    desc: 'Remove orphaned data entries',
                    color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    action: handleDataCleanup
                  }
                ];

                if (currentUserRole === 'owner') {
                  actions.unshift({
                    icon: '🐕',
                    title: 'Add My Dog',
                    desc: 'List a new dog for rent',
                    color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    action: () => setShowAddDog(true)
                  });
                }

                return actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    style={{
                      padding: '32px',
                      background: '#ffffff',
                      border: '2px solid #e2e8f0',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      textAlign: 'center',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.1)'
                      e.currentTarget.style.borderColor = '#cbd5e1'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)'
                      e.currentTarget.style.borderColor = '#e2e8f0'
                    }}
                  >
                    <div style={{
                      width: '64px',
                      height: '64px',
                      background: action.color,
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                      margin: '0 auto 20px auto',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
                    }}>
                      {action.icon}
                    </div>
                    <h3 style={{
                      fontSize: '1.3rem',
                      color: '#1e293b',
                      margin: '0 0 8px 0',
                      fontWeight: '700'
                    }}>
                      {action.title}
                    </h3>
                    <p style={{
                      color: '#64748b',
                      margin: 0,
                      fontSize: '1rem',
                      lineHeight: '1.5'
                    }}>
                      {action.desc}
                    </p>
                  </button>
                ));
              })()}
            </div>
          </div>
        </section>
      )}

      {/* Dog Listings Section */}
      {dogs.length > 0 && !userProfile && (
        <section style={{
          background: '#ffffff',
          padding: '100px 24px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '60px'
            }}>
              <h2 style={{
                fontSize: '2.5rem',
                background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                margin: '0 0 16px 0',
                fontWeight: '700'
              }}>
                Available Dogs
              </h2>
              <p style={{
                fontSize: '1.2rem',
                color: '#64748b',
                margin: 0,
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Discover amazing dogs ready for their next adventure with you
              </p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '32px'
            }}>
              {dogs.map((dog) => (
                <DogCard
                  key={dog.id}
                  dog={dog}
                  onEdit={handleEditDog}
                  onDelete={handleDeleteDog}
                  onRent={handleRentDog}
                  onMessage={handleMessageDogOwner}
                  currentUserId={user?.uid}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Services Section */}
      <section style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: '100px 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '80px'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #007cff 0%, #0066dd 100%)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '50px',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              ✨ Our Services
            </div>
            <h2 style={{
              fontSize: '3rem',
              background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              margin: '0 0 24px 0',
              fontWeight: '800',
              letterSpacing: '-0.02em'
            }}>
              Everything your dog needs
            </h2>
            <p style={{
              fontSize: '1.3rem',
              color: '#64748b',
              margin: 0,
              lineHeight: '1.6',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              Comprehensive care and companionship services designed with love and expertise
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '32px'
          }}>
            {[
              {
                icon: '🐕',
                title: 'Dog Rental',
                desc: 'Book trusted, loving dogs for walks, companionship, and outdoor adventures. Perfect for busy schedules or therapeutic companionship.',
                gradient: 'linear-gradient(135deg, #007cff 0%, #0066dd 100%)',
                features: ['Verified dogs', 'Flexible booking', 'Insurance covered']
              },
              {
                icon: '🏠',
                title: 'Dog Hosting',
                desc: 'Provide a safe, loving home environment for dogs when their owners travel. Earn income while giving dogs the care they deserve.',
                gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                features: ['Background checks', 'Daily updates', 'Emergency support']
              },
              {
                icon: '🚶',
                title: 'Dog Walking',
                desc: 'Professional walking services ensuring your dog gets proper exercise and socialization with experienced handlers.',
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                features: ['GPS tracking', 'Photo updates', 'Flexible schedules']
              },
              {
                icon: '🏫',
                title: 'Dog Day Care',
                desc: 'Supervised playtime and socialization in a safe environment while you work. Professional staff and secure facilities.',
                gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                features: ['Supervised play', 'Climate controlled', 'Live cameras']
              },
              {
                icon: '🎓',
                title: 'Dog Training',
                desc: 'Expert training programs for obedience, behavior modification, and specialized skills. Build stronger bonds with professional guidance.',
                gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                features: ['Certified trainers', 'Custom programs', 'Progress tracking']
              },
              {
                icon: '👥',
                title: 'Community',
                desc: 'Connect with fellow dog lovers, share experiences, and build lasting friendships in your neighborhood pet community.',
                gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                features: ['Local meetups', 'Expert advice', 'Social events']
              }
            ].map((service, index) => (
              <div
                key={index}
                style={{
                  background: '#ffffff',
                  padding: '40px',
                  borderRadius: '24px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Gradient accent */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: service.gradient
                }} />
                
                <div style={{
                  width: '72px',
                  height: '72px',
                  background: service.gradient,
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  marginBottom: '24px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
                }}>
                  {service.icon}
                </div>
                
                <h3 style={{
                  fontSize: '1.6rem',
                  color: '#1e293b',
                  margin: '0 0 16px 0',
                  fontWeight: '700'
                }}>
                  {service.title}
                </h3>
                
                <p style={{
                  color: '#64748b',
                  lineHeight: '1.6',
                  margin: '0 0 24px 0',
                  fontSize: '1rem'
                }}>
                  {service.desc}
                </p>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {service.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem',
                        color: '#64748b'
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        background: service.gradient,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                      }}>
                        ✓
                      </div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: '80px 24px 40px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '60px',
            marginBottom: '60px'
          }}>
            {/* Brand Section */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #007cff 0%, #0066dd 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  🐕
                </div>
                <h3 style={{
                  fontSize: '1.8rem',
                  margin: 0,
                  fontWeight: '800'
                }}>
                  DogRental
                </h3>
              </div>
              <p style={{
                margin: '0 0 24px 0',
                opacity: 0.8,
                lineHeight: '1.6',
                fontSize: '1.1rem'
              }}>
                Connecting dog lovers with trusted companions. Building stronger communities through the love of pets.
              </p>
              <div style={{
                display: 'flex',
                gap: '16px'
              }}>
                {['📧', '📱', '🌐'].map((icon, index) => (
                  <div
                    key={index}
                    style={{
                      width: '44px',
                      height: '44px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 style={{
                fontSize: '1.2rem',
                margin: '0 0 24px 0',
                fontWeight: '700'
              }}>
                Services
              </h4>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {['Dog Rental', 'Dog Hosting', 'Dog Walking', 'Day Care', 'Training'].map((service) => (
                  <a
                    key={service}
                    href="#"
                    style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      textDecoration: 'none',
                      fontSize: '1rem',
                      transition: 'all 0.3s',
                      padding: '4px 0'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'white'
                      e.currentTarget.style.paddingLeft = '8px'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
                      e.currentTarget.style.paddingLeft = '0'
                    }}
                  >
                    {service}
                  </a>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 style={{
                fontSize: '1.2rem',
                margin: '0 0 24px 0',
                fontWeight: '700'
              }}>
                Support
              </h4>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {['Help Center', 'Safety', 'Community Guidelines', 'Contact Us'].map((item) => (
                  <a
                    key={item}
                    href="#"
                    style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      textDecoration: 'none',
                      fontSize: '1rem',
                      transition: 'all 0.3s',
                      padding: '4px 0'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'white'
                      e.currentTarget.style.paddingLeft = '8px'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
                      e.currentTarget.style.paddingLeft = '0'
                    }}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h4 style={{
                fontSize: '1.2rem',
                margin: '0 0 24px 0',
                fontWeight: '700'
              }}>
                Stay Updated
              </h4>
              <p style={{
                margin: '0 0 20px 0',
                opacity: 0.8,
                fontSize: '1rem'
              }}>
                Get the latest updates and tips for pet care
              </p>
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
                <button
                  style={{
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #007cff 0%, #0066dd 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.3s'
                  }}
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{
            paddingTop: '40px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{
              opacity: 0.8,
              fontSize: '1rem'
            }}>
              © 2024 DogRental. Made with ❤️ for dog lovers everywhere.
            </div>
            <div style={{
              display: 'flex',
              gap: '32px'
            }}>
              {['Privacy Policy', 'Terms of Service', 'Cookies'].map((item) => (
                <a
                  key={item}
                  href="#"
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    transition: 'color 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
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
