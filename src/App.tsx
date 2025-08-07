import { useState, useEffect } from 'react'
import './App.css'
import { FirebaseProvider } from './contexts/FirebaseContext'
import { useFirebase } from './contexts/FirebaseContext'
import AddDogForm from './components/Dogs/AddDogForm'
import DogCard from './components/Dogs/DogCard'
import EditDogForm from './components/Dogs/EditDogForm'
import RentalRequestForm from './components/Rentals/RentalRequestForm'
import RentalApprovalPanel from './components/Rentals/RentalApprovalPanel'
import NotificationBell from './components/Notifications/NotificationBell'
import UserProfile from './components/User/UserProfile'
import { cleanupOrphanedData } from './utils/dataCleanup'
import { collection, getDocs } from 'firebase/firestore'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useNotificationService } from './services/notificationService'
import { useUserService } from './services/userService'

function AppContent() {
  const [user, setUser] = useState<any>(null)
  const [showAddDog, setShowAddDog] = useState(false)
  const [showEditDog, setShowEditDog] = useState(false)
  const [showRentDog, setShowRentDog] = useState(false)
  const [showApprovalPanel, setShowApprovalPanel] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [editingDog, setEditingDog] = useState<any>(null)
  const [rentingDog, setRentingDog] = useState<any>(null)
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const { auth, db } = useFirebase()
  const notificationService = useNotificationService()
  const userService = useUserService()

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
        
        // Create welcome notification for new users
        try {
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
        // Create new user profile
        console.log('Creating new user profile...');
        await userService.createUser(user.uid, {
          email: user.email,
          displayName: user.displayName || user.email,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber,
          location: '',
          bio: ''
        });
        console.log('New user profile created successfully!');
      } else {
        // Update existing user profile with latest info
        console.log('Updating existing user profile...');
        await userService.updateUser(user.uid, {
          displayName: user.displayName || user.email,
          photoURL: user.photoURL,
          email: user.email
        });
        console.log('User profile updated successfully!');
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
    setRentingDog(dog)
    setShowRentDog(true)
  }

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
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Failed to sign in with Google. Please try again.');
    }
  };



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
        background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          maxWidth: '1000px',
          width: '100%',
          margin: '0 auto'
        }}>
          {/* Form Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '40px',
            paddingBottom: '20px',
            borderBottom: '2px solid #f7fafc'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '15px'
            }}>
              📋
            </div>
            <h2 style={{
              fontSize: '2.5rem',
              color: '#2d3748',
              margin: '0 0 10px 0',
              fontWeight: 'bold'
            }}>
              Rental Request Management
            </h2>
            <p style={{
              color: '#4a5568',
              fontSize: '1.1rem',
              margin: 0,
              lineHeight: '1.6'
            }}>
              Review and manage pending rental requests for your dogs
            </p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '30px'
          }}>
            <button
              onClick={() => setShowApprovalPanel(false)}
              style={{
                padding: '15px 30px',
                backgroundColor: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s',
                minWidth: '120px'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4a5568'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#718096'}
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

  if (showUserProfile) {
    return (
      <UserProfile
        userId={user.uid}
        onClose={() => setShowUserProfile(false)}
      />
    )
  }

    return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '0'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '15px 40px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }} className="mobile-header">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto'
        }} className="mobile-header-content">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px'
          }} className="mobile-nav">
            <h1 style={{
              fontSize: '2rem',
              color: '#2d3748',
              margin: 0,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }} className="mobile-logo">
              🐕 DogRental
            </h1>
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              marginLeft: '40px'
            }} className="mobile-nav-links">
              <a href="#" style={{ 
                color: '#4a5568', 
                textDecoration: 'none', 
                fontWeight: '500'
              }}>Browse Dogs</a>
              <a href="#" style={{ 
                color: '#4a5568', 
                textDecoration: 'none', 
                fontWeight: '500'
              }}>Add Your Dog</a>
              <a href="#" style={{ 
                color: '#4a5568', 
                textDecoration: 'none', 
                fontWeight: '500'
              }}>My Rentals</a>
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px'
          }} className="mobile-auth">
            {user ? (
              <>
                <NotificationBell userId={user.uid} />
                <div style={{
                  padding: '6px 12px',
                  backgroundColor: '#48bb78',
                  color: 'white',
                  borderRadius: '15px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  🔥 Connected
                </div>
                <button
                  onClick={() => setShowUserProfile(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: '#4a5568',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Profile
                </button>
                <button
                  onClick={() => auth.signOut()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: '#4a5568',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleGoogleSignIn}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#4285f4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  className="mobile-signin-btn"
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3367d6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4285f4'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }} className="mobile-hero">
        <div style={{
          maxWidth: '1200px',
          width: '100%',
          padding: '0 40px',
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '60px',
          alignItems: 'center'
        }} className="mobile-hero-content">
          {/* Hero Text */}
          <div style={{ color: 'white' }} className="mobile-hero-text">
            <h2 style={{
              fontSize: '3rem',
              margin: '0 0 20px 0',
              fontWeight: 'bold',
              lineHeight: '1.2'
            }}>
              Loving dog companions for every moment
            </h2>
            <p style={{
              fontSize: '1.3rem',
              margin: '0 0 30px 0',
              lineHeight: '1.6',
              opacity: 0.9
            }}>
              Book trusted dogs for walks, companionship, and adventures. Perfect for busy days or when you need a furry friend.
            </p>
            {user ? (
              <div style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'center'
              }} className="mobile-stats">
                <span style={{
                  fontSize: '1.1rem',
                  opacity: 0.9
                }}>
                  📊 <strong>{loading ? '...' : dogs.filter(dog => dog.isAvailable).length}</strong> dogs available
                </span>
                <span style={{
                  fontSize: '1.1rem',
                  opacity: 0.9
                }}>
                  👥 Trusted by <strong>100+</strong> pet lovers
                </span>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'center'
              }} className="mobile-stats">
                <span style={{
                  fontSize: '1.1rem',
                  opacity: 0.9
                }}>
                  🔐 Sign in to start renting dogs
                </span>
                <span style={{
                  fontSize: '1.1rem',
                  opacity: 0.9
                }}>
                  👥 Join <strong>100+</strong> pet lovers
                </span>
              </div>
            )}
          </div>

          {/* Search Form / Quick Actions */}
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            {user ? (
              <>
                <h3 style={{
                  fontSize: '1.8rem',
                  color: '#2d3748',
                  margin: '0 0 20px 0',
                  fontWeight: 'bold'
                }}>
                  Find your perfect companion
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                  marginBottom: '30px'
                }} className="mobile-actions">
                  <button
                    onClick={() => setShowAddDog(true)}
                    style={{
                      padding: '15px 20px',
                      backgroundColor: '#48bb78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                    className="mobile-action-btn"
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#38a169'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#48bb78'}
                  >
                    🐕 Add My Dog
                  </button>
                  <button
                    onClick={() => setShowApprovalPanel(true)}
                    style={{
                      padding: '15px 20px',
                      backgroundColor: '#4299e1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                    className="mobile-action-btn"
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3182ce'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4299e1'}
                  >
                    📋 My Requests
                  </button>
                  <button
                    onClick={handleDataCleanup}
                    style={{
                      padding: '15px 20px',
                      backgroundColor: '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                    className="mobile-action-btn"
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c53030'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e53e3e'}
                  >
                    🧹 Clean Data
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{
                  fontSize: '1.8rem',
                  color: '#2d3748',
                  margin: '0 0 20px 0',
                  fontWeight: 'bold'
                }}>
                  Join DogRental today
                </h3>
                <p style={{
                  color: '#4a5568',
                  margin: '0 0 30px 0',
                  lineHeight: '1.6'
                }}>
                  Sign in to start renting dogs or list your dogs for rent
                </p>
                <button
                  onClick={handleGoogleSignIn}
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    backgroundColor: '#4285f4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  className="mobile-signin-btn"
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3367d6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4285f4'}
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

            {/* Quick Stats */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#f7fafc',
              borderRadius: '10px',
              gap: '15px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#2d3748',
                  marginBottom: '5px'
                }}>
                  {loading ? '...' : dogs.filter(dog => dog.isAvailable).length}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#4a5568'
                }}>
                  Available Dogs
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#2d3748',
                  marginBottom: '5px'
                }}>
                  {dogs.length}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#4a5568'
                }}>
                  Total Dogs
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dog Listings Section */}
      {dogs.length > 0 && (
        <div style={{
          background: 'white',
          padding: '60px 40px'
        }} className="mobile-dogs-section">
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              color: '#2d3748',
              margin: '0 0 40px 0',
              fontWeight: 'bold',
              textAlign: 'center'
            }} className="mobile-dogs-title">
              🐕 Available Dogs
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '30px'
            }} className="mobile-dogs-grid">
              {dogs.map((dog) => (
                <DogCard
                  key={dog.id}
                  dog={dog}
                  onEdit={handleEditDog}
                  onDelete={handleDeleteDog}
                  onRent={handleRentDog}
                  currentUserId={user.uid}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Services Section */}
      <div style={{
        background: '#f7fafc',
        padding: '80px 40px'
      }} className="mobile-services-section">
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            color: '#2d3748',
            margin: '0 0 20px 0',
            fontWeight: 'bold',
            textAlign: 'center'
          }} className="mobile-services-title">
            Our Services
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: '#4a5568',
            margin: '0 0 60px 0',
            textAlign: 'center',
            lineHeight: '1.6'
          }} className="mobile-services-subtitle">
            Discover the perfect way to connect with dogs in your neighborhood
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '30px'
          }} className="mobile-services-grid">
            {/* Dog Rental */}
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '2px solid #e2e8f0'
            }} className="mobile-service-card">
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                🐕
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#2d3748',
                margin: '0 0 15px 0',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Dog Rental
              </h3>
              <p style={{
                color: '#4a5568',
                lineHeight: '1.6',
                margin: 0,
                textAlign: 'center'
              }}>
                Rent trusted dogs for walks, companionship, and adventures. Perfect for busy days or when you need a furry friend.
              </p>
            </div>

            {/* Dog Hosting */}
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '2px solid #e2e8f0'
            }} className="mobile-service-card">
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                🏠
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#2d3748',
                margin: '0 0 15px 0',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Dog Hosting
              </h3>
              <p style={{
                color: '#4a5568',
                lineHeight: '1.6',
                margin: 0,
                textAlign: 'center'
              }}>
                Host dogs in your home when their owners are away. Provide a loving environment and earn extra income.
              </p>
            </div>

            {/* Dog Walking */}
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '2px solid #e2e8f0'
            }} className="mobile-service-card">
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                🚶
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#2d3748',
                margin: '0 0 15px 0',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Dog Walking
              </h3>
              <p style={{
                color: '#4a5568',
                lineHeight: '1.6',
                margin: 0,
                textAlign: 'center'
              }}>
                Professional dog walking services for busy pet parents. Regular exercise and outdoor adventures for your furry friends.
              </p>
            </div>

            {/* Dog Day Care */}
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '2px solid #e2e8f0'
            }} className="mobile-service-card">
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                🏫
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#2d3748',
                margin: '0 0 15px 0',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Dog Day Care
              </h3>
              <p style={{
                color: '#4a5568',
                lineHeight: '1.6',
                margin: 0,
                textAlign: 'center'
              }}>
                Safe and fun day care for dogs while you're at work. Socialization, playtime, and supervision in a loving environment.
              </p>
            </div>

            {/* Dog Training */}
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '2px solid #e2e8f0'
            }} className="mobile-service-card">
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                🎓
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#2d3748',
                margin: '0 0 15px 0',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Dog Training
              </h3>
              <p style={{
                color: '#4a5568',
                lineHeight: '1.6',
                margin: 0,
                textAlign: 'center'
              }}>
                Professional training services for obedience, behavior modification, and specialized skills. Build a stronger bond with your dog.
              </p>
            </div>

            {/* Community */}
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '2px solid #e2e8f0'
            }} className="mobile-service-card">
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                👥
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#2d3748',
                margin: '0 0 15px 0',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Community
              </h3>
              <p style={{
                color: '#4a5568',
                lineHeight: '1.6',
                margin: 0,
                textAlign: 'center'
              }}>
                Connect with fellow dog lovers in your neighborhood. Share experiences, tips, and build lasting friendships.
              </p>
            </div>
          </div>
        </div>
      </div>

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
