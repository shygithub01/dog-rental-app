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
}

const RentalApprovalPanel: React.FC<RentalApprovalPanelProps> = ({ currentUserId, onRequestUpdate }) => {
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
            // Delete the orphaned request
            await deleteDoc(doc(db, 'rentalRequests', request.id));
          }
        } catch (error) {
          console.error(`Error validating dog ${request.dogId}:`, error);
          // If we can't validate, assume it's invalid and remove it
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
      
      // Update request status to approved
      await updateDoc(doc(db, 'rentalRequests', request.id), {
        status: 'approved',
        approvedAt: Timestamp.now()
      });

      // Update dog status to rented
      await updateDoc(doc(db, 'dogs', request.dogId), {
        isAvailable: false,
        status: 'rented',
        rentedBy: request.renterId,
        rentedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Create actual rental record
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

      // Create notification for renter
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
      
      // Update request status to rejected
      await updateDoc(doc(db, 'rentalRequests', request.id), {
        status: 'rejected',
        rejectedAt: Timestamp.now()
      });

      // Update dog status back to available
      await updateDoc(doc(db, 'dogs', request.dogId), {
        isAvailable: true,
        status: 'available',
        requestedBy: null,
        requestedAt: null,
        updatedAt: Timestamp.now()
      });

      // Create notification for renter
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
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loading-spinner"></div>
        <h3 style={{ marginTop: '20px', color: '#374151' }}>Loading rental requests...</h3>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section - Same as AddDogForm */}
      <div className="hero-content fade-in">
        {/* Hero Text */}
        <div className="hero-text">
          <h1 className="hero-title">
            Manage Your Rental Requests
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

        {/* Main Content Card */}
        <div className="search-card slide-up">
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📋</div>
              <h3 className="search-title">
                No Pending Requests
              </h3>
              <p className="search-subtitle">
                You don't have any pending rental requests at the moment. Check back later!
              </p>
            </div>
          ) : (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '32px' 
          }}>
            <div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1f2937', 
                margin: '0 0 8px 0' 
              }}>
                📋 Pending Rental Requests ({requests.length})
              </h3>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '1rem',
                margin: 0 
              }}>
                Review the details below and approve or reject each request
              </p>
            </div>
          </div>

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

          <div>
                  {requests.map((request) => (
                    <div key={request.id} style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '16px',
                      padding: '24px',
                      marginBottom: '24px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}>
                      {/* Request Header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        paddingBottom: '16px',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
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
                            Requested by: <strong style={{ color: '#374151' }}>{request.renterName}</strong>
                          </p>
                        </div>
                        <div style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                        }}>
                          PENDING
                        </div>
                      </div>

                      {/* Request Details */}
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

                      {/* Special Requests */}
                      {request.specialRequests && (
                        <div style={{
                          background: 'rgba(59, 130, 246, 0.05)',
                          padding: '16px',
                          borderRadius: '12px',
                          marginBottom: '24px',
                          border: '1px solid rgba(59, 130, 246, 0.1)'
                        }}>
                          <p style={{
                            margin: '0 0 8px 0',
                            fontWeight: '600',
                            color: '#1e40af',
                            fontSize: '0.9rem'
                          }}>
                            📝 Special Requests:
                          </p>
                          <p style={{
                            margin: 0,
                            color: '#374151',
                            fontStyle: 'italic',
                            lineHeight: '1.5'
                          }}>
                            {request.specialRequests}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          onClick={() => handleReject(request)}
                          className="btn-glass-primary"
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.9)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '12px 24px',
                            fontSize: '0.9rem'
                          }}
                        >
                          ❌ Reject Request
                        </button>
                        <button
                          onClick={() => handleApprove(request)}
                          className="btn-glass-primary"
                          style={{
                            padding: '12px 24px',
                            fontSize: '0.9rem'
                          }}
                        >
                          ✅ Approve Request
                        </button>
                      </div>
                    </div>
                  ))}
          </div>
        </>
      )}
        </div>
      </div>
    </div>
  );
};

export default RentalApprovalPanel; 