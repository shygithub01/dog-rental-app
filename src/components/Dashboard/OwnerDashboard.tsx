import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';

interface OwnerDashboardProps {
  dogs: any[];
  onAddDog: () => void;
  onEditDog: (dog: any) => void;
  onDeleteDog: (dog: any) => void;
  onViewRequests: () => void;
  onViewEarnings: () => void;
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

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  dogs,
  onAddDog,
  onEditDog,
  onDeleteDog,
  onViewRequests,
  onViewEarnings,
  user
}) => {
  const { db } = useFirebase();
  const [myRentals, setMyRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEarningsModal, setShowEarningsModal] = useState(false);

  const myDogs = dogs.filter(dog => dog.ownerId === user?.uid);
  const availableDogs = myDogs.filter(dog => dog.isAvailable && dog.status === 'available');
  const requestedDogs = myDogs.filter(dog => !dog.isAvailable && dog.status === 'requested');
  const rentedDogs = myDogs.filter(dog => !dog.isAvailable && dog.status === 'rented');

  // Fetch user's rentals from the rentals collection
  useEffect(() => {
    const fetchMyRentals = async () => {
      if (!user?.uid) return;
      
      try {
        const rentalsQuery = query(
          collection(db, 'rentals'),
          where('dogOwnerId', '==', user.uid),
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

  // Calculate earnings from actual rentals
  const pastEarnings = myRentals
    .filter(rental => rental.status === 'completed')
    .reduce((sum, rental) => sum + (rental.totalCost || 0), 0);
  
  const pendingEarnings = myRentals
    .filter(rental => rental.status === 'active')
    .reduce((sum, rental) => sum + (rental.totalCost || 0), 0);

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
            Manage Your Dogs
          </h1>
          <p style={{
            fontSize: '1.3rem',
            margin: '0 0 30px 0',
            lineHeight: '1.6',
            opacity: 0.9
          }}>
            Share your beloved dogs with the community and earn money
          </p>
          
          {/* Quick Stats in Hero */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            marginTop: '40px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '20px 30px',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '5px' }}>
                {myDogs.length}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Dogs Listed</div>
            </div>
            <div 
              onClick={() => setShowEarningsModal(true)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '20px 30px',
                borderRadius: '15px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '5px' }}>
                ${pastEarnings}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Past Earnings</div>
            </div>
            <div 
              onClick={() => setShowEarningsModal(true)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '20px 30px',
                borderRadius: '15px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '5px' }}>
                ${pendingEarnings}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Pending to Earn</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div style={{ background: 'white', padding: '60px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* My Dogs Section */}
          <div>
            <h2 style={{
              fontSize: '2.5rem',
              color: '#2d3748',
              margin: '0 0 30px 0',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              🐕 My Furry Entrepreneurs
            </h2>
            
            {myDogs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#f7fafc',
                borderRadius: '20px',
                border: '2px dashed #cbd5e0'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🐕</div>
                <h3 style={{
                  fontSize: '1.5rem',
                  color: '#2d3748',
                  margin: '0 0 15px 0',
                  fontWeight: 'bold'
                }}>
                  No dogs listed yet
                </h3>
                <p style={{
                  color: '#4a5568',
                  margin: '0 0 25px 0',
                  fontSize: '1.1rem'
                }}>
                  Start earning by adding your first dog for rent
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '25px'
              }}>
                {myDogs.map((dog) => {
                  // Find rental information for this dog
                  const dogRental = myRentals.find(rental => rental.dogId === dog.id);
                  
                  return (
                    <div key={dog.id} style={{
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
                          background: dog.imageUrl ? `url(${dog.imageUrl})` : '#e2e8f0',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem'
                        }}>
                          {!dog.imageUrl && '🐕'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: '1.3rem',
                            color: '#2d3748',
                            margin: '0 0 5px 0',
                            fontWeight: 'bold'
                          }}>
                            {dog.name}
                          </h3>
                          <p style={{
                            color: '#4a5568',
                            margin: '0 0 5px 0',
                            fontSize: '1rem'
                          }}>
                            {dog.breed}
                          </p>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: dog.status === 'available' ? '#c6f6d5' : 
                                               dog.status === 'requested' ? '#fef5e7' : '#fed7d7',
                              color: dog.status === 'available' ? '#22543d' : 
                                    dog.status === 'requested' ? '#c05621' : '#742a2a',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}>
                              {dog.status === 'available' ? 'Available' : 
                               dog.status === 'requested' ? 'Waiting Approval' : 'Rented'}
                            </span>
                            <span style={{
                              color: '#4a5568',
                              fontSize: '0.9rem'
                            }}>
                              ${dog.pricePerDay}/day
                            </span>
                          </div>
                          {/* Show renter information if dog is rented */}
                          {dog.status === 'rented' && dogRental && (
                            <div style={{
                              marginTop: '10px',
                              padding: '8px 12px',
                              backgroundColor: '#f7fafc',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0'
                            }}>
                              <p style={{
                                color: '#4a5568',
                                margin: '0 0 5px 0',
                                fontSize: '0.9rem',
                                fontWeight: 'bold'
                              }}>
                                🏠 Rented by: {dogRental.renterName}
                              </p>
                              <p style={{
                                color: '#718096',
                                margin: '0 0 5px 0',
                                fontSize: '0.8rem'
                              }}>
                                💰 Total Cost: ${dogRental.totalCost}
                              </p>
                              <p style={{
                                color: '#718096',
                                margin: '0',
                                fontSize: '0.8rem'
                              }}>
                                📅 Status: {dogRental.status === 'active' ? 'Currently Rented' : 'Completed'}
                              </p>
                            </div>
                          )}
                          {/* Show request information if dog is requested */}
                          {dog.status === 'requested' && (
                            <div style={{
                              marginTop: '10px',
                              padding: '8px 12px',
                              backgroundColor: '#fef5e7',
                              borderRadius: '8px',
                              border: '1px solid #fed7aa'
                            }}>
                              <p style={{
                                color: '#c05621',
                                margin: '0 0 5px 0',
                                fontSize: '0.9rem',
                                fontWeight: 'bold'
                              }}>
                                ⏳ Request Pending
                              </p>
                              <p style={{
                                color: '#c05621',
                                margin: '0',
                                fontSize: '0.8rem'
                              }}>
                                Check your requests to approve or reject
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '10px'
                      }}>
                        {dog.status === 'available' ? (
                          <>
                            <button
                              onClick={() => onEditDog(dog)}
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
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => onDeleteDog(dog)}
                              style={{
                                flex: 1,
                                padding: '12px',
                                backgroundColor: '#e53e3e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c53030'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e53e3e'}
                            >
                              🗑️ Delete
                            </button>
                          </>
                        ) : dog.status === 'requested' ? (
                          <button
                            onClick={onViewRequests}
                            style={{
                              flex: 1,
                              padding: '12px',
                              backgroundColor: '#ed8936',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dd6b20'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ed8936'}
                          >
                            📋 Review Request
                          </button>
                        ) : (
                          <button
                            style={{
                              flex: 1,
                              padding: '12px',
                              backgroundColor: '#cbd5e0',
                              color: '#4a5568',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'not-allowed',
                              fontWeight: 'bold',
                              fontSize: '0.9rem'
                            }}
                            disabled
                          >
                            🔒 Currently Rented
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Earnings Modal */}
      {showEarningsModal && (
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowEarningsModal(false)}
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
                💰 Earnings Report
              </h2>
              <p style={{
                color: '#4a5568',
                fontSize: '1.1rem',
                margin: 0
              }}>
                Your complete earnings breakdown
              </p>
            </div>

            {/* Earnings Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${pastEarnings}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Past Earnings</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${pendingEarnings}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Pending Earnings</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${pastEarnings + pendingEarnings}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Earnings</div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#2d3748',
                margin: '0 0 20px 0',
                fontWeight: 'bold'
              }}>
                📊 Detailed Breakdown
              </h3>
              
              {/* Past Earnings Details */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  fontSize: '1.2rem',
                  color: '#48bb78',
                  margin: '0 0 15px 0',
                  fontWeight: 'bold'
                }}>
                  ✅ Completed Rentals
                </h4>
                {myRentals.filter(rental => rental.status === 'completed').length > 0 ? (
                  <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '10px' }}>
                    {myRentals.filter(rental => rental.status === 'completed').map((rental, index) => (
                      <div key={rental.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: index < myRentals.filter(rental => rental.status === 'completed').length - 1 ? '1px solid #e2e8f0' : 'none'
                      }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#2d3748' }}>
                            {rental.dogName} ({rental.dogBreed})
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                            Rented by {rental.renterName}
                          </div>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#48bb78', fontSize: '1.1rem' }}>
                          ${rental.totalCost}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    background: '#f7fafc', 
                    padding: '20px', 
                    borderRadius: '10px',
                    textAlign: 'center',
                    color: '#4a5568'
                  }}>
                    No completed rentals yet
                  </div>
                )}
              </div>

              {/* Pending Earnings Details */}
              <div>
                <h4 style={{
                  fontSize: '1.2rem',
                  color: '#ed8936',
                  margin: '0 0 15px 0',
                  fontWeight: 'bold'
                }}>
                  ⏳ Active Rentals
                </h4>
                {myRentals.filter(rental => rental.status === 'active').length > 0 ? (
                  <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '10px' }}>
                    {myRentals.filter(rental => rental.status === 'active').map((rental, index) => (
                      <div key={rental.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: index < myRentals.filter(rental => rental.status === 'active').length - 1 ? '1px solid #e2e8f0' : 'none'
                      }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#2d3748' }}>
                            {rental.dogName} ({rental.dogBreed})
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                            Currently rented by {rental.renterName}
                          </div>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#ed8936', fontSize: '1.1rem' }}>
                          ${rental.totalCost}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    background: '#f7fafc', 
                    padding: '20px', 
                    borderRadius: '10px',
                    textAlign: 'center',
                    color: '#4a5568'
                  }}>
                    No active rentals at the moment
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowEarningsModal(false)}
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

export default OwnerDashboard;
