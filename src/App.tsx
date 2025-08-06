import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { FirebaseProvider } from './contexts/FirebaseContext'
import { useFirebase } from './contexts/FirebaseContext'
import Login from './components/Auth/Login'
import AddDogForm from './components/Dogs/AddDogForm'
import DogCard from './components/Dogs/DogCard'
import EditDogForm from './components/Dogs/EditDogForm'
import { collection, addDoc, getDocs, orderBy, Timestamp } from 'firebase/firestore'

function AppContent() {
  const [count, setCount] = useState(0)
  const [firebaseStatus, setFirebaseStatus] = useState('Checking...')
  const [user, setUser] = useState<any>(null)
  const [showAddDog, setShowAddDog] = useState(false)
  const [showEditDog, setShowEditDog] = useState(false)
  const [editingDog, setEditingDog] = useState<any>(null)
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const { auth, db } = useFirebase()

  useEffect(() => {
    console.log('Firebase Auth initialized:', auth)
    console.log('Current user:', auth.currentUser)
    setFirebaseStatus('Connected!')

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user)
      setUser(user)
      if (user) {
        loadDogs()
      }
    })

    return () => unsubscribe()
  }, [auth])

  const loadDogs = async () => {
    if (!user) return
    setLoading(true)
    try {
      console.log('Loading dogs from database...')
      const querySnapshot = await getDocs(collection(db, 'dogs'))
      const allDogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log('Dogs loaded:', allDogs)
      setDogs(allDogs)
    } catch (error) {
      console.error('Error loading dogs:', error)
    } finally {
      setLoading(false)
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

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#2d3748',
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            🐕 Dog Rental App
          </h1>
          <p style={{
            color: '#4a5568',
            fontSize: '1.1rem',
            marginBottom: '30px'
          }}>
            Find the perfect companion for your day
          </p>
          <div style={{
            padding: '15px',
            backgroundColor: '#f7fafc',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ color: 'green', fontWeight: 'bold', margin: 0 }}>
              🔥 Firebase Status: {firebaseStatus}
            </p>
          </div>
          <Login />
        </div>
      </div>
    )
  }

  if (showAddDog) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '30px',
            paddingBottom: '20px',
            borderBottom: '2px solid #f7fafc'
          }}>
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                color: '#2d3748',
                margin: 0,
                fontWeight: 'bold'
              }}>
                🐕 Dog Rental App
              </h1>
              <p style={{
                color: '#4a5568',
                fontSize: '1.1rem',
                margin: '5px 0 0 0'
              }}>
                Add Your Dog for Rent
              </p>
            </div>
            <button
              onClick={() => setShowAddDog(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4a5568'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#718096'}
            >
              ← Back to Dashboard
            </button>
          </div>
          <AddDogForm
            onSuccess={handleAddDogSuccess}
            onCancel={() => setShowAddDog(false)}
          />
        </div>
      </div>
    )
  }

  if (showEditDog && editingDog) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '30px',
            paddingBottom: '20px',
            borderBottom: '2px solid #f7fafc'
          }}>
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                color: '#2d3748',
                margin: 0,
                fontWeight: 'bold'
              }}>
                🐕 Dog Rental App
              </h1>
              <p style={{
                color: '#4a5568',
                fontSize: '1.1rem',
                margin: '5px 0 0 0'
              }}>
                Edit {editingDog.name}
              </p>
            </div>
            <button
              onClick={() => {
                setShowEditDog(false)
                setEditingDog(null)
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4a5568'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#718096'}
            >
              ← Back to Dashboard
            </button>
          </div>
          <EditDogForm
            dog={editingDog}
            onSuccess={handleEditDogSuccess}
            onCancel={() => {
              setShowEditDog(false)
              setEditingDog(null)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #f7fafc'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              color: '#2d3748',
              margin: 0,
              fontWeight: 'bold'
            }}>
              🐕 Dog Rental App
            </h1>
            <p style={{
              color: '#4a5568',
              fontSize: '1.1rem',
              margin: '5px 0 0 0'
            }}>
              Welcome back, {user.displayName || user.email}!
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#48bb78',
              color: 'white',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              🔥 Connected
            </div>
            <button
              onClick={() => auth.signOut()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c53030'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e53e3e'}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          marginTop: '30px'
        }}>
          {/* Quick Stats */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.5rem' }}>
              📊 Dashboard
            </h3>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '10px' }}>
              {loading ? '...' : dogs.length}
            </div>
            <p style={{ margin: 0, opacity: 0.9 }}>Dogs Available</p>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: '#f7fafc',
            padding: '30px',
            borderRadius: '15px',
            border: '2px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>
              🚀 Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#38a169'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#48bb78'}
              >
                ➕ Add Your Dog
              </button>
              <button style={{
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
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3182ce'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4299e1'}
              >
                🔍 Browse Dogs
              </button>
              <button style={{
                padding: '15px 20px',
                backgroundColor: '#ed8936',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dd6b20'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ed8936'}
              >
                📅 My Rentals
              </button>
            </div>
          </div>

          {/* Coming Soon */}
          <div style={{
            background: '#fff5f5',
            padding: '30px',
            borderRadius: '15px',
            border: '2px solid #fed7d7'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#c53030' }}>
              🚧 Coming Soon
            </h3>
            <ul style={{
              color: '#744210',
              lineHeight: '1.6',
              paddingLeft: '20px',
              margin: 0
            }}>
              <li>Rental System</li>
              <li>Image Upload</li>
              <li>Search & Filter</li>
              <li>Payment Integration</li>
            </ul>
          </div>
        </div>

        {/* Dog Listings */}
        {dogs.length > 0 && (
          <div style={{
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '2px solid #f7fafc'
          }}>
            <h2 style={{
              fontSize: '2rem',
              color: '#2d3748',
              margin: '0 0 30px 0',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              🐕 Available Dogs
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '25px'
            }}>
              {dogs.map((dog) => (
                <DogCard
                  key={dog.id}
                  dog={dog}
                  onEdit={handleEditDog}
                  onDelete={handleDeleteDog}
                  currentUserId={user.uid}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '2px solid #f7fafc',
          textAlign: 'center',
          color: '#718096'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Built with React, TypeScript, and Firebase
          </p>
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
