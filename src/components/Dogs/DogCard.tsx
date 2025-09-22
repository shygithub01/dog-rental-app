import React, { useState, useEffect } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, deleteDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import PhotoCarousel from '../Common/PhotoCarousel';

interface Dog {
  id: string;
  name: string;
  breed: string;
  age: number;
  size: 'small' | 'medium' | 'large';
  description: string;
  pricePerDay: number;
  imageUrl?: string; // Keep for backward compatibility
  imageUrls?: string[]; // New multiple images field
  location: string;
  ownerId: string;
  ownerName: string;
  isAvailable: boolean;
  status?: 'available' | 'requested' | 'rented';
  createdAt: any;
  updatedAt: any;
  // Personality fields
  temperament?: string[];
  goodWith?: string[];
  activityLevel?: string;
  specialNotes?: string;
}

interface DogCardProps {
  dog: Dog;
  onEdit: (dog: Dog) => void;
  onDelete: () => void;
  onRent?: (dog: Dog) => void;
  onMessage?: (dog: Dog) => void;
  currentUserId: string;
}

const DogCard: React.FC<DogCardProps> = ({ dog, onEdit, onDelete, onRent, onMessage, currentUserId }) => {
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const { db } = useFirebase();
  const isOwner = dog.ownerId === currentUserId;

  // Check if dog is in user's favorites
  useEffect(() => {
    const checkIfFavorite = async () => {
      if (!currentUserId) return;
      
      try {
        const userRef = doc(db, 'users', currentUserId);
        const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', currentUserId)));
        
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          const favoriteDogIds = userData.favoriteDogs || [];
          setIsFavorite(favoriteDogIds.includes(dog.id));
        }
      } catch (error) {
        console.error('Error checking favorites:', error);
      }
    };

    checkIfFavorite();
  }, [currentUserId, dog.id, db]);

  const toggleFavorite = async () => {
    if (!currentUserId) return;
    
    setFavoritesLoading(true);
    try {
      const userRef = doc(db, 'users', currentUserId);
      
      if (isFavorite) {
        // Remove from favorites
        await updateDoc(userRef, {
          favoriteDogs: arrayRemove(dog.id)
        });
        setIsFavorite(false);
      } else {
        // Add to favorites
        await updateDoc(userRef, {
          favoriteDogs: arrayUnion(dog.id)
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleDelete = async () => {
    // Check if dog has pending requests or is rented
    if (dog.status === 'requested' || dog.status === 'rented' || !dog.isAvailable) {
      alert(`Cannot delete ${dog.name} while it has pending requests or is currently rented. Please wait until the rental period ends.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${dog.name}?`)) {
      return;
    }

    setLoading(true);
    try {
      // Delete the dog
      await deleteDoc(doc(db, 'dogs', dog.id));
      console.log('Dog deleted successfully!');

      // Clean up any pending rental requests for this dog
      const requestsQuery = query(
        collection(db, 'rentalRequests'),
        where('dogId', '==', dog.id)
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      
      const deletePromises = requestsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`Cleaned up ${requestsSnapshot.size} rental requests for deleted dog`);
      onDelete();
    } catch (error) {
      console.error('Error deleting dog:', error);
      alert('Failed to delete dog. Please try again.');
    } finally {
      setLoading(false);
    }
  };





  return (
    <div style={{
      background: 'white',
      borderRadius: '15px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '2px solid #e2e8f0',
      transition: 'all 0.2s',
      position: 'relative'
    }}
    className="mobile-dog-card"
    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Status Badge */}
      <div style={{
        position: 'absolute',
        top: '15px',
        right: '15px',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        backgroundColor: dog.isAvailable ? '#FF6B35' : 
                       dog.status === 'requested' ? '#2DD4BF' : '#e53e3e',
        color: 'white',
        zIndex: 10
      }} className="mobile-status-badge">
        {dog.isAvailable ? 'Available' : 
         dog.status === 'requested' ? 'Requested' : 'Rented'}
      </div>

      {/* Dog Photo Carousel */}
      <div className="mobile-dog-image">
        <PhotoCarousel
          images={dog.imageUrls && dog.imageUrls.length > 0 ? dog.imageUrls : (dog.imageUrl ? [dog.imageUrl] : [])}
          dogName={dog.name}
          height="250px"
          showCounter={true}
          showDots={true}
        />
      </div>

      {/* Dog Info */}
      <div style={{ 
        padding: '25px'
      }} className="mobile-dog-info">
        <div style={{ 
          marginBottom: '20px'
        }} className="mobile-dog-details">
          <h3 style={{
            fontSize: '1.5rem',
            color: '#2d3748',
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }} className="mobile-dog-name">
            {dog.name}
          </h3>
          <p style={{
            color: '#4a5568',
            margin: '0 0 8px 0',
            fontSize: '1.1rem'
          }} className="mobile-dog-breed">
            {dog.breed} • {dog.age} year{dog.age !== 1 ? 's' : ''} old
          </p>
          <p style={{
            color: '#FF6B35',
            margin: '0 0 8px 0',
            fontSize: '0.9rem',
            textTransform: 'capitalize'
          }} className="mobile-dog-meta">
            Size: {dog.size} • Location: {dog.location}
          </p>
          <p style={{
            color: '#2d3748',
            margin: '0 0 15px 0',
            lineHeight: '1.5',
            fontSize: '0.95rem'
          }} className="mobile-dog-description">
            {dog.description}
          </p>

          {/* Personality Traits */}
          {((dog.temperament && dog.temperament.length > 0) || (dog.goodWith && dog.goodWith.length > 0) || dog.activityLevel) && (
            <div style={{ marginBottom: '15px' }}>
              {/* Temperament */}
              {dog.temperament && dog.temperament.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px'
                  }}>
                    {dog.temperament.slice(0, 3).map((trait: string) => (
                      <span
                        key={trait}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: '#FF6B35',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        {trait}
                      </span>
                    ))}
                    {dog.temperament.length > 3 && (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        backgroundColor: '#e2e8f0',
                        color: '#6b7280',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        +{dog.temperament.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Good With (show max 2) */}
              {dog.goodWith && dog.goodWith.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px'
                  }}>
                    {dog.goodWith.slice(0, 2).map((trait: string) => (
                      <span
                        key={trait}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: '#2DD4BF',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        👨‍👩‍👧‍👦 {trait}
                      </span>
                    ))}
                    {dog.goodWith.length > 2 && (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        backgroundColor: '#e2e8f0',
                        color: '#6b7280',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        +{dog.goodWith.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Activity Level */}
              {dog.activityLevel && (
                <div>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#FDE047',
                      color: '#92400e',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}
                  >
                    ⚡ {dog.activityLevel} Energy
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f7fafc',
          borderRadius: '10px'
        }} className="mobile-dog-price">
          <div>
            <p style={{
              color: '#4a5568',
              margin: '0 0 5px 0',
              fontSize: '0.9rem'
            }}>
              Price per day
            </p>
            <p style={{
              color: '#2d3748',
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              ${dog.pricePerDay}
            </p>
          </div>
          <div style={{
            textAlign: 'right'
          }}>
            <p style={{
              color: '#4a5568',
              margin: '0 0 5px 0',
              fontSize: '0.9rem'
            }}>
              Owner
            </p>
            <p style={{
              color: '#2d3748',
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              {dog.ownerName}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }} className="mobile-dog-actions">
          {isOwner ? (
            <>
              <button
                onClick={() => onEdit(dog)}
                disabled={loading || dog.status === 'requested' || dog.status === 'rented' || !dog.isAvailable}
                style={{
                  padding: '8px 16px',
                  backgroundColor: (dog.status === 'requested' || dog.status === 'rented' || !dog.isAvailable) ? '#cbd5e0' : '#FF6B35',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (loading || dog.status === 'requested' || dog.status === 'rented' || !dog.isAvailable) ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}
                className="mobile-action-btn"
                onMouseOver={(e) => {
                  if (!loading && dog.status !== 'requested' && dog.status !== 'rented' && dog.isAvailable) e.currentTarget.style.backgroundColor = '#FF8E53';
                }}
                onMouseOut={(e) => {
                  if (!loading && dog.status !== 'requested' && dog.status !== 'rented' && dog.isAvailable) e.currentTarget.style.backgroundColor = '#FF6B35';
                }}
                title={(dog.status === 'requested' || dog.status === 'rented' || !dog.isAvailable) ? 'Cannot edit while dog is rented or has pending requests' : 'Edit dog details'}
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || dog.status === 'requested' || dog.status === 'rented' || !dog.isAvailable}
                style={{
                  padding: '8px 16px',
                  backgroundColor: (loading || dog.status === 'requested' || dog.status === 'rented' || !dog.isAvailable) ? '#cbd5e0' : '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (loading || dog.status === 'requested' || dog.status === 'rented' || !dog.isAvailable) ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}
                className="mobile-action-btn"
                onMouseOver={(e) => {
                  if (!loading && dog.status !== 'requested' && dog.status !== 'rented' && dog.isAvailable) e.currentTarget.style.backgroundColor = '#c53030';
                }}
                onMouseOut={(e) => {
                  if (!loading && dog.status !== 'requested' && dog.status !== 'rented' && dog.isAvailable) e.currentTarget.style.backgroundColor = '#e53e3e';
                }}
                title={(dog.status === 'requested' || dog.status === 'rented' || !dog.isAvailable) ? 'Cannot delete while dog is rented or has pending requests' : 'Delete dog'}
              >
                {loading ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onMessage?.(dog)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FF6B35',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}
                className="mobile-action-btn"
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FF8E53'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF6B35'}
                title="Message the dog owner"
              >
                💬 Message
              </button>
              <button
                onClick={toggleFavorite}
                disabled={favoritesLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isFavorite ? '#e53e3e' : '#2DD4BF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: favoritesLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}
                className="mobile-action-btn"
                onMouseOver={(e) => {
                  if (!favoritesLoading) {
                    e.currentTarget.style.backgroundColor = isFavorite ? '#c53030' : '#67E8F9';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = isFavorite ? '#e53e3e' : '#2DD4BF';
                }}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {favoritesLoading ? '⏳' : (isFavorite ? '❤️' : '🤍')}
              </button>
              <button 
                onClick={() => {
                  console.log('Request button clicked for dog:', dog.name);
                  console.log('onRent function:', onRent);
                  onRent?.(dog);
                }}
                disabled={!dog.isAvailable}
                style={{
                  padding: '10px 20px',
                  backgroundColor: dog.isAvailable ? '#2DD4BF' : '#cbd5e0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: dog.isAvailable ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'all 0.2s'
                }}
                className="mobile-action-btn"
                onMouseOver={(e) => {
                  if (dog.isAvailable) e.currentTarget.style.backgroundColor = '#67E8F9';
                }}
                onMouseOut={(e) => {
                  if (dog.isAvailable) e.currentTarget.style.backgroundColor = '#2DD4BF';
                }}
              >
                {dog.isAvailable ? '📝 Request This Dog' : 
                 dog.status === 'requested' ? '⏳ Request Pending' : '🚫 Currently Rented'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DogCard; 