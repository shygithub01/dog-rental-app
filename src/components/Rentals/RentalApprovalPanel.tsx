import React, { useState, useEffect } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, addDoc, getDoc, deleteDoc } from 'firebase/firestore';

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
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#4a5568'
      }}>
        Loading rental requests...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#4a5568',
        background: '#f7fafc',
        borderRadius: '10px',
        border: '2px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>
          📋 No Pending Requests
        </h3>
        <p style={{ margin: 0, opacity: 0.8 }}>
          You don't have any pending rental requests at the moment.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{
        margin: '0 0 20px 0',
        color: '#2d3748',
        fontSize: '1.5rem',
        textAlign: 'center'
      }}>
        📋 Pending Rental Requests ({requests.length})
      </h3>

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

      <div style={{
        display: 'grid',
        gap: '20px'
      }}>
        {requests.map((request) => (
          <div key={request.id} style={{
            background: 'white',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {/* Request Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              paddingBottom: '15px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div>
                <h4 style={{
                  margin: '0 0 5px 0',
                  color: '#2d3748',
                  fontSize: '1.2rem'
                }}>
                  🐕 {request.dogName} ({request.dogBreed})
                </h4>
                <p style={{
                  margin: 0,
                  color: '#4a5568',
                  fontSize: '0.9rem'
                }}>
                  Requested by: <strong>{request.renterName}</strong>
                </p>
              </div>
              <div style={{
                background: '#ed8936',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                PENDING
              </div>
            </div>

            {/* Request Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#4a5568' }}>
                  <strong>Start Date:</strong> {formatDate(request.startDate)}
                </p>
                <p style={{ margin: '0 0 5px 0', color: '#4a5568' }}>
                  <strong>End Date:</strong> {formatDate(request.endDate)}
                </p>
                <p style={{ margin: '0 0 5px 0', color: '#4a5568' }}>
                  <strong>Duration:</strong> {request.daysDiff} day{request.daysDiff !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#4a5568' }}>
                  <strong>Total Cost:</strong> ${request.totalCost}
                </p>
                <p style={{ margin: '0 0 5px 0', color: '#4a5568' }}>
                  <strong>Contact:</strong> {request.contactPhone}
                </p>
                <p style={{ margin: '0 0 5px 0', color: '#4a5568' }}>
                  <strong>Requested:</strong> {formatDate(request.createdAt)}
                </p>
              </div>
            </div>

            {/* Special Requests */}
            {request.specialRequests && (
              <div style={{
                background: '#f7fafc',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{
                  margin: '0 0 8px 0',
                  fontWeight: 'bold',
                  color: '#2d3748'
                }}>
                  📝 Special Requests:
                </p>
                <p style={{
                  margin: 0,
                  color: '#4a5568',
                  fontStyle: 'italic'
                }}>
                  {request.specialRequests}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => handleReject(request)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c53030'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e53e3e'}
              >
                ❌ Reject Request
              </button>
              <button
                onClick={() => handleApprove(request)}
                style={{
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
                ✅ Approve Request
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RentalApprovalPanel; 