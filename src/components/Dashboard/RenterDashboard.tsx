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
            Find Your Perfect Companion
          </h1>
          <p style={{
            fontSize: '1.3rem',
            margin: '0 0 30px 0',
            lineHeight: '1.6',
            opacity: 0.9
          }}>
            Discover amazing dogs for walks, companionship, and adventures
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
                {availableDogs.length}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Dogs Available</div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '20px 30px',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '5px' }}>
                ${totalPaid}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Total Paid</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div style={{ background: 'white', padding: '60px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* My Rented Dogs Section */}
          <div>
            <h2 style={{
              fontSize: '2.5rem',
              color: '#2d3748',
              margin: '0 0 30px 0',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              🏠 My Rented Dogs
            </h2>
            
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

          {/* Available Dogs Section */}
          <div style={{ marginTop: '60px' }}>
            <h2 style={{
              fontSize: '2.5rem',
              color: '#2d3748',
              margin: '0 0 30px 0',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              🐕 Available Dogs Near You
            </h2>
            
            {availableDogs.length === 0 && requestedDogs.length === 0 ? (
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
                  No dogs available right now
                </h3>
                <p style={{
                  color: '#4a5568',
                  margin: '0 0 25px 0',
                  fontSize: '1.1rem'
                }}>
                  Check back later or browse all dogs to find your perfect companion
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
                  Browse All Dogs
                </button>
              </div>
            ) : (
              <>
                {/* Available Dogs */}
                {availableDogs.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '25px',
                    marginBottom: '40px'
                  }}>
                    {availableDogs.slice(0, 4).map((dog) => (
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
                              {dog.breed} • {dog.age} years old
                            </p>
                            <p style={{
                              color: '#48bb78',
                              margin: 0,
                              fontWeight: 'bold',
                              fontSize: '1.1rem'
                            }}>
                              ${dog.pricePerDay}/day
                            </p>
                          </div>
                        </div>
                        
                        <p style={{
                          color: '#4a5568',
                          margin: '0 0 20px 0',
                          lineHeight: '1.5'
                        }}>
                          {dog.description}
                        </p>
                        
                        <div style={{
                          display: 'flex',
                          gap: '10px'
                        }}>
                          <button
                            onClick={() => onRentDog(dog)}
                            style={{
                              flex: 1,
                              padding: '12px',
                              backgroundColor: '#ed8936',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dd6b20'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ed8936'}
                          >
                            📝 Request This Dog
                          </button>
                          <button
                            onClick={() => onMessageDogOwner(dog)}
                            style={{
                              padding: '12px 16px',
                              backgroundColor: '#38a169',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2f855a'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#38a169'}
                          >
                            💬 Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Requested Dogs */}
                {requestedDogs.length > 0 && (
                  <div style={{ marginTop: '40px' }}>
                    <h2 style={{
                      fontSize: '2.5rem',
                      color: '#2d3748',
                      margin: '0 0 30px 0',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      ⏳ Your Pending Requests
                    </h2>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                      gap: '25px'
                    }}>
                      {requestedDogs.map((dog) => (
                        <div key={dog.id} style={{
                          background: 'white',
                          border: '2px solid #ed8936',
                          borderRadius: '15px',
                          padding: '25px',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                          position: 'relative'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '15px',
                            right: '15px',
                            background: '#ed8936',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            PENDING
                          </div>
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
                                {dog.breed} • {dog.age} years old
                              </p>
                              <p style={{
                                color: '#48bb78',
                                margin: 0,
                                fontWeight: 'bold',
                                fontSize: '1.1rem'
                              }}>
                                ${dog.pricePerDay}/day
                              </p>
                            </div>
                          </div>
                          
                          <p style={{
                            color: '#4a5568',
                            margin: '0 0 20px 0',
                            lineHeight: '1.5'
                          }}>
                            {dog.description}
                          </p>
                          
                          <div style={{
                            display: 'flex',
                            gap: '10px'
                          }}>
                            <button
                              disabled
                              style={{
                                flex: 1,
                                padding: '12px',
                                backgroundColor: '#cbd5e0',
                                color: '#4a5568',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'not-allowed',
                                fontWeight: 'bold',
                                fontSize: '1rem'
                              }}
                            >
                              ⏳ Request Pending
                            </button>
                            <button
                              onClick={() => onMessageDogOwner(dog)}
                              style={{
                                padding: '12px 16px',
                                backgroundColor: '#38a169',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2f855a'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#38a169'}
                            >
                              💬 Message
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {availableDogs.length > 4 && (
              <div style={{
                textAlign: 'center',
                marginTop: '40px'
              }}>
                <button
                  onClick={onBrowseDogs}
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
                  View All {availableDogs.length} Dogs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenterDashboard;
