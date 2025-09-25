import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';
import { useIsMobile } from '../../hooks/useIsMobile';

interface OwnerDashboardProps {
  dogs: any[];
  onAddDog: () => void;
  onEditDog: (dog: any) => void;
  onDeleteDog: (dog: any) => void;
  onViewRequests: () => void;
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
  user
}) => {
  const isMobile = useIsMobile();
  const { db } = useFirebase();
  const [myRentals, setMyRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  const myDogs = dogs.filter(dog => dog.ownerId === user?.id);
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
    <div style={{ 
      minHeight: '100vh', 
      padding: '0',
      background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(45, 212, 191, 0.1) 25%, rgba(253, 224, 71, 0.1) 50%, rgba(132, 204, 22, 0.1) 75%, rgba(255, 142, 83, 0.1) 100%), radial-gradient(circle at 20% 20%, rgba(255, 107, 53, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(45, 212, 191, 0.15) 0%, transparent 50%), radial-gradient(circle at 40% 60%, rgba(253, 224, 71, 0.1) 0%, transparent 30%), radial-gradient(circle at 70% 30%, rgba(132, 204, 22, 0.1) 0%, transparent 30%), #FAFAF9',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Hero Section */}
      <div style={{
        background: 'transparent',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '40px 20px'
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
            lineHeight: '1.2',
            textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
          }}>
            My Furry Entrepreneurs
          </h1>
          <p style={{
            fontSize: '1.3rem',
            margin: '0 0 30px 0',
            lineHeight: '1.6',
            opacity: 0.9,
            textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
          }}>
            Share your beloved dogs with the community and earn money
          </p>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        padding: '60px 40px',
        backdropFilter: 'blur(10px)',
        margin: '0 20px 20px 20px',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* My Dogs Section */}
          <div>
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
              <div className="mobile-dogs-grid">
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
                                color: '#FF6B35',
                                margin: '0 0 5px 0',
                                fontSize: '0.8rem'
                              }}>
                                💰 Total Cost: ${dogRental.totalCost}
                              </p>
                              <p style={{
                                color: '#FF6B35',
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
                                backgroundColor: '#FF6B35',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FF8E53'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF6B35'}
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
                              backgroundColor: '#2DD4BF',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#67E8F9'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2DD4BF'}
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
    </div>
  );
};

export default OwnerDashboard;
