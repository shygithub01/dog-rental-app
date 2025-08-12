import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';

interface HybridDashboardProps {
  dogs: any[];
  onAddDog: () => void;
  onEditDog: (dog: any) => void;
  onDeleteDog: (dog: any) => void;
  onViewRequests: () => void;
  onViewEarnings: () => void;
  onBrowseDogs: () => void;
  onViewMyRentals: () => void;
  onViewFavorites: () => void;
  onRentDog: (dog: any) => void;
  onMessageDogOwner: (dog: any) => void;
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

const HybridDashboard: React.FC<HybridDashboardProps> = ({
  dogs,
  onAddDog,
  onEditDog,
  onDeleteDog,
  onViewRequests,
  onViewEarnings,
  onBrowseDogs,
  onViewMyRentals,
  onViewFavorites,
  onRentDog,
  onMessageDogOwner,
  user
}) => {
  const { db } = useFirebase();
  const [activeMode, setActiveMode] = useState<'owner' | 'renter'>('owner');
  const [myRentals, setMyRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  
  const myDogs = dogs.filter(dog => dog.ownerId === user?.uid);
  const availableDogs = dogs.filter(dog => dog.isAvailable && dog.ownerId !== user?.uid);
  const rentedDogs = myDogs.filter(dog => !dog.isAvailable);
  
  // Calculate earnings for owner mode
  const pastEarnings = rentedDogs.reduce((sum, dog) => sum + (dog.totalEarnings || 0), 0);
  const pendingEarnings = rentedDogs.reduce((sum, dog) => sum + (dog.pricePerDay || 0), 0);
  
  // Calculate total paid for renter mode
  const totalPaid = myRentals.reduce((sum, rental) => sum + (rental.totalCost || 0), 0);
  
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
            Welcome back, {user?.displayName || user?.email}!
          </h1>
          <p style={{
            fontSize: '1.3rem',
            margin: '0 0 30px 0',
            lineHeight: '1.6',
            opacity: 0.9
          }}>
            You can both list your dogs and rent from others
          </p>
          
          {/* Mode Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '40px'
          }}>
            <button
              onClick={() => setActiveMode('owner')}
              style={{
                padding: '15px 30px',
                backgroundColor: activeMode === 'owner' ? '#48bb78' : 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🏠 Owner Mode
            </button>
            <button
              onClick={() => setActiveMode('renter')}
              style={{
                padding: '15px 30px',
                backgroundColor: activeMode === 'renter' ? '#48bb78' : 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🐾 Renter Mode
            </button>
          </div>
          
          {/* Quick Stats in Hero */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            marginTop: '20px'
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
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>My Dogs</div>
            </div>
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
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Available to Rent</div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '20px 30px',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '5px' }}>
                {activeMode === 'owner' ? `$${pastEarnings}` : `$${totalPaid}`}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                {activeMode === 'owner' ? 'Past Earnings' : 'Total Paid'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div style={{ background: 'white', padding: '60px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Owner Mode Content */}
          {activeMode === 'owner' && (
            <>
              {/* Quick Actions */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '50px'
              }}>
                <button
                  onClick={onAddDog}
                  style={{
                    padding: '25px',
                    backgroundColor: '#48bb78',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(72, 187, 120, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(72, 187, 120, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(72, 187, 120, 0.3)';
                  }}
                >
                  🐕 Add New Dog
                </button>
                
                <button
                  onClick={onViewRequests}
                  style={{
                    padding: '25px',
                    backgroundColor: '#4299e1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(66, 153, 225, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(66, 153, 225, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(66, 153, 225, 0.3)';
                  }}
                >
                  📋 View Requests
                </button>
                
                <button
                  onClick={onViewEarnings}
                  style={{
                    padding: '25px',
                    backgroundColor: '#ed8936',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(237, 137, 54, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(237, 137, 54, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(237, 137, 54, 0.3)';
                  }}
                >
                  💰 View Earnings
                </button>
              </div>

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
                    <button
                      onClick={onAddDog}
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
                      Add Your First Dog
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '25px'
                  }}>
                    {myDogs.map((dog) => (
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
                                backgroundColor: dog.isAvailable ? '#c6f6d5' : '#fed7d7',
                                color: dog.isAvailable ? '#22543d' : '#742a2a',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                              }}>
                                {dog.isAvailable ? 'Available' : 'Rented'}
                              </span>
                              <span style={{
                                color: '#4a5568',
                                fontSize: '0.9rem'
                              }}>
                                ${dog.pricePerDay}/day
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          gap: '10px'
                        }}>
                          {dog.isAvailable ? (
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
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Renter Mode Content */}
          {activeMode === 'renter' && (
            <>
              {/* Quick Actions */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '50px'
              }}>
                <button
                  onClick={onBrowseDogs}
                  style={{
                    padding: '25px',
                    backgroundColor: '#48bb78',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(72, 187, 120, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(72, 187, 120, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(72, 187, 120, 0.3)';
                  }}
                >
                  🔍 Browse All Dogs
                </button>
                
                <button
                  onClick={onViewMyRentals}
                  style={{
                    padding: '25px',
                    backgroundColor: '#4299e1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(66, 153, 225, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(66, 153, 225, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(66, 153, 225, 0.3)';
                  }}
                >
                  📅 My Rentals
                </button>
                
                <button
                  onClick={onViewFavorites}
                  style={{
                    padding: '25px',
                    backgroundColor: '#ed8936',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(237, 137, 54, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(237, 137, 54, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(237, 137, 54, 0.3)';
                  }}
                >
                  ❤️ Favorites
                </button>
              </div>

              {/* My Rented Dogs Section */}
              <div>
                <h2 style={{
                  fontSize: '2.5rem',
                  color: '#2d3748',
                  margin: '0 0 30px 0',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  🐾 My Adventure Buddies
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
                
                {nearbyDogs.length === 0 ? (
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
                      Check back later or browse all dogs to find your furry soulmate
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
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '25px'
                  }}>
                    {nearbyDogs.map((dog) => (
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
                            <p style={{
                              color: '#718096',
                              margin: '0 0 5px 0',
                              fontSize: '0.9rem'
                            }}>
                              Owner: {dog.ownerName}
                            </p>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <span style={{
                                padding: '4px 8px',
                                backgroundColor: '#c6f6d5',
                                color: '#22543d',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                              }}>
                                Available
                              </span>
                              <span style={{
                                color: '#4a5568',
                                fontSize: '0.9rem',
                                fontWeight: 'bold'
                              }}>
                                ${dog.pricePerDay}/day
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          gap: '10px'
                        }}>
                          <button
                            onClick={() => onRentDog(dog)}
                            style={{
                              flex: 1,
                              padding: '12px',
                              backgroundColor: '#48bb78',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#38a169'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#48bb78'}
                          >
                            🏠 Rent
                          </button>
                          <button
                            onClick={() => onMessageDogOwner(dog)}
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
                            💬 Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HybridDashboard;
