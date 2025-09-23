import React, { useState, useEffect } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';

interface RentalRequest {
  id: string;
  dogId: string;
  dogName: string;
  dogBreed: string;
  dogOwnerId: string;
  dogOwnerName: string;
  renterId: string;
  renterName: string;
  startDate: any;
  endDate: any;
  totalCost: number;
  daysDiff: number;
  specialRequests: string;
  contactPhone: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: any;
}

interface RenterPendingRequestsProps {
  currentUserId: string;
  onRequestUpdate?: () => void;
  onClose?: () => void;
}

const RenterPendingRequests: React.FC<RenterPendingRequestsProps> = ({ currentUserId, onRequestUpdate, onClose }) => {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { db } = useFirebase();

  useEffect(() => {
    loadRequests();
  }, [currentUserId]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      console.log('Loading rental requests for renter:', currentUserId);
      
      const requestsQuery = query(
        collection(db, 'rentalRequests'),
        where('renterId', '==', currentUserId),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(requestsQuery);
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RentalRequest[];
      
      console.log('Renter rental requests loaded:', requestsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading rental requests:', error);
      setError('Failed to load rental requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (request: RentalRequest) => {
    try {
      console.log('Cancelling request:', request.id);
      
      // Update request status to cancelled
      await updateDoc(doc(db, 'rentalRequests', request.id), {
        status: 'cancelled',
        cancelledAt: Timestamp.now()
      });

      // Update dog status back to available
      await updateDoc(doc(db, 'dogs', request.dogId), {
        isAvailable: true,
        status: 'available',
        requestedBy: null,
        requestedAt: null,
        updatedAt: Timestamp.now()
      });

      console.log('Request cancelled successfully!');
      loadRequests();
      onRequestUpdate?.();
    } catch (error) {
      console.error('Error cancelling request:', error);
      setError('Failed to cancel request');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const handleBack = () => {
    onClose?.();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* Modern Header - Same as AddDogForm */}
      <header className="modern-header fade-in">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {onClose && (
              <button
                onClick={onClose}
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

      {/* Hero Section - Matching AddDogForm Pattern */}
      <section className="hero-section">
        <div className="hero-content fade-in">
          {/* Hero Text */}
          <div className="hero-text">
            <h1 className="hero-title">
              Your pending requests
            </h1>
            <p className="hero-subtitle">
              Track and manage your rental requests. Stay updated on the status of your dog rental applications.
            </p>
            
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-number">{requests.length}</div>
                <div className="hero-stat-label">Pending Requests</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">📋</div>
                <div className="hero-stat-label">Track Status</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">🐕</div>
                <div className="hero-stat-label">Find Perfect Match</div>
              </div>
            </div>
          </div>

          {/* Form Card - Same Style as Search Card in AddDogForm */}
          <div className="search-card slide-up">
            <h3 className="search-title">
              My Requests
            </h3>
            <p className="search-subtitle">
              Review your pending requests and manage them below
            </p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid #e2e8f0',
                  borderTop: '4px solid #FF6B35',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }}></div>
                <p style={{ color: '#6b7280' }}>Loading your requests...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div style={{
                    color: '#dc2626',
                    marginBottom: '24px',
                    padding: '12px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    fontSize: '0.875rem'
                  }}>
                    ⚠️ {error}
                  </div>
                )}

                {requests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📋</div>
                    <h4 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#374151',
                      margin: '0 0 8px 0'
                    }}>
                      No Pending Requests
                    </h4>
                    <p style={{
                      color: '#6b7280',
                      fontSize: '1rem',
                      margin: 0
                    }}>
                      You don't have any pending rental requests at the moment.
                    </p>
                  </div>
                ) : (
                  <div style={{ marginTop: '32px' }}>
                    {requests.map((request) => (
                      <div key={request.id} style={{
                        background: '#f9fafb',
                        border: '1px solid #d1d5db',
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '24px'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '20px',
                          paddingBottom: '16px',
                          borderBottom: '1px solid #e5e7eb'
                        }}>
                          <div>
                            <h4 style={{
                              margin: '0 0 8px 0',
                              color: '#1f2937',
                              fontSize: '1.25rem',
                              fontWeight: '600'
                            }}>
                              🐕 {request.dogName} ({request.dogBreed})
                            </h4>
                            <p style={{
                              margin: 0,
                              color: '#6b7280',
                              fontSize: '0.9rem'
                            }}>
                              Owner: <strong style={{ color: '#374151' }}>{request.dogOwnerName}</strong>
                            </p>
                          </div>
                          <div style={{
                            background: '#f59e0b',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            PENDING
                          </div>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '20px',
                          marginBottom: '24px'
                        }}>
                          <div>
                            <div style={{ marginBottom: '12px' }}>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Start Date:</span>
                              <div style={{ color: '#1f2937', fontWeight: '600' }}>{formatDate(request.startDate)}</div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>End Date:</span>
                              <div style={{ color: '#1f2937', fontWeight: '600' }}>{formatDate(request.endDate)}</div>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Duration:</span>
                              <div style={{ color: '#1f2937', fontWeight: '600' }}>{request.daysDiff} day{request.daysDiff !== 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          <div>
                            <div style={{ marginBottom: '12px' }}>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Total Cost:</span>
                              <div style={{ color: '#059669', fontWeight: '600', fontSize: '1.1rem' }}>${request.totalCost}</div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Contact:</span>
                              <div style={{ color: '#1f2937', fontWeight: '600' }}>{request.contactPhone}</div>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Requested:</span>
                              <div style={{ color: '#1f2937', fontWeight: '600' }}>{formatDate(request.createdAt)}</div>
                            </div>
                          </div>
                        </div>

                        {request.specialRequests && (
                          <div style={{
                            background: 'white',
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: '24px',
                            border: '1px solid #e5e7eb'
                          }}>
                            <p style={{
                              margin: '0 0 8px 0',
                              fontWeight: '600',
                              color: '#374151',
                              fontSize: '0.9rem'
                            }}>
                              📝 Special Requests:
                            </p>
                            <p style={{
                              margin: 0,
                              color: '#6b7280',
                              fontStyle: 'italic',
                              lineHeight: '1.5'
                            }}>
                              {request.specialRequests}
                            </p>
                          </div>
                        )}

                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          <button
                            onClick={() => handleCancelRequest(request)}
                            className="btn-glass-primary w-full mb-4"
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              borderColor: 'rgba(239, 68, 68, 0.3)'
                            }}
                          >
                            ❌ Cancel Request
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginTop: '24px'
                }}>

                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default RenterPendingRequests;
