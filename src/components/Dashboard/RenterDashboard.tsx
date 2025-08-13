import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';

interface RenterDashboardProps {
  dogs: any[];
  onBrowseDogs: () => void;
  onViewMyRentals: () => void;
  onViewFavorites: () => void;
  onRentDog: (dog: any) => void;
  onMessageDogOwner: (dog: any) => void;
  onViewPendingRequests: () => void;
  user: any;
}

interface Rental {
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
  status: string;
}

const RenterDashboard: React.FC<RenterDashboardProps> = ({
  dogs,
  onBrowseDogs,
  onViewMyRentals,
  onViewFavorites,
  onRentDog,
  onMessageDogOwner,
  onViewPendingRequests,
  user
}) => {
  const { db } = useFirebase();
  const [myRentals, setMyRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRentalModal, setShowRentalModal] = useState(false);

  // Show all dogs except user's own dogs
  const allDogs = dogs.filter(dog => dog.ownerId !== user?.uid);
  const availableDogs = allDogs.filter(dog => dog.isAvailable);
  const requestedDogs = allDogs.filter(dog => dog.status === 'requested' && !dog.isAvailable);
  const nearbyDogs = availableDogs.slice(0, 4);

  // Fetch user's rentals from the rentals collection
  useEffect(() => {
    const fetchMyRentals = async () => {
      if (!user?.uid) return;
      
      try {
        const rentalsQuery = query(
          collection(db, 'rentals'),
          where('renterId', '==', user.uid),
          where('status', 'in', ['active', 'completed'])
        );
        const rentalsSnapshot = await getDocs(rentalsQuery);
        const rentals = rentalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Rental[];
        
        setMyRentals(rentals);
      } catch (error) {
        console.error('Error fetching rentals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyRentals();
  }, [user?.uid, db]);

  const totalPaid = myRentals.reduce((sum, rental) => sum + (rental.totalCost || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '0' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1200px',
          width: '100%',
          padding: '0 40px',
          textAlign: 'center',
          color: 'white'
        }}>
          <h1 style={{
            fontSize: '3.5rem',
            margin: '0 0 20px 0',
            fontWeight: 'bold',
            lineHeight: '1.2'
          }}>
            Find Your Furry Soulmate
          </h1>
          <p style={{
            fontSize: '1.3rem',
            margin: '0 0 30px 0',
            lineHeight: '1.6',
            opacity: 0.9
          }}>
            Discover amazing dogs ready to be your perfect adventure buddy
          </p>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div style={{ background: 'white', padding: '60px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* My Rented Dogs Section */}
          <div>
            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#f7fafc',
                borderRadius: '20px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⏳</div>
                <p style={{ color: '#4a5568', fontSize: '1.1rem' }}>Loading your rentals...</p>
              </div>
            ) : myRentals.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#f7fafc',
                borderRadius: '20px',
                border: '2px dashed #cbd5e0'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🏠</div>
                <h3 style={{
                  fontSize: '1.5rem',
                  color: '#2d3748',
                  margin: '0 0 15px 0',
                  fontWeight: 'bold'
                }}>
                  No dogs rented yet
                </h3>
                <p style={{
                  color: '#4a5568',
                  margin: '0 0 25px 0',
                  fontSize: '1.1rem'
                }}>
                  Start exploring and rent your first dog companion
                </p>
                <button
                  onClick={onBrowseDogs}
                  style={{
                    padding: '15px 30px',
                    backgroundColor: '#48bb78',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#38a169'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#48bb78'}
                >
                  Browse Dogs
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '25px'
              }}>
                {myRentals.map((rental) => (
                  <div key={rental.id} style={{
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '15px',
                    padding: '25px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                  }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '15px',
                        background: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem'
                      }}>
                        🐕
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: '1.3rem',
                          color: '#2d3748',
                          margin: '0 0 5px 0',
                          fontWeight: 'bold'
                        }}>
                          {rental.dogName}
                        </h3>
                        <p style={{
                          color: '#4a5568',
                          margin: '0 0 5px 0',
                          fontSize: '1rem'
                        }}>
                          {rental.dogBreed}
                        </p>
                        <p style={{
                          color: '#718096',
                          margin: '0 0 5px 0',
                          fontSize: '0.9rem'
                        }}>
                          Owner: {rental.dogOwnerName}
                        </p>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: rental.status === 'active' ? '#fed7d7' : '#c6f6d5',
                            color: rental.status === 'active' ? '#742a2a' : '#22543d',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            {rental.status === 'active' ? 'Currently Rented' : 'Completed'}
                          </span>
                          <span style={{
                            color: '#4a5568',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                          }}>
                            ${rental.totalCost}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      gap: '10px'
                    }}>
                      <button
                        onClick={() => {
                          // Find the dog object to pass to message function
                          const dog = dogs.find(d => d.id === rental.dogId);
                          if (dog) {
                            onMessageDogOwner(dog);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#4299e1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3182ce'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4299e1'}
                      >
                        💬 Message Owner
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rental Details Modal */}
      {showRentalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowRentalModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{
                fontSize: '2.5rem',
                color: '#2d3748',
                margin: '0 0 10px 0',
                fontWeight: 'bold'
              }}>
                🏠 My Rental History
              </h2>
              <p style={{
                color: '#4a5568',
                fontSize: '1.1rem',
                margin: 0
              }}>
                Complete breakdown of your dog rental expenses
              </p>
            </div>

            {/* Rental Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${totalPaid}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Paid</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  {myRentals.length}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Rentals</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  {myRentals.filter(rental => rental.status === 'active').length}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Active Rentals</div>
              </div>
            </div>

            {/* Detailed Rental Breakdown */}
            <div>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#2d3748',
                margin: '0 0 20px 0',
                fontWeight: 'bold'
              }}>
                📋 Rental Details
              </h3>
              
              {myRentals.length > 0 ? (
                <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '15px' }}>
                  {myRentals.map((rental, index) => (
                    <div key={rental.id} style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '10px',
                      marginBottom: index < myRentals.length - 1 ? '15px' : '0',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '15px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '8px'
                          }}>
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: rental.status === 'active' ? '#c6f6d5' : '#c6f6d5',
                              color: rental.status === 'active' ? '#22543d' : '#22543d',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}>
                              {rental.status === 'active' ? '🟢 Active' : '✅ Completed'}
                            </span>
                            <span style={{
                              fontSize: '0.9rem',
                              color: '#4a5568'
                            }}>
                              {rental.startDate?.toDate ? rental.startDate.toDate().toLocaleDateString() : 'N/A'} - {rental.endDate?.toDate ? rental.endDate.toDate().toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <h4 style={{
                            fontSize: '1.2rem',
                            color: '#2d3748',
                            margin: '0 0 5px 0',
                            fontWeight: 'bold'
                          }}>
                            {rental.dogName} ({rental.dogBreed})
                          </h4>
                          <p style={{
                            color: '#4a5568',
                            margin: '0 0 5px 0',
                            fontSize: '0.9rem'
                          }}>
                            Owner: {rental.dogOwnerName}
                          </p>
                        </div>
                        <div style={{
                          textAlign: 'right',
                          minWidth: '100px'
                        }}>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#667eea',
                            marginBottom: '5px'
                          }}>
                            ${rental.totalCost}
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#4a5568'
                          }}>
                            Total Cost
                          </div>
                        </div>
                      </div>
                      
                      {rental.status === 'active' && (
                        <div style={{
                          background: '#fef5e7',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #fed7aa'
                        }}>
                          <p style={{
                            color: '#c05621',
                            margin: 0,
                            fontSize: '0.9rem',
                            fontStyle: 'italic'
                          }}>
                            ⏳ This rental is currently active
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  background: '#f7fafc', 
                  padding: '40px', 
                  borderRadius: '15px',
                  textAlign: 'center',
                  border: '2px dashed #cbd5e0'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏠</div>
                  <h4 style={{
                    fontSize: '1.3rem',
                    color: '#2d3748',
                    margin: '0 0 10px 0',
                    fontWeight: 'bold'
                  }}>
                    No rentals yet
                  </h4>
                  <p style={{
                    color: '#4a5568',
                    margin: 0,
                    fontSize: '1rem'
                  }}>
                    Start exploring and rent your first dog companion
                  </p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button
                onClick={() => setShowRentalModal(false)}
                style={{
                  padding: '15px 30px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a67d8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#667eea'}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenterDashboard;
