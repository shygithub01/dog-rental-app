import React, { useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface Dog {
  id: string;
  name: string;
  breed: string;
  age: number;
  size: 'small' | 'medium' | 'large';
  description: string;
  pricePerDay: number;
  imageUrl?: string;
  location: string;
  ownerId: string;
  ownerName: string;
  isAvailable: boolean;
  status?: 'available' | 'requested' | 'rented';
  createdAt: any;
  updatedAt: any;
}

interface DogCardProps {
  dog: Dog;
  onEdit: (dog: Dog) => void;
  onDelete: () => void;
  onRent?: (dog: Dog) => void;
  currentUserId: string;
}

const DogCard: React.FC<DogCardProps> = ({ dog, onEdit, onDelete, onRent, currentUserId }) => {
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { db } = useFirebase();
  const isOwner = dog.ownerId === currentUserId;

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

  const handleImageError = () => {
    setImageError(true);
  };

  const showImage = dog.imageUrl && !imageError;

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
        backgroundColor: dog.isAvailable ? '#48bb78' : 
                       dog.status === 'requested' ? '#ed8936' : '#e53e3e',
        color: 'white',
        zIndex: 10
      }} className="mobile-status-badge">
        {dog.isAvailable ? 'Available' : 
         dog.status === 'requested' ? 'Requested' : 'Rented'}
      </div>

      {/* Dog Image */}
      {showImage ? (
        <div style={{
          width: '100%',
          height: '250px',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#f7fafc'
        }} className="mobile-dog-image">
          <img
            src={dog.imageUrl}
            alt={`${dog.name} the ${dog.breed}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
            onError={handleImageError}
            onLoad={() => setImageError(false)}
          />
          {/* Image overlay for better text readability */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
            pointerEvents: 'none'
          }} />
        </div>
      ) : (
        <div style={{
          width: '100%',
          height: '250px',
          backgroundColor: '#f7fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #e2e8f0',
          position: 'relative'
        }} className="mobile-dog-image">
          <div style={{
            fontSize: '4rem',
            color: '#cbd5e0',
            textAlign: 'center'
          }}>
            🐕
          </div>
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '10px',
            textAlign: 'center',
            color: '#718096',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}>
            {imageError ? 'Image failed to load' : 'No photo uploaded'}
          </div>
        </div>
      )}

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
            color: '#718096',
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
                  backgroundColor: (dog.status === 'requested' || dog.status === 'rented' || !dog.isAvailable) ? '#cbd5e0' : '#4299e1',
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
                  if (!loading && dog.status !== 'requested' && dog.status !== 'rented' && dog.isAvailable) e.currentTarget.style.backgroundColor = '#3182ce';
                }}
                onMouseOut={(e) => {
                  if (!loading && dog.status !== 'requested' && dog.status !== 'rented' && dog.isAvailable) e.currentTarget.style.backgroundColor = '#4299e1';
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
            <button 
              onClick={() => {
                console.log('Request button clicked for dog:', dog.name);
                console.log('onRent function:', onRent);
                onRent?.(dog);
              }}
              disabled={!dog.isAvailable}
              style={{
                padding: '10px 20px',
                backgroundColor: dog.isAvailable ? '#ed8936' : '#cbd5e0',
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
                if (dog.isAvailable) e.currentTarget.style.backgroundColor = '#dd6b20';
              }}
              onMouseOut={(e) => {
                if (dog.isAvailable) e.currentTarget.style.backgroundColor = '#ed8936';
              }}
            >
              {dog.isAvailable ? '📝 Request This Dog' : 
               dog.status === 'requested' ? '⏳ Request Pending' : '🚫 Currently Rented'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DogCard; 