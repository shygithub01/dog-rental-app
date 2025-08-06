import React, { useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';

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
}

interface RentDogFormProps {
  dog: Dog;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RentDogForm: React.FC<RentDogFormProps> = ({ dog, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    specialRequests: '',
    contactPhone: ''
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
        throw new Error('You must be logged in to rent a dog');
      }

      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Validation
      if (startDate < today) {
        throw new Error('Start date cannot be in the past');
      }
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalCost = daysDiff * dog.pricePerDay;

      console.log('Creating rental:', {
        dogId: dog.id,
        dogName: dog.name,
        renterId: auth.currentUser.uid,
        renterName: auth.currentUser.displayName || auth.currentUser.email,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalCost,
        daysDiff
      });

      // Create rental record
      const rentalRef = await addDoc(collection(db, 'rentals'), {
        dogId: dog.id,
        dogName: dog.name,
        dogBreed: dog.breed,
        dogOwnerId: dog.ownerId,
        dogOwnerName: dog.ownerName,
        renterId: auth.currentUser.uid,
        renterName: auth.currentUser.displayName || auth.currentUser.email,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        totalCost,
        daysDiff,
        specialRequests: formData.specialRequests,
        contactPhone: formData.contactPhone,
        status: 'active',
        createdAt: Timestamp.now()
      });

      // Update dog availability
      await updateDoc(doc(db, 'dogs', dog.id), {
        isAvailable: false,
        updatedAt: Timestamp.now()
      });

      console.log('Rental created successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating rental:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate total cost based on selected dates
  const calculateTotalCost = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate <= startDate) return 0;
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff * dog.pricePerDay;
  };

  const totalCost = calculateTotalCost();

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Dog Info Summary */}
        <div style={{
          background: '#f7fafc',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '25px',
          border: '2px solid #e2e8f0'
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            color: '#2d3748',
            fontSize: '1.3rem'
          }}>
            🐕 Renting: {dog.name}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            fontSize: '0.95rem'
          }}>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#4a5568' }}>
                <strong>Breed:</strong> {dog.breed}
              </p>
              <p style={{ margin: '0 0 5px 0', color: '#4a5568' }}>
                <strong>Age:</strong> {dog.age} year{dog.age !== 1 ? 's' : ''} old
              </p>
              <p style={{ margin: '0 0 5px 0', color: '#4a5568' }}>
                <strong>Size:</strong> {dog.size}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#4a5568' }}>
                <strong>Price per day:</strong> ${dog.pricePerDay}
              </p>
              <p style={{ margin: '0 0 5px 0', color: '#4a5568' }}>
                <strong>Location:</strong> {dog.location}
              </p>
              <p style={{ margin: '0 0 5px 0', color: '#4a5568' }}>
                <strong>Owner:</strong> {dog.ownerName}
              </p>
            </div>
          </div>
        </div>

        {/* Rental Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label htmlFor="startDate" style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#2d3748'
            }}>
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
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
            <label htmlFor="endDate" style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#2d3748'
            }}>
              End Date *
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              min={formData.startDate || new Date().toISOString().split('T')[0]}
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
          <label htmlFor="contactPhone" style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: '#2d3748'
          }}>
            Contact Phone *
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            placeholder="Your phone number"
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

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="specialRequests" style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: '#2d3748'
          }}>
            Special Requests
          </label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            rows={3}
            placeholder="Any special requests or notes for the owner..."
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

        {/* Cost Summary */}
        {totalCost > 0 && (
          <div style={{
            background: '#48bb78',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>
              💰 Rental Summary
            </h3>
            <p style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>
              <strong>Total Cost:</strong> ${totalCost}
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              ${dog.pricePerDay} per day × {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
          </div>
        )}

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
            disabled={loading || totalCost === 0}
            style={{
              padding: '12px 24px',
              backgroundColor: loading || totalCost === 0 ? '#cbd5e0' : '#48bb78',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || totalCost === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (!loading && totalCost > 0) e.currentTarget.style.backgroundColor = '#38a169';
            }}
            onMouseOut={(e) => {
              if (!loading && totalCost > 0) e.currentTarget.style.backgroundColor = '#48bb78';
            }}
          >
            {loading ? 'Creating Rental...' : `Rent ${dog.name} for $${totalCost}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RentDogForm; 