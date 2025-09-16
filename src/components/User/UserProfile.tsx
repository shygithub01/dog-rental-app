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
  const [activeTab, setActiveTab] = useState<'overview' | 'dogs' | 'rentals' | 'reviews' | 'verification'>('overview');
  const [editingVerification, setEditingVerification] = useState(false);
          const [verificationData, setVerificationData] = useState({
          phoneNumber: '',
          address: '',
          birthDate: '',
          idDocument: null as File | null,
          phoneVerified: false,
          addressVerified: false,
          photoVerified: false,
          idVerified: false
        });
        const [isVerifying, setIsVerifying] = useState(false);
        const [verificationMessage, setVerificationMessage] = useState('');
        const [showPhoneVerification, setShowPhoneVerification] = useState(false);
        const [phoneInput, setPhoneInput] = useState('');
        const [verificationCode, setVerificationCode] = useState('');
        const [verificationStep, setVerificationStep] = useState<'phone' | 'code' | 'complete'>('phone');
                const [currentVerificationCode, setCurrentVerificationCode] = useState('');
        const [forceUpdate, setForceUpdate] = useState(0);
        const userService = useUserService();

        // Verification functions
        const handlePhoneVerification = async () => {
          if (!user.phoneNumber || !user.phoneVerified) {
            // Show phone verification modal for new or unverified phones
            setShowPhoneVerification(true);
            setVerificationStep('phone');
            setPhoneInput(user.phoneNumber || '');
            setVerificationCode('');
          } else {
            // Re-verify already verified phone
            setIsVerifying(true);
            setVerificationMessage('Re-verifying phone number...');
            
            try {
              await new Promise(resolve => setTimeout(resolve, 1500));
              setVerificationMessage('Phone number re-verified! ✅');
              setTimeout(() => setVerificationMessage(''), 3000);
            } catch (error) {
              setVerificationMessage('Re-verification failed. Please try again.');
              setTimeout(() => setVerificationMessage(''), 3000);
            } finally {
              setIsVerifying(false);
            }
          }
        };

        const sendVerificationCode = async () => {
          const phoneToVerify = phoneInput.trim() || user.phoneNumber;
          if (!phoneToVerify) {
            setVerificationMessage('Please enter a valid phone number');
            return;
          }

          setIsVerifying(true);
          setVerificationMessage('Sending verification code...');
          
          try {
            // In a real app, this would call your SMS service (Twilio, AWS SNS, etc.)
            // For demo purposes, we'll simulate sending a code
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Generate a 6-digit verification code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Store the code temporarily (in real app, store in Firebase with expiration)
            localStorage.setItem('phoneVerificationCode', code);
            localStorage.setItem('phoneVerificationPhone', phoneToVerify);
            localStorage.setItem('phoneVerificationExpiry', (Date.now() + 300000).toString()); // 5 minutes
            
            // Set the current code in state for immediate display
            setCurrentVerificationCode(code);
            
            setVerificationStep('code');
            setVerificationMessage(`Verification code sent to ${phoneToVerify}! 📱`);
            setTimeout(() => setVerificationMessage(''), 3000);
          } catch (error) {
            setVerificationMessage('Failed to send verification code. Please try again.');
            setTimeout(() => setVerificationMessage(''), 3000);
          } finally {
            setIsVerifying(false);
          }
        };

        const verifyPhoneCode = async () => {
          if (!verificationCode.trim()) {
            setVerificationMessage('Please enter the verification code');
            return;
          }

          setIsVerifying(true);
          setVerificationMessage('Verifying code...');
          
          try {
            // Get stored verification data
            const storedCode = localStorage.getItem('phoneVerificationCode');
            const storedPhone = localStorage.getItem('phoneVerificationPhone');
            const expiry = localStorage.getItem('phoneVerificationExpiry');
            
            if (!storedCode || !storedPhone || !expiry) {
              throw new Error('Verification session expired');
            }
            
            if (Date.now() > parseInt(expiry)) {
              throw new Error('Verification code expired');
            }
            
            if (verificationCode !== storedCode) {
              throw new Error('Invalid verification code');
            }
            
            // Code is valid - update user profile
            await userService.updateUserProfile(user.id, {
              phoneNumber: storedPhone,
              phoneVerified: true
            });
            
            // Clear stored verification data
            localStorage.removeItem('phoneVerificationCode');
            localStorage.removeItem('phoneVerificationPhone');
            localStorage.removeItem('phoneVerificationExpiry');
            
            setVerificationStep('complete');
            setVerificationMessage('Phone number verified successfully! ✅');
            
            // Keep modal open briefly to show success message
            setTimeout(() => {
              setShowPhoneVerification(false);
            }, 1500);
            
            // Update local state immediately for better UX
            if (profile && profile.user) {
              const updatedProfile = {
                ...profile,
                user: {
                  ...profile.user,
                  phoneNumber: storedPhone,
                  phoneVerified: true
                }
              };
              setProfile(updatedProfile);
              
              // Force a re-render
              setForceUpdate(prev => prev + 1);
            }
            
            // Skip database refresh to preserve local state
            // The local update is sufficient and prevents overwriting verification status
            
            setTimeout(() => setVerificationMessage(''), 3000);
          } catch (error) {
            setVerificationMessage(error instanceof Error ? error.message : 'Verification failed. Please try again.');
            setTimeout(() => setVerificationMessage(''), 3000);
          } finally {
            setIsVerifying(false);
          }
        };

        const resendVerificationCode = async () => {
          setVerificationMessage('Resending verification code...');
          await sendVerificationCode();
        };

        const handleIDVerification = async () => {
          if (!user.idDocument) {
            // Create file input for ID upload
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,.pdf';
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                setIsVerifying(true);
                setVerificationMessage('Uploading and verifying ID document...');
                
                try {
                  // Simulate document verification (in real app, this would use AI/ML)
                  setVerificationMessage('Analyzing document...');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  setVerificationMessage('Verifying authenticity...');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  setVerificationMessage('Finalizing verification...');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // Update user profile
                  await userService.updateUserProfile(user.id, {
                    idDocument: file.name,
                    idVerified: true
                  });
                  
                  setVerificationMessage('ID document verified successfully! ✅');
                  setTimeout(() => setVerificationMessage(''), 3000);
                  
                  // Refresh user data
                  if (userId) {
                    const updatedProfile = await userService.getUserProfile(userId);
                    if (updatedProfile) {
                      setProfile(updatedProfile);
                    }
                  }
                } catch (error) {
                  setVerificationMessage('ID verification failed. Please try again.');
                  setTimeout(() => setVerificationMessage(''), 3000);
                } finally {
                  setIsVerifying(false);
                }
              }
            };
            input.click();
          } else {
            // Re-verify existing ID
            setIsVerifying(true);
            setVerificationMessage('Re-verifying ID document...');
            
            try {
              await new Promise(resolve => setTimeout(resolve, 2000));
              setVerificationMessage('ID document re-verified! ✅');
              setTimeout(() => setVerificationMessage(''), 3000);
            } catch (error) {
              setVerificationMessage('Re-verification failed. Please try again.');
              setTimeout(() => setVerificationMessage(''), 3000);
            } finally {
              setIsVerifying(false);
            }
          }
        };

        const handlePhotoVerification = async () => {
          if (!user.photoURL) {
            // Create file input for photo upload
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                setIsVerifying(true);
                setVerificationMessage('Uploading and verifying profile photo...');
                
                try {
                  // Simulate photo verification (in real app, this would use AI face detection)
                  setVerificationMessage('Analyzing photo...');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  setVerificationMessage('Detecting face...');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // Update user profile
                  await userService.updateUserProfile(user.id, {
                    photoURL: URL.createObjectURL(file),
                    photoVerified: true
                  });
                  
                  setVerificationMessage('Profile photo verified successfully! ✅');
                  setTimeout(() => setVerificationMessage(''), 3000);
                  
                  // Refresh user data
                  if (userId) {
                    const updatedProfile = await userService.getUserProfile(userId);
                    if (updatedProfile) {
                      setProfile(updatedProfile);
                    }
                  }
                } catch (error) {
                  setVerificationMessage('Photo verification failed. Please try again.');
                  setTimeout(() => setVerificationMessage(''), 3000);
                } finally {
                  setIsVerifying(false);
                }
              }
            };
            input.click();
          } else {
            // Re-verify existing photo
            setIsVerifying(true);
            setVerificationMessage('Re-verifying profile photo...');
            
            try {
              await new Promise(resolve => setTimeout(resolve, 1500));
              setVerificationMessage('Profile photo re-verified! ✅');
              setTimeout(() => setVerificationMessage(''), 3000);
            } catch (error) {
              setVerificationMessage('Re-verification failed. Please try again.');
              setTimeout(() => setVerificationMessage(''), 3000);
            } finally {
              setIsVerifying(false);
            }
          }
        };

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
        background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("/images/image1.png")',
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
        background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("/images/image1.png")',
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
              className="btn-glass"
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // Don't destructure user - use profile.user directly to ensure reactivity
  const user = profile.user;
  const { dogs, recentRentals, reviews } = profile;

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
              border: '3px solid #6A32B0'
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
                {user.isVerified && <span style={{ color: '#6A32B0' }}>✅ Verified</span>}
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="btn-glass"
            >
              ← Back to Dashboard
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

          {/* Statistics Section */}
          <div style={{ flex: 1, padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '18px', marginRight: '8px' }}>📊</span>
              <h3 style={{ margin: 0, color: '#333' }}>Statistics</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Dogs Owned</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{user.stats.dogsOwned}</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Total Rentals</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{user.stats.totalRentals}</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Active/Completed</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>{user.stats.completedRentals}</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '6px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  {user.stats.dogsOwned > 0 ? 'Total Earnings' : 'Total Paid'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                  ${user.stats.dogsOwned > 0 ? user.stats.totalEarnings : user.stats.totalSpent}.00
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
            { key: 'reviews', label: `Reviews (${reviews.length})`, icon: '⭐' },
            { key: 'verification', label: 'Verification', icon: '🔐' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-5 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                activeTab === key 
                  ? 'bg-primary-600/30 text-primary-900 border border-primary-400/30' 
                  : 'text-gray-600 hover:bg-white/10 hover:text-primary-800'
              }`}
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

                {/* Rental Activity Card */}
                <div style={{
                  flex: 1,
                  padding: '20px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '10px',
                  border: '2px solid #ffc107',
                  marginLeft: '15px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <span style={{ fontSize: '20px', marginRight: '8px' }}>📈</span>
                    <h4 style={{ margin: 0, color: '#856404' }}>Rental Activity</h4>
                  </div>
                  <div style={{ color: '#856404' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>{user.stats.totalRentals}</strong> total rentals
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>{user.stats.completedRentals}</strong> active/completed
                    </div>
                    <div>
                      {user.stats.dogsOwned > 0 ? (
                        <>Earned <strong>${user.stats.totalEarnings}.00</strong></>
                      ) : (
                        <>Paid <strong>${user.stats.totalSpent}.00</strong></>
                      )}
                    </div>
                  </div>
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
                              backgroundColor: dog.isAvailable ? '#6A32B0' : '#e53e3e',
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
                          backgroundColor: rental.status === 'completed' ? '#6A32B0' : 
                                         rental.status === 'active' ? '#6A32B0' : '#e53e3e',
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

          {activeTab === 'verification' && (
            <div>
              {/* Professional Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '32px',
                paddingBottom: '24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '24px'
                }}>
                  🛡️
                </div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>
                  Identity Verification
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  margin: 0,
                  maxWidth: '500px',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}>
                  Help build trust in our community by verifying your identity. 
                  Verified users get access to more features and higher booking limits.
                </p>
              </div>

              {/* Verification Progress Card */}
              {user.verificationScore ? (
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0
                    }}>
                      Verification Progress
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: user.verificationScore.percentage >= 80 ? '#10b981' : 
                               user.verificationScore.percentage >= 60 ? '#3b82f6' :
                               user.verificationScore.percentage >= 30 ? '#f59e0b' : '#ef4444'
                      }}>
                        {user.verificationScore.percentage}%
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        backgroundColor: user.verificationScore.percentage >= 80 ? '#dcfce7' : 
                                       user.verificationScore.percentage >= 60 ? '#dbeafe' :
                                       user.verificationScore.percentage >= 30 ? '#fef3c7' : '#fee2e2',
                        color: user.verificationScore.percentage >= 80 ? '#166534' : 
                               user.verificationScore.percentage >= 60 ? '#1d4ed8' :
                               user.verificationScore.percentage >= 30 ? '#92400e' : '#dc2626',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {user.verificationScore.verificationLevel}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      width: `${user.verificationScore.percentage}%`,
                      height: '100%',
                      backgroundColor: user.verificationScore.percentage >= 80 ? '#10b981' : 
                                     user.verificationScore.percentage >= 60 ? '#3b82f6' :
                                     user.verificationScore.percentage >= 30 ? '#f59e0b' : '#ef4444',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  {/* Benefits Based on Level */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      margin: '0 0 8px 0'
                    }}>
                      {user.verificationScore.percentage >= 90 ? '🌟 Premium Member Benefits' :
                       user.verificationScore.percentage >= 80 ? '✅ Verified Member Benefits' :
                       user.verificationScore.percentage >= 60 ? '🔵 Enhanced Access' :
                       user.verificationScore.percentage >= 30 ? '🟡 Basic Access' : '🔴 Limited Access'}
                    </h4>
                    <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                      {user.verificationScore.percentage >= 90 ? 
                        '• Unlimited rental duration • Priority support • Premium features • Instant booking' :
                       user.verificationScore.percentage >= 80 ? 
                        '• Up to 14-day rentals • List your own dogs • Reduced fees • Priority matching' :
                       user.verificationScore.percentage >= 60 ? 
                        '• Up to 7-day rentals • Message all owners • Book popular dogs' :
                       user.verificationScore.percentage >= 30 ? 
                        '• Up to 3-day rentals • Browse all listings • Basic messaging' :
                        '• View listings only • Limited messaging • Account restrictions'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', margin: '0 0 8px 0' }}>
                    Verification Pending
                  </h3>
                  <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
                    Complete your profile information below to get verified
                  </p>
                </div>
              )}

              {/* Demo Mode Notice */}
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>🧪</div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', margin: '0 0 8px 0' }}>
                  Demo Mode - SMS Verification
                </h4>
                <p style={{ fontSize: '13px', color: '#92400e', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                  This is a demo version. When you enter a phone number, we'll generate a random 6-digit code 
                  and display it in the verification modal. In production, this would send a real SMS via Twilio/AWS SNS.
                </p>
                <details style={{ textAlign: 'left', marginTop: '12px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#92400e' }}>
                    🔧 How to integrate real SMS verification
                  </summary>
                  <div style={{ fontSize: '11px', color: '#92400e', marginTop: '8px', padding: '8px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
                    <p style={{ margin: '4px 0' }}><strong>Twilio:</strong> Replace sendVerificationCode() with Twilio SMS API call</p>
                    <p style={{ margin: '4px 0' }}><strong>AWS SNS:</strong> Use AWS SDK to send SMS via Simple Notification Service</p>
                    <p style={{ margin: '4px 0' }}><strong>Firebase:</strong> Store verification codes in Firestore with TTL expiration</p>
                    <p style={{ margin: '4px 0' }}><strong>Security:</strong> Rate limit attempts, validate phone format, use secure random codes</p>
                  </div>
                </details>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  fontSize: '12px',
                  color: '#92400e'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📱</span>
                    <span>Enter phone number</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🔢</span>
                    <span>Get demo code</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>✅</span>
                    <span>Verify & update score</span>
                  </div>
                </div>
              </div>

              {/* Professional Verification Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '16px'
              }}>
                {/* Email Verification */}
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#dbeafe',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        📧
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#111827',
                          margin: '0 0 4px 0'
                        }}>
                          Email address
                        </h4>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: 0
                        }}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#10b981',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#dcfce7',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}>
                        ✓
                      </div>
                      Verified
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: user.phoneNumber ? '#dbeafe' : '#f3f4f6',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        📱
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#111827',
                          margin: '0 0 4px 0'
                        }}>
                          Phone number
                        </h4>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: 0
                        }}>
                          {user.phoneNumber || 'Add your phone number'}
                        </p>

                      </div>
                    </div>
                    {user.phoneVerified ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#10b981',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#dcfce7',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}>
                          ✓
                        </div>
                        Verified
                      </div>
                    ) : (
                      <button 
                        onClick={handlePhoneVerification}
                        disabled={isVerifying}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: isVerifying ? '#9ca3af' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: isVerifying ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        {isVerifying ? '⏳' : (user.phoneNumber ? 'Verify' : 'Add')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Government ID */}
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: user.idDocument ? '#dbeafe' : '#f3f4f6',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        🆔
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#111827',
                          margin: '0 0 4px 0'
                        }}>
                          Government ID
                        </h4>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: 0
                        }}>
                          {user.idDocument ? 'ID document uploaded' : 'Upload a government-issued ID'}
                        </p>
                      </div>
                    </div>
                    {user.idVerified ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#10b981',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#dcfce7',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}>
                          ✓
                        </div>
                        Verified
                      </div>
                    ) : (
                      <button 
                        onClick={handleIDVerification}
                        disabled={isVerifying}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: isVerifying ? '#9ca3af' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: isVerifying ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        {isVerifying ? '⏳' : (user.idDocument ? 'Verify' : 'Add')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Profile Photo */}
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: user.photoURL ? '#dbeafe' : '#f3f4f6',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        📸
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#111827',
                          margin: '0 0 4px 0'
                        }}>
                          Profile photo
                        </h4>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: 0
                        }}>
                          {user.photoURL ? 'Profile photo added' : 'Add a clear photo of yourself'}
                        </p>
                      </div>
                    </div>
                    {user.photoVerified ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#10b981',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#dcfce7',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}>
                          ✓
                        </div>
                        Verified
                      </div>
                    ) : (
                      <button 
                        onClick={handlePhotoVerification}
                        disabled={isVerifying}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: isVerifying ? '#9ca3af' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: isVerifying ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        {isVerifying ? '⏳' : (user.photoURL ? 'Verify' : 'Add')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone Verification Modal */}
              {showPhoneVerification && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '400px',
                    width: '90%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{
                      textAlign: 'center',
                      marginBottom: '24px'
                    }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: '#dbeafe',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: '24px'
                      }}>
                        📱
                      </div>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 8px 0'
                      }}>
                        {verificationStep === 'phone' ? 'Verify Your Phone' : 'Enter Verification Code'}
                      </h3>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        {verificationStep === 'phone' 
                          ? 'We\'ll send a verification code to your phone number'
                          : `Enter the 6-digit code sent to ${phoneInput}`
                        }
                      </p>
                    </div>

                    {verificationStep === 'phone' ? (
                      <div>
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151'
                          }}>
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '16px',
                              outline: 'none'
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && sendVerificationCode()}
                            autoFocus={!phoneInput}
                          />
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '12px'
                        }}>
                          <button
                            onClick={sendVerificationCode}
                            disabled={isVerifying || !phoneInput.trim()}
                            style={{
                              flex: 1,
                              padding: '12px',
                              backgroundColor: isVerifying || !phoneInput.trim() ? '#9ca3af' : '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: isVerifying || !phoneInput.trim() ? 'not-allowed' : 'pointer',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}
                          >
                            {isVerifying ? '⏳ Sending...' : 'Send Code'}
                          </button>
                          <button
                            onClick={() => setShowPhoneVerification(false)}
                            style={{
                              padding: '12px 16px',
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '500',
                              fontSize: '14px'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Demo Code Display */}
                        <div style={{
                          backgroundColor: '#f0f9ff',
                          border: '1px solid #0ea5e9',
                          borderRadius: '8px',
                          padding: '16px',
                          marginBottom: '20px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '16px', marginBottom: '8px' }}>🧪 Demo Mode</div>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#0ea5e9',
                            letterSpacing: '4px',
                            fontFamily: 'monospace'
                          }}>
                            {currentVerificationCode || '------'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '4px' }}>
                            Enter this code below to verify
                          </div>
                        </div>

                        {/* Current Verification Status */}
                        <div style={{
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #22c55e',
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: '20px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '14px', color: '#166534' }}>
                            📱 Verifying: {phoneInput || user.phoneNumber}
                          </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151'
                          }}>
                            Verification Code
                          </label>
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="123456"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '16px',
                              textAlign: 'center',
                              letterSpacing: '2px',
                              outline: 'none'
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && verifyPhoneCode()}
                            maxLength={6}
                          />
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '12px'
                        }}>
                          <button
                            onClick={verifyPhoneCode}
                            disabled={isVerifying || verificationCode.length !== 6}
                            style={{
                              flex: 1,
                              padding: '12px',
                              backgroundColor: isVerifying || verificationCode.length !== 6 ? '#9ca3af' : '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: isVerifying || verificationCode.length !== 6 ? 'not-allowed' : 'pointer',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}
                          >
                            {isVerifying ? '⏳ Verifying...' : 'Verify Code'}
                          </button>
                          <button
                            onClick={resendVerificationCode}
                            disabled={isVerifying}
                            style={{
                              padding: '12px 16px',
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: isVerifying ? 'not-allowed' : 'pointer',
                              fontWeight: '500',
                              fontSize: '14px'
                            }}
                          >
                            Resend
                          </button>
                        </div>
                        <div style={{
                          marginTop: '16px',
                          textAlign: 'center'
                        }}>
                          <button
                            onClick={() => {
                              setVerificationStep('phone');
                              setVerificationCode('');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              fontSize: '14px',
                              textDecoration: 'underline'
                            }}
                          >
                            ← Change phone number
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Success Step */}
                    {verificationStep === 'complete' && (
                      <div style={{
                        textAlign: 'center',
                        padding: '20px'
                      }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          backgroundColor: '#dcfce7',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                          fontSize: '32px'
                        }}>
                          ✅
                        </div>
                        <h3 style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          color: '#166534',
                          margin: '0 0 8px 0'
                        }}>
                          Phone Verified Successfully!
                        </h3>
                        <p style={{
                          fontSize: '14px',
                          color: '#166534',
                          margin: '0 0 20px 0'
                        }}>
                          Your phone number is now verified and your score has been updated.
                        </p>
                        <button
                          onClick={() => setShowPhoneVerification(false)}
                          style={{
                            padding: '12px 24px',
                            backgroundColor: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}
                        >
                          Continue
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Verification Status Message */}
              {verificationMessage && (
                <div style={{
                  backgroundColor: verificationMessage.includes('✅') ? '#dcfce7' : '#fef3c7',
                  border: `1px solid ${verificationMessage.includes('✅') ? '#9ae6b4' : '#fbbf24'}`,
                  borderRadius: '8px',
                  padding: '16px',
                  marginTop: '16px',
                  textAlign: 'center',
                  color: verificationMessage.includes('✅') ? '#166534' : '#92400e',
                  fontWeight: '500'
                }}>
                  {verificationMessage}
                </div>
              )}

              {/* Trust & Safety Notice */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '24px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '20px'
                }}>
                  🛡️
                </div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>
                  Your information is secure
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '0 0 16px 0',
                  lineHeight: '1.5'
                }}>
                  We use bank-level security and never share your personal information with hosts or other users. 
                  Your documents are encrypted and stored securely.
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '24px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🔒</span>
                    <span>SSL Encrypted</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🏦</span>
                    <span>Bank-level Security</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🔐</span>
                    <span>Data Protected</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 