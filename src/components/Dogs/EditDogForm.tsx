import React, { useState, useEffect } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

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

interface EditDogFormProps {
  dog: Dog;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EditDogForm: React.FC<EditDogFormProps> = ({ dog, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: dog.name,
    breed: dog.breed,
    age: dog.age,
    size: dog.size,
    description: dog.description,
    pricePerDay: dog.pricePerDay,
    location: dog.location,
    isAvailable: dog.isAvailable
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { db } = useFirebase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if dog has pending requests or is rented
      if (dog.status === 'requested' || dog.status === 'rented' || !dog.isAvailable) {
        throw new Error('Cannot edit dog while it has pending requests or is currently rented. Please wait until the rental period ends.');
      }

      console.log('Updating dog in database:', formData);

      await updateDoc(doc(db, 'dogs', dog.id), {
        ...formData,
        updatedAt: Timestamp.now()
      });

      console.log('Dog updated successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating dog:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               name === 'age' || name === 'pricePerDay' ? Number(value) : value
    }));
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label htmlFor="name" style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#2d3748'
            }}>
              Dog Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4299e1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div>
            <label htmlFor="breed" style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#2d3748'
            }}>
              Breed *
            </label>
            <input
              type="text"
              id="breed"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4299e1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label htmlFor="age" style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#2d3748'
            }}>
              Age (years) *
            </label>
            <input
              type="number"
              id="age"
              name="age"
              min="1"
              max="20"
              value={formData.age}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4299e1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div>
            <label htmlFor="size" style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#2d3748'
            }}>
              Size *
            </label>
            <select
              id="size"
              name="size"
              value={formData.size}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4299e1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="description" style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: '#2d3748'
          }}>
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Tell us about your dog's personality, training, and special needs..."
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              resize: 'vertical',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#4299e1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label htmlFor="pricePerDay" style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#2d3748'
            }}>
              Price per Day ($) *
            </label>
            <input
              type="number"
              id="pricePerDay"
              name="pricePerDay"
              min="1"
              value={formData.pricePerDay}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4299e1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div>
            <label htmlFor="location" style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#2d3748'
            }}>
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, State"
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4299e1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleChange}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontWeight: 'bold',
              color: '#2d3748'
            }}>
              Available for Rent
            </span>
          </label>
        </div>

        {error && (
          <div style={{
            color: '#e53e3e',
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#fed7d7',
            borderRadius: '8px',
            border: '1px solid #feb2b2'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                backgroundColor: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4a5568'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#718096'}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: loading ? '#cbd5e0' : '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#3182ce';
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#4299e1';
            }}
          >
            {loading ? 'Updating...' : 'Update Dog'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDogForm; 