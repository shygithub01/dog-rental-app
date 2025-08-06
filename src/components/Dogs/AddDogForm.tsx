import React, { useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface CreateDogData {
  name: string;
  breed: string;
  age: number;
  size: 'small' | 'medium' | 'large';
  description: string;
  pricePerDay: number;
  location: string;
}

interface AddDogFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddDogForm: React.FC<AddDogFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<CreateDogData>({
    name: '',
    breed: '',
    age: 1,
    size: 'medium',
    description: '',
    pricePerDay: 50,
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { auth, db } = useFirebase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to add a dog');
      }

      console.log('Adding dog to database:', formData);
      console.log('User:', auth.currentUser.displayName || auth.currentUser.email);

      // Actually save to Firestore
      await addDoc(collection(db, 'dogs'), {
        ...formData,
        ownerId: auth.currentUser.uid,
        ownerName: auth.currentUser.displayName || auth.currentUser.email || 'Unknown',
        isAvailable: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log('Dog saved successfully!');

      setFormData({
        name: '',
        breed: '',
        age: 1,
        size: 'medium',
        description: '',
        pricePerDay: 50,
        location: ''
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding dog:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'pricePerDay' ? Number(value) : value
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
              backgroundColor: loading ? '#cbd5e0' : '#48bb78',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#38a169';
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#48bb78';
            }}
          >
            {loading ? 'Adding Dog...' : 'Add Dog'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDogForm; 