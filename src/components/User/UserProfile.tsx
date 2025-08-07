import React, { useState, useEffect } from 'react';
import { useUserService } from '../../services/userService';
import type { UserProfileData } from '../../types/User';

interface UserProfileProps {
  userId: string;
  onClose?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onClose }) => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'dogs' | 'rentals' | 'reviews'>('overview');
  const userService = useUserService();

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Loading user profile for userId:', userId);
      const userProfile = await userService.getUserProfile(userId);
      console.log('User profile loaded:', userProfile);
      setProfile(userProfile);
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      setError(error.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? '#fbbf24' : '#d1d5db' }}>
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          maxWidth: '800px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
          <h2 style={{ color: '#2d3748', margin: '0 0 10px 0' }}>Loading Profile...</h2>
          <p style={{ color: '#4a5568', margin: 0 }}>Please wait while we load the user profile</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{
        background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          maxWidth: '800px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#2d3748', margin: '0 0 10px 0' }}>Profile Not Found</h2>
          <p style={{ color: '#4a5568', margin: '0 0 20px 0' }}>
            {error || 'This user profile could not be loaded'}
          </p>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const { user, dogs, recentRentals, reviews } = profile;

  return (
    <div style={{
      background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #f7fafc'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: user.photoURL ? `url(${user.photoURL})` : '#e2e8f0',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              color: '#4a5568',
              border: '3px solid #4299e1'
            }}>
              {!user.photoURL && '👤'}
            </div>
            <div>
              <h1 style={{
                fontSize: '2rem',
                color: '#2d3748',
                margin: '0 0 5px 0',
                fontWeight: 'bold'
              }}>
                {user.displayName}
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                fontSize: '0.9rem',
                color: '#4a5568'
              }}>
                <span>⭐ {user.rating.toFixed(1)} ({user.totalReviews} reviews)</span>
                <span>📅 Member since {formatDate(user.joinDate)}</span>
                {user.isVerified && <span style={{ color: '#48bb78' }}>✅ Verified</span>}
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Close
            </button>
          )}
        </div>

        {/* User Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          marginBottom: '30px'
        }}>
          <div>
            <h3 style={{
              fontSize: '1.2rem',
              color: '#2d3748',
              margin: '0 0 15px 0',
              fontWeight: 'bold'
            }}>
              📍 Contact Information
            </h3>
            <div style={{
              background: '#f7fafc',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{ margin: '0 0 8px 0', color: '#4a5568' }}>
                <strong>Email:</strong> {user.email}
              </p>
              {user.phoneNumber && (
                <p style={{ margin: '0 0 8px 0', color: '#4a5568' }}>
                  <strong>Phone:</strong> {user.phoneNumber}
                </p>
              )}
              {user.location && (
                <p style={{ margin: '0 0 8px 0', color: '#4a5568' }}>
                  <strong>Location:</strong> {user.location}
                </p>
              )}
              {user.bio && (
                <p style={{ margin: '0 0 8px 0', color: '#4a5568' }}>
                  <strong>Bio:</strong> {user.bio}
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 style={{
              fontSize: '1.2rem',
              color: '#2d3748',
              margin: '0 0 15px 0',
              fontWeight: 'bold'
            }}>
              📊 Statistics
            </h3>
            <div style={{
              background: '#f7fafc',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px'
              }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>Dogs Owned</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>
                    {user.stats.dogsOwned}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>Total Rentals</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>
                    {user.stats.totalRentals}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>Completed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#48bb78' }}>
                    {user.stats.completedRentals}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>Total Earnings</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38a169' }}>
                    {formatCurrency(user.stats.totalEarnings)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {[
            { key: 'overview', label: 'Overview', icon: '📋' },
            { key: 'dogs', label: `Dogs (${dogs.length})`, icon: '🐕' },
            { key: 'rentals', label: `Rentals (${recentRentals.length})`, icon: '📅' },
            { key: 'reviews', label: `Reviews (${reviews.length})`, icon: '⭐' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              style={{
                padding: '12px 20px',
                backgroundColor: activeTab === key ? '#4299e1' : 'transparent',
                color: activeTab === key ? 'white' : '#4a5568',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '10px'
        }}>
          {activeTab === 'overview' && (
            <div>
              <h3 style={{
                fontSize: '1.3rem',
                color: '#2d3748',
                margin: '0 0 20px 0',
                fontWeight: 'bold'
              }}>
                🎯 Overview
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px'
              }}>
                <div style={{
                  background: '#f0fff4',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '2px solid #9ae6b4'
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    color: '#2d3748',
                    margin: '0 0 10px 0',
                    fontWeight: 'bold'
                  }}>
                    🐕 Dog Ownership
                  </h4>
                  <p style={{ margin: '0 0 10px 0', color: '#4a5568' }}>
                    Owns <strong>{dogs.length}</strong> dogs
                  </p>
                  <p style={{ margin: '0 0 10px 0', color: '#4a5568' }}>
                    <strong>{dogs.filter(d => d.isAvailable).length}</strong> currently available
                  </p>
                  <p style={{ margin: 0, color: '#4a5568' }}>
                    Average rating: {getRatingStars(dogs.length > 0 ? dogs.reduce((sum, d) => sum + d.averageRating, 0) / dogs.length : 0)}
                  </p>
                </div>

                <div style={{
                  background: '#fef5e7',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '2px solid #f6ad55'
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    color: '#2d3748',
                    margin: '0 0 10px 0',
                    fontWeight: 'bold'
                  }}>
                    📈 Rental Activity
                  </h4>
                  <p style={{ margin: '0 0 10px 0', color: '#4a5568' }}>
                    <strong>{user.stats.totalRentals}</strong> total rentals
                  </p>
                  <p style={{ margin: '0 0 10px 0', color: '#4a5568' }}>
                    <strong>{user.stats.completedRentals}</strong> completed
                  </p>
                  <p style={{ margin: 0, color: '#4a5568' }}>
                    Earned <strong>{formatCurrency(user.stats.totalEarnings)}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dogs' && (
            <div>
              <h3 style={{
                fontSize: '1.3rem',
                color: '#2d3748',
                margin: '0 0 20px 0',
                fontWeight: 'bold'
              }}>
                🐕 Dogs Owned
              </h3>
              {dogs.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#4a5568'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🐕</div>
                  <h4 style={{
                    fontSize: '1.2rem',
                    color: '#2d3748',
                    margin: '0 0 10px 0'
                  }}>
                    No dogs yet
                  </h4>
                  <p style={{ margin: 0, color: '#718096' }}>
                    This user hasn't added any dogs for rent yet.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px'
                }}>
                  {dogs.map((dog) => (
                    <div key={dog.id} style={{
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '20px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        marginBottom: '15px'
                      }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '10px',
                          background: dog.imageUrl ? `url(${dog.imageUrl})` : '#e2e8f0',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem'
                        }}>
                          {!dog.imageUrl && '🐕'}
                        </div>
                        <div>
                          <h4 style={{
                            fontSize: '1.1rem',
                            color: '#2d3748',
                            margin: '0 0 5px 0',
                            fontWeight: 'bold'
                          }}>
                            {dog.name}
                          </h4>
                          <p style={{
                            margin: '0 0 5px 0',
                            color: '#4a5568',
                            fontSize: '0.9rem'
                          }}>
                            {dog.breed}
                          </p>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '0.8rem'
                          }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: dog.isAvailable ? '#48bb78' : '#e53e3e',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {dog.isAvailable ? 'Available' : 'Rented'}
                            </span>
                            <span style={{ color: '#718096' }}>
                              {dog.totalRentals} rentals
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                          Rating: {getRatingStars(dog.averageRating)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rentals' && (
            <div>
              <h3 style={{
                fontSize: '1.3rem',
                color: '#2d3748',
                margin: '0 0 20px 0',
                fontWeight: 'bold'
              }}>
                📅 Recent Rentals
              </h3>
              {recentRentals.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#4a5568'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📅</div>
                  <h4 style={{
                    fontSize: '1.2rem',
                    color: '#2d3748',
                    margin: '0 0 10px 0'
                  }}>
                    No rentals yet
                  </h4>
                  <p style={{ margin: 0, color: '#718096' }}>
                    This user hasn't made any rentals yet.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  {recentRentals.map((rental) => (
                    <div key={rental.id} style={{
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '20px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px'
                      }}>
                        <h4 style={{
                          fontSize: '1.1rem',
                          color: '#2d3748',
                          margin: 0,
                          fontWeight: 'bold'
                        }}>
                          {rental.dogName} ({rental.dogBreed})
                        </h4>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          backgroundColor: rental.status === 'completed' ? '#48bb78' : 
                                         rental.status === 'active' ? '#4299e1' : '#e53e3e',
                          color: 'white'
                        }}>
                          {rental.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '15px',
                        fontSize: '0.9rem',
                        color: '#4a5568'
                      }}>
                        <div>
                          <strong>Start:</strong> {formatDate(rental.startDate)}
                        </div>
                        <div>
                          <strong>End:</strong> {formatDate(rental.endDate)}
                        </div>
                        <div>
                          <strong>Cost:</strong> {formatCurrency(rental.totalCost)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h3 style={{
                fontSize: '1.3rem',
                color: '#2d3748',
                margin: '0 0 20px 0',
                fontWeight: 'bold'
              }}>
                ⭐ Reviews
              </h3>
              {reviews.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#4a5568'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⭐</div>
                  <h4 style={{
                    fontSize: '1.2rem',
                    color: '#2d3748',
                    margin: '0 0 10px 0'
                  }}>
                    No reviews yet
                  </h4>
                  <p style={{ margin: 0, color: '#718096' }}>
                    This user hasn't received any reviews yet.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  {reviews.map((review) => (
                    <div key={review.id} style={{
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '20px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px'
                      }}>
                        <h4 style={{
                          fontSize: '1.1rem',
                          color: '#2d3748',
                          margin: 0,
                          fontWeight: 'bold'
                        }}>
                          {review.dogName}
                        </h4>
                        <div style={{ fontSize: '1.2rem' }}>
                          {getRatingStars(review.rating)}
                        </div>
                      </div>
                      <p style={{
                        margin: '0 0 10px 0',
                        color: '#4a5568',
                        lineHeight: '1.5'
                      }}>
                        {review.comment}
                      </p>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#718096'
                      }}>
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 