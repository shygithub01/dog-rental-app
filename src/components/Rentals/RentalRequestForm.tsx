import React, { useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { useNotificationService } from '../../services/notificationService';

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

interface RentalRequestFormProps {
  dog: Dog;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RentalRequestForm: React.FC<RentalRequestFormProps> = ({ dog, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    specialRequests: '',
    contactPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { auth, db } = useFirebase();
  const notificationService = useNotificationService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to request a dog');
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

      console.log('Creating rental request:', {
        dogId: dog.id,
        dogName: dog.name,
        renterId: auth.currentUser.uid,
        renterName: auth.currentUser.displayName || auth.currentUser.email,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalCost,
        daysDiff
      });

      // Create rental request
      const requestRef = await addDoc(collection(db, 'rentalRequests'), {
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
        status: 'pending', // pending, approved, rejected, cancelled
        createdAt: Timestamp.now()
      });

      // Update dog to requested state
      await updateDoc(doc(db, 'dogs', dog.id), {
        isAvailable: false,
        status: 'requested', // available, requested, rented
        requestedBy: auth.currentUser.uid,
        requestedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Create notification for dog owner
      await notificationService.createNotification(
        dog.ownerId,
        'rental_request',
        {
          title: `🐕 New Rental Request for ${dog.name}`,
          message: `${auth.currentUser.displayName || auth.currentUser.email} wants to rent ${dog.name} from ${formData.startDate} to ${formData.endDate}. Check your requests to approve or reject.`,
          data: {
            requestId: requestRef.id,
            dogId: dog.id,
            dogName: dog.name,
            renterId: auth.currentUser.uid,
            renterName: auth.currentUser.displayName || auth.currentUser.email,
            startDate: formData.startDate,
            endDate: formData.endDate,
            totalCost
          }
        }
      );

      console.log('Rental request created successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating rental request:', error);
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
    if (!formData.startDate || !formData.endDate) return { days: 0, total: 0 };
    
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate <= startDate) return { days: 0, total: 0 };
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return { days: daysDiff, total: daysDiff * dog.pricePerDay };
  };

  const totalCost = calculateTotalCost();

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
        maxWidth: '800px',
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
            🐕
          </div>
          <h2 style={{
            fontSize: '2.5rem',
            color: '#2d3748',
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }}>
            Rent {dog.name}
          </h2>
          <p style={{
            color: '#4a5568',
            fontSize: '1.1rem',
            margin: 0,
            lineHeight: '1.6'
          }}>
            Request to rent this adorable {dog.breed} for your perfect adventure
          </p>
        </div>

        {/* Dog Info Card */}
        <div style={{
          background: '#f7fafc',
          padding: '25px',
          borderRadius: '15px',
          marginBottom: '30px',
          border: '2px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '1.3rem',
            color: '#2d3748',
            margin: '0 0 15px 0',
            fontWeight: 'bold'
          }}>
            🐾 About {dog.name}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '15px'
          }} className="mobile-form-grid">
            <div>
              <strong style={{ color: '#4a5568' }}>Breed:</strong> {dog.breed}
            </div>
            <div>
              <strong style={{ color: '#4a5568' }}>Age:</strong> {dog.age} year{dog.age !== 1 ? 's' : ''} old
            </div>
            <div>
              <strong style={{ color: '#4a5568' }}>Size:</strong> {dog.size}
            </div>
            <div>
              <strong style={{ color: '#4a5568' }}>Location:</strong> {dog.location}
            </div>
          </div>
          <div style={{
            marginBottom: '15px'
          }}>
            <strong style={{ color: '#4a5568' }}>Description:</strong>
            <p style={{
              color: '#2d3748',
              margin: '5px 0 0 0',
              lineHeight: '1.5'
            }}>
              {dog.description}
            </p>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <div>
              <div style={{
                fontSize: '0.9rem',
                color: '#4a5568',
                marginBottom: '5px'
              }}>
                Price per day
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#2d3748'
              }}>
                ${dog.pricePerDay}
              </div>
            </div>
            <div style={{
              textAlign: 'right'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#4a5568',
                marginBottom: '5px'
              }}>
                Owner
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: '#2d3748'
              }}>
                {dog.ownerName}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Rental Details */}
          <div style={{
            marginBottom: '30px'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              color: '#2d3748',
              margin: '0 0 20px 0',
              fontWeight: 'bold'
            }}>
              📅 Rental Details
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px', 
              marginBottom: '20px'
            }} className="mobile-form-grid">
              <div>
                <label htmlFor="startDate" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#2d3748',
                  fontSize: '1rem'
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
                    padding: '15px', 
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    backgroundColor: 'white'
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
                  color: '#2d3748',
                  fontSize: '1rem'
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
                    padding: '15px', 
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4299e1'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {/* Cost Calculation */}
            {formData.startDate && formData.endDate && (
              <div style={{
                background: '#f0fff4',
                padding: '20px',
                borderRadius: '10px',
                border: '2px solid #9ae6b4',
                marginBottom: '20px'
              }}>
                <h4 style={{
                  fontSize: '1.1rem',
                  color: '#2d3748',
                  margin: '0 0 10px 0',
                  fontWeight: 'bold'
                }}>
                  💰 Cost Breakdown
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '15px'
                }} className="mobile-form-grid">
                  <div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#4a5568',
                      marginBottom: '5px'
                    }}>
                      Duration
                    </div>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: '#2d3748'
                    }}>
                      {totalCost.days} day{totalCost.days !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#4a5568',
                      marginBottom: '5px'
                    }}>
                      Total Cost
                    </div>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: '#38a169'
                    }}>
                      ${totalCost.total}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div style={{
            marginBottom: '30px'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              color: '#2d3748',
              margin: '0 0 20px 0',
              fontWeight: 'bold'
            }}>
              📞 Contact Information
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px'
            }} className="mobile-form-grid">
              <div>
                <label htmlFor="contactPhone" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#2d3748',
                  fontSize: '1rem'
                }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  required
                  placeholder="(555) 123-4567"
                  style={{ 
                    width: '100%', 
                    padding: '15px', 
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4299e1'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div style={{
            marginBottom: '30px'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              color: '#2d3748',
              margin: '0 0 20px 0',
              fontWeight: 'bold'
            }}>
              📝 Special Requests
            </h3>
            <label htmlFor="specialRequests" style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#2d3748',
              fontSize: '1rem'
            }}>
              Any special requirements or requests?
            </label>
            <textarea
              id="specialRequests"
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleChange}
              rows={4}
              placeholder="Tell the owner about any special needs, preferences, or questions you have..."
              style={{ 
                width: '100%', 
                padding: '15px', 
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '1rem',
                transition: 'all 0.2s',
                backgroundColor: 'white',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4299e1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {error && (
            <div style={{
              color: '#e53e3e',
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#fed7d7',
              borderRadius: '10px',
              border: '1px solid #feb2b2',
              fontSize: '0.95rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            justifyContent: 'center',
            marginTop: '30px'
          }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
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
                ← Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '15px 30px',
                backgroundColor: loading ? '#cbd5e0' : '#ed8936',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s',
                minWidth: '120px'
              }}
              onMouseOver={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#dd6b20';
              }}
              onMouseOut={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#ed8936';
              }}
            >
              {loading ? '📝 Submitting...' : '📝 Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentalRequestForm; 