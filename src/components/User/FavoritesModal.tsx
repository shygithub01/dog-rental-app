import React, { useState, useEffect } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface FavoritesModalProps {
  currentUserId: string;
  onClose: () => void;
  onBrowseDogs: () => void;
}

interface Dog {
  id: string;
  name: string;
  breed: string;
  age: number;
  size: string;
  pricePerDay: number;
  location: string;
  imageUrl?: string;
  ownerName: string;
  isAvailable: boolean;
}

const FavoritesModal: React.FC<FavoritesModalProps> = ({ currentUserId, onClose, onBrowseDogs }) => {
  const { db } = useFirebase();
  const [favoriteDogs, setFavoriteDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoriteDogs();
  }, [currentUserId]);

  const loadFavoriteDogs = async () => {
    try {
      // Get user's favorite dog IDs
      const userRef = doc(db, 'users', currentUserId);
      const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', currentUserId)));
      
      if (userDoc.empty) {
        setLoading(false);
        return;
      }

      const userData = userDoc.docs[0].data();
      const favoriteDogIds = userData.favoriteDogs || [];

      if (favoriteDogIds.length === 0) {
        setFavoriteDogs([]);
        setLoading(false);
        return;
      }

      // Get the actual dog data for favorite dogs
      const dogsQuery = query(collection(db, 'dogs'), where('id', 'in', favoriteDogIds));
      const dogsSnapshot = await getDocs(dogsQuery);
      
      const dogs = dogsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Dog[];

      setFavoriteDogs(dogs);
    } catch (error) {
      console.error('Error loading favorite dogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (dogId: string) => {
    try {
      const userRef = doc(db, 'users', currentUserId);
      await updateDoc(userRef, {
        favoriteDogs: arrayRemove(dogId)
      });
      
      // Update local state
      setFavoriteDogs(prev => prev.filter(dog => dog.id !== dogId));
    } catch (error) {
      console.error('Error removing from favorites:', error);
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
          <p>Loading your favorites...</p>
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
      background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '1000px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❤️</div>
          <h2 style={{
            fontSize: '2.5rem',
            color: '#2d3748',
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }}>
            Your Favorite Dogs
          </h2>
          <p style={{
            color: '#4a5568',
            fontSize: '1.1rem',
            margin: 0
          }}>
            Dogs you've marked as favorites for future rentals
          </p>
        </div>

        {/* Close Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#718096',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Favorites Content */}
        {favoriteDogs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#f7fafc',
            borderRadius: '20px',
            border: '2px dashed #cbd5e0'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💔</div>
            <h3 style={{
              fontSize: '1.5rem',
              color: '#2d3748',
              margin: '0 0 15px 0',
              fontWeight: 'bold'
            }}>
              No favorites yet
            </h3>
            <p style={{
              color: '#4a5568',
              margin: '0 0 25px 0',
              fontSize: '1.1rem'
            }}>
              Start browsing dogs and add your favorites by clicking the heart icon
            </p>
            <button
              onClick={onBrowseDogs}
              style={{
                padding: '12px 24px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              Browse Dogs
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {favoriteDogs.map((dog) => (
              <div key={dog.id} style={{
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '15px',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '15px',
                    background: dog.imageUrl ? `url(${dog.imageUrl})` : '#e2e8f0',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    {!dog.imageUrl && '🐕'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.2rem',
                      color: '#2d3748',
                      margin: '0 0 5px 0',
                      fontWeight: 'bold'
                    }}>
                      {dog.name}
                    </h3>
                    <p style={{
                      color: '#4a5568',
                      margin: '0 0 5px 0',
                      fontSize: '0.9rem'
                    }}>
                      {dog.breed}
                    </p>
                    <p style={{
                      color: '#718096',
                      margin: 0,
                      fontSize: '0.8rem'
                    }}>
                      Owner: {dog.ownerName}
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <span style={{
                    color: '#4a5568',
                    fontSize: '0.9rem'
                  }}>
                    Age: {dog.age} years
                  </span>
                  <span style={{
                    color: '#4a5568',
                    fontSize: '0.9rem'
                  }}>
                    Size: {dog.size}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <span style={{
                    color: '#48bb78',
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}>
                    ${dog.pricePerDay}/day
                  </span>
                  <span style={{
                    color: '#4a5568',
                    fontSize: '0.9rem'
                  }}>
                    {dog.location}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <button
                    onClick={() => removeFromFavorites(dog.id)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}
                  >
                    ❌ Remove from Favorites
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesModal;
