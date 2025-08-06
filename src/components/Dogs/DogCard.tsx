import React, { useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, deleteDoc } from 'firebase/firestore';

interface Dog {
  id: string;
  name: string;
  breed: string;
  age: number;
  size: 'small' | 'medium' | 'large';
  description: string;
  pricePerDay: number;
  location: string;
  ownerId: string;
  ownerName: string;
  isAvailable: boolean;
  createdAt: any;
  updatedAt: any;
}

interface DogCardProps {
  dog: Dog;
  onEdit: (dog: Dog) => void;
  onDelete: () => void;
  currentUserId: string;
}

const DogCard: React.FC<DogCardProps> = ({ dog, onEdit, onDelete, currentUserId }) => {
  const [loading, setLoading] = useState(false);
  const { db } = useFirebase();
  const isOwner = dog.ownerId === currentUserId;

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${dog.name}?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'dogs', dog.id));
      console.log('Dog deleted successfully!');
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
      padding: '25px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '2px solid #e2e8f0',
      transition: 'all 0.2s',
      position: 'relative'
    }}
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
        backgroundColor: dog.isAvailable ? '#48bb78' : '#e53e3e',
        color: 'white'
      }}>
        {dog.isAvailable ? 'Available' : 'Rented'}
      </div>

      {/* Dog Info */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{
          fontSize: '1.5rem',
          color: '#2d3748',
          margin: '0 0 10px 0',
          fontWeight: 'bold'
        }}>
          {dog.name}
        </h3>
        <p style={{
          color: '#4a5568',
          margin: '0 0 8px 0',
          fontSize: '1.1rem'
        }}>
          {dog.breed} • {dog.age} year{dog.age !== 1 ? 's' : ''} old
        </p>
        <p style={{
          color: '#718096',
          margin: '0 0 8px 0',
          fontSize: '0.9rem',
          textTransform: 'capitalize'
        }}>
          Size: {dog.size} • Location: {dog.location}
        </p>
        <p style={{
          color: '#2d3748',
          margin: '0 0 15px 0',
          lineHeight: '1.5',
          fontSize: '0.95rem'
        }}>
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
      }}>
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
      }}>
        {isOwner ? (
          <>
            <button
              onClick={() => onEdit(dog)}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4299e1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#3182ce';
              }}
              onMouseOut={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#4299e1';
              }}
            >
              ✏️ Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: loading ? '#cbd5e0' : '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#c53030';
              }}
              onMouseOut={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#e53e3e';
              }}
            >
              {loading ? 'Deleting...' : '🗑️ Delete'}
            </button>
          </>
        ) : (
          <button style={{
            padding: '10px 20px',
            backgroundColor: '#48bb78',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#38a169'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#48bb78'}
          >
            🐕 Rent This Dog
          </button>
        )}
      </div>
    </div>
  );
};

export default DogCard; 