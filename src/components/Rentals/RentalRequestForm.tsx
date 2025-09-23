import React, { useState, useMemo } from 'react';
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
  onClose?: () => void;
}

const RentalRequestForm: React.FC<RentalRequestFormProps> = ({ dog, onSuccess, onCancel, onClose }) => {
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

  // Calculate total cost - memoized to prevent re-render issues
  const totalCost = useMemo(() => {
    if (!formData.startDate || !formData.endDate) {
      return { days: 0, total: 0 };
    }
    
    const startDate = new Date(formData.startDate  + 'T12:00:00');
    const endDate = new Date(formData.endDate + 'T12:00:00');
    
    if (endDate <= startDate) {
      return { days: 0, total: 0 };
    }
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return { days: daysDiff, total: daysDiff * dog.pricePerDay };
  }, [formData.startDate, formData.endDate, dog.pricePerDay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to request a dog');
      }

      const startDate = new Date(formData.startDate + 'T12:00:00');
      const endDate = new Date(formData.endDate + 'T12:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        throw new Error('Start date cannot be in the past');
      }
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalCostValue = daysDiff * dog.pricePerDay;

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
        totalCost: totalCostValue,
        daysDiff,
        specialRequests: formData.specialRequests,
        contactPhone: formData.contactPhone,
        status: 'pending',
        createdAt: Timestamp.now()
      });

      await updateDoc(doc(db, 'dogs', dog.id), {
        isAvailable: false,
        status: 'requested',
        requestedBy: auth.currentUser.uid,
        requestedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      await notificationService.createNotification(
        dog.ownerId,
        'rental_request',
        {
          title: `New Rental Request for ${dog.name}`,
          message: `${auth.currentUser.displayName || auth.currentUser.email} wants to rent ${dog.name} from ${formData.startDate} to ${formData.endDate}. Check your requests to approve or reject.`,
          data: {
            requestId: requestRef.id,
            dogId: dog.id,
            dogName: dog.name,
            renterId: auth.currentUser.uid,
            renterName: auth.currentUser.displayName || auth.currentUser.email,
            startDate: formData.startDate,
            endDate: formData.endDate,
            totalCost: totalCostValue
          }
        }
      );

      onSuccess?.();
    } catch (error: any) {
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

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else if (onCancel) {
      onCancel();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <header className="modern-header fade-in">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {(onCancel || onClose) && (
              <button
                onClick={onCancel || onClose}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#FF6B35',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF8E53';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF6B35';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ← Back to Dashboard
              </button>
            )}
            <a href="#" className="logo">
              DogRental
            </a>
          </div>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-content fade-in">
          <div className="hero-text">
            <h1 className="hero-title">
              Request to rent {dog.name}
            </h1>
            <p className="hero-subtitle">
              Submit your rental request for this adorable {dog.breed}. Perfect for your next adventure together.
            </p>
            
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-number">${dog.pricePerDay}</div>
                <div className="hero-stat-label">Per day</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">{dog.age}y</div>
                <div className="hero-stat-label">{dog.size} size</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">📍</div>
                <div className="hero-stat-label">{dog.location}</div>
              </div>
            </div>
          </div>

          <div className="search-card slide-up">
            <h3 className="search-title">
              Rental Request
            </h3>
            <p className="search-subtitle">
              Fill out the details below to request this dog
            </p>

            <div style={{
              background: '#f9fafb',
              border: '2px dashed #d1d5db',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px'
              }}>
                🐕 About {dog.name}
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Breed:</span>
                  <div style={{ color: '#374151', fontWeight: '600' }}>{dog.breed}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Owner:</span>
                  <div style={{ color: '#374151', fontWeight: '600' }}>{dog.ownerName}</div>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Description:</span>
                <p style={{
                  color: '#374151',
                  margin: '4px 0 0 0',
                  lineHeight: '1.5',
                  fontSize: '0.875rem'
                }}>
                  {dog.description}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: '32px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px', 
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: 'white'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && totalCost.days > 0 && (
                <div style={{
                  background: '#f0fdf4',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  border: '1px solid #bbf7d0'
                }}>
                  <h4 style={{
                    fontSize: '0.9rem',
                    color: '#374151',
                    margin: '0 0 8px 0',
                    fontWeight: '600'
                  }}>
                    💰 Cost Breakdown
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Duration:</span>
                      <div style={{ fontWeight: '600', color: '#374151' }}>{totalCost.days} day{totalCost.days !== 1 ? 's' : ''}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total Cost:</span>
                      <div style={{ fontWeight: '600', color: '#059669', fontSize: '1.1rem' }}>${totalCost.total}</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  required
                  placeholder="(555) 123-4567"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    backgroundColor: 'white'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Special Requests
                </label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any special requirements or questions for the owner..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {error && (
                <div style={{
                  color: '#dc2626',
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  fontSize: '0.875rem'
                }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '12px', 
                marginTop: '24px'
              }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-glass-primary w-full mb-4"
                >
                  {loading ? '📝 Submitting Request...' : '📝 Submit Request'}
                </button>
                
                {(onCancel || onClose) && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-glass-primary w-full mb-4"
                  >
                    ← Back to Browse
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RentalRequestForm;
