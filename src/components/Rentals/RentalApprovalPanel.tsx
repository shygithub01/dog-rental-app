import React, { useState, useEffect } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, addDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { useNotificationService } from '../../services/notificationService';

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

interface RentalApprovalPanelProps {
  currentUserId: string;
  onRequestUpdate?: () => void;
  onClose?: () => void;
}

const RentalApprovalPanel: React.FC<RentalApprovalPanelProps> = ({ currentUserId, onRequestUpdate, onClose }) => {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { db } = useFirebase();
  const notificationService = useNotificationService();

  useEffect(() => {
    loadRequests();
  }, [currentUserId]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      console.log('Loading rental requests for user:', currentUserId);
      
      const requestsQuery = query(
        collection(db, 'rentalRequests'),
        where('dogOwnerId', '==', currentUserId),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(requestsQuery);
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RentalRequest[];
      
      console.log('Rental requests loaded:', requestsData);
      
      // Validate that the dogs still exist
      const validRequests = [];
      for (const request of requestsData) {
        try {
          const dogDoc = await getDoc(doc(db, 'dogs', request.dogId));
          if (dogDoc.exists()) {
            validRequests.push(request);
          } else {
            console.log(`Dog ${request.dogId} no longer exists, removing orphaned request ${request.id}`);
            await deleteDoc(doc(db, 'rentalRequests', request.id));
          }
        } catch (error) {
          console.error(`Error validating dog ${request.dogId}:`, error);
          await deleteDoc(doc(db, 'rentalRequests', request.id));
        }
      }
      
      console.log('Valid rental requests after cleanup:', validRequests);
      setRequests(validRequests);
    } catch (error) {
      console.error('Error loading rental requests:', error);
      setError('Failed to load rental requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: RentalRequest) => {
    try {
      console.log('Approving request:', request.id);
      
      await updateDoc(doc(db, 'rentalRequests', request.id), {
        status: 'approved',
        approvedAt: Timestamp.now()
      });

      await updateDoc(doc(db, 'dogs', request.dogId), {
        isAvailable: false,
        status: 'rented',
        rentedBy: request.renterId,
        rentedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      await addDoc(collection(db, 'rentals'), {
        dogId: request.dogId,
        dogName: request.dogName,
        dogBreed: request.dogBreed,
        dogOwnerId: request.dogOwnerId,
        dogOwnerName: request.dogOwnerName,
        renterId: request.renterId,
        renterName: request.renterName,
        startDate: request.startDate,
        endDate: request.endDate,
        totalCost: request.totalCost,
        daysDiff: request.daysDiff,
        specialRequests: request.specialRequests,
        contactPhone: request.contactPhone,
        status: 'active',
        createdAt: Timestamp.now()
      });

      await notificationService.createNotification(
        request.renterId,
        'rental_approved',
        {
          title: `Rental Approved for ${request.dogName}`,
          message: `Your rental request for ${request.dogName} has been approved! The rental starts on ${formatDate(request.startDate)}.`,
          data: {
            requestId: request.id,
            dogId: request.dogId,
            dogName: request.dogName,
            startDate: request.startDate,
            endDate: request.endDate,
            totalCost: request.totalCost
          }
        }
      );

      console.log('Request approved successfully!');
      loadRequests();
      onRequestUpdate?.();
    } catch (error) {
      console.error('Error approving request:', error);
      setError('Failed to approve request');
    }
  };

  const handleReject = async (request: RentalRequest) => {
    try {
      console.log('Rejecting request:', request.id);
      
      await updateDoc(doc(db, 'rentalRequests', request.id), {
        status: 'rejected',
        rejectedAt: Timestamp.now()
      });

      await updateDoc(doc(db, 'dogs', request.dogId), {
        isAvailable: true,
        status: 'available',
        requestedBy: null,
        requestedAt: null,
        updatedAt: Timestamp.now()
      });

      await notificationService.createNotification(
        request.renterId,
        'rental_rejected',
        {
          title: `Rental Request Rejected`,
          message: `Your rental request for ${request.dogName} was not approved. You can try requesting other dogs.`,
          data: {
            requestId: request.id,
            dogId: request.dogId,
            dogName: request.dogName
          }
        }
      );

      console.log('Request rejected successfully!');
      loadRequests();
      onRequestUpdate?.();
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Failed to reject request');
    }
  };

  const formatDate = (timestamp: any) => {
    console.log('formatDate called with:', timestamp);
    console.log('timestamp type:', typeof timestamp);
    
    if (!timestamp) {
      console.log('No timestamp provided, returning N/A');
      return 'N/A';
    }
    
    try {
      let date;
      if (timestamp.toDate) {
        console.log('Using Firestore timestamp.toDate()');
        date = timestamp.toDate();
      } else {
        console.log('Using new Date() constructor');
        date = new Date(timestamp);
      }
      
      console.log('Formatted date object:', date);
      const formatted = date.toLocaleDateString();
      console.log('Final formatted date:', formatted);
      return formatted;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* Modern Header - Exact copy from AddDogForm */}
      <header className="modern-header fade-in">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#" className="logo">
              DogRental
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section - Exact copy from AddDogForm structure */}
      <section className="hero-section">
        <div className="hero-content fade-in">
          {/* Hero Text - Exact copy from AddDogForm */}
          <div className="hero-text">
            <h1 className="hero-title">
              Manage your rental requests
            </h1>
            <p className="hero-subtitle">
              Review and approve rental requests from trusted dog lovers. Create happy memories while earning from your furry friends.
            </p>
            
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-number">{requests.length}</div>
                <div className="hero-stat-label">Pending Requests</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">📋</div>
                <div className="hero-stat-label">Review & Approve</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">💰</div>
                <div className="hero-stat-label">Earn from Rentals</div>
              </div>
            </div>
          </div>

          {/* Form Card - Exact copy from AddDogForm structure */}
          <div className="search-card slide-up">
            <h3 className="search-title">
              Rental Requests
            </h3>
            <p className="search-subtitle">
              Review the details below and manage each request
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
                <p style={{ color: '#6b7280' }}>Loading rental requests...</p>
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
                      You don't have any pending rental requests at the moment. Check back later!
                    </p>
                  </div>
                ) : (
                  <div style={{ marginTop: '32px' }}>
                    {requests.map((request) => (
                      <div key={request.id} style={{
                        background: '#f9fafb',
                        border: '2px dashed #d1d5db',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '24px'
                      }}>
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
                              Dog & Renter
                            </label>
                            <div style={{
                              padding: '12px 16px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              backgroundColor: 'white'
                            }}>
                              🐕 {request.dogName} ({request.dogBreed})
                              <br />
                              <small style={{ color: '#6b7280' }}>
                                By: {request.renterName}
                              </small>
                            </div>
                          </div>

                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: '#374151',
                              marginBottom: '6px'
                            }}>
                              Total Cost
                            </label>
                            <div style={{
                              padding: '12px 16px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              backgroundColor: 'white',
                              color: '#059669',
                              fontWeight: '600'
                            }}>
                              ${request.totalCost}
                            </div>
                          </div>
                        </div>

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
                              Start Date
                            </label>
                            <div style={{
                              padding: '12px 16px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              backgroundColor: 'white',
                              fontWeight: '600',
                              color: '#1f2937'
                            }}>
                              {formatDate(request.startDate)}
                            </div>
                          </div>

                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: '#374151',
                              marginBottom: '6px'
                            }}>
                              End Date  
                            </label>
                            <div style={{
                              padding: '12px 16px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              backgroundColor: 'white',
                              fontWeight: '600',
                              color: '#1f2937'
                            }}>
                              {formatDate(request.endDate)}
                            </div>
                          </div>
                        </div>

                        {request.specialRequests && (
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
                            <div style={{
                              padding: '12px 16px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '1rem',
                              backgroundColor: 'white',
                              fontStyle: 'italic'
                            }}>
                              {request.specialRequests}
                            </div>
                          </div>
                        )}

                        {/* Remove action buttons from here - they'll go at the bottom */}
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
                  {/* Show approve/reject buttons for each request at the bottom */}
                  {requests.map((request) => (
                    <div key={`actions-${request.id}`} style={{ marginBottom: '12px' }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: 'white', 
                        marginBottom: '8px',
                        textAlign: 'center'
                      }}>
                        Actions for {request.dogName}:
                      </div>
                      <button
                        onClick={() => handleApprove(request)}
                        className="btn-glass-primary w-full mb-4"
                      >
                        Approve Request
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        className="btn-glass-primary w-full mb-4"
                      >
                        Reject Request
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={onClose}
                    className="btn-glass-primary w-full mb-4"
                  >
                    ← Back to Dashboard
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default RentalApprovalPanel;
