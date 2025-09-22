import React, { useState } from 'react';
import DogMap from './DogMap';
import type { Dog } from '../../types/Dog';
import type { Location } from '../../types/Location';

interface FindDogsNearYouProps {
  dogs: Dog[];
  onRentDog: (dog: Dog) => void;
  onMessageOwner: (dog: Dog) => void;
  onBack: () => void;
  currentUserId: string;
}

const FindDogsNearYou: React.FC<FindDogsNearYouProps> = ({
  dogs,
  onRentDog,
  onMessageOwner,
  onBack,
  currentUserId
}) => {
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  const handleDogClick = (dog: Dog) => {
    setSelectedDog(dog);
  };

  const handleRentFromMap = (dog: Dog) => {
    onRentDog(dog);
  };

  const handleMessageFromMap = (dog: Dog) => {
    onMessageOwner(dog);
  };

  // Filter available dogs for stats - FIXED: Proper filtering logic
  const availableDogs = dogs.filter(dog => dog.isAvailable && dog.ownerId !== currentUserId);
  const nearbyDogs = availableDogs.slice(0, 6); // Show more dogs in the summary

  // Debug logging to understand the filtering issue
  console.log('🔍 DEBUG FindDogsNearYou:', {
    totalDogs: dogs.length,
    currentUserId: currentUserId,
    allDogs: dogs.map(dog => ({ 
      id: dog.id, 
      name: dog.name, 
      ownerId: dog.ownerId, 
      isAvailable: dog.isAvailable,
      ownerName: dog.ownerName 
    })),
    availableDogs: availableDogs.length,
    availableDogsDetails: availableDogs.map(dog => ({ 
      id: dog.id, 
      name: dog.name, 
      ownerId: dog.ownerId, 
      isAvailable: dog.isAvailable 
    }))
  });

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* Modern Header - Same as App.tsx */}
      <header className="modern-header fade-in">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#" className="logo">
              DogRental
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section - Matching App.tsx Pattern */}
      <section className="hero-section">
        <div className="hero-content fade-in">
          {/* Hero Text */}
          <div className="hero-text">
            <h1 className="hero-title">
              Find Dogs Near You
            </h1>
            <p className="hero-subtitle">
              Discover amazing dogs available for rent in your area. Use our interactive map to find the perfect furry companion for your next adventure.
            </p>
            
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-number">{availableDogs.length}</div>
                <div className="hero-stat-label">Available Dogs</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">🗺️</div>
                <div className="hero-stat-label">Interactive Map</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">📍</div>
                <div className="hero-stat-label">GPS Location</div>
              </div>
            </div>
          </div>

          {/* Main Content Card - Same Style as Search Card in App.tsx */}
          <div className="search-card slide-up" style={{ minHeight: '600px', maxWidth: '1200px' }}>
            <h3 className="search-title">
              🗺️ Interactive Dog Map
            </h3>
            <p className="search-subtitle">
              Click on dog markers to view details, or use the filters to find exactly what you're looking for
            </p>

            {/* Back to Dashboard Button */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={onBack}
                className="btn-glass-primary"
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem'
                }}
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* Map Content - Simplified and Clean */}
            <div style={{ marginTop: '32px' }}>
              {/* Map Container - Full Width */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                minHeight: '500px'
              }}>
                {/* Map Header - Fixed Count Issue */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '24px', marginRight: '10px' }}>🗺️</span>
                    <h4 style={{
                      margin: 0,
                      fontSize: '1.25rem',
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>
                      Dogs Near You
                    </h4>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)'
                  }}>
                    {availableDogs.length} Available
                  </div>
                </div>

                {/* Map - Centered and Properly Sized */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <div style={{ 
                    width: '100%', 
                    maxWidth: '800px', 
                    height: '400px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}>
                    <DogMap
                      dogs={dogs}
                      onDogClick={handleDogClick}
                      onRentDog={handleRentFromMap}
                      onMessageOwner={handleMessageFromMap}
                      userLocation={userLocation || undefined}
                      currentUserId={currentUserId}
                    />
                  </div>
                </div>

                {/* Selected Dog Info - Below Map */}
                {selectedDog && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginTop: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '20px'
                    }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '1.5rem',
                        color: '#1f2937',
                        fontWeight: '600'
                      }}>
                        🐕 {selectedDog.name}
                      </h4>
                      <button
                        onClick={() => setSelectedDog(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          color: '#6b7280',
                          padding: '4px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '300px 1fr', 
                      gap: '24px',
                      alignItems: 'start'
                    }}>
                      {/* Dog Image */}
                      <div>
                        <img
                          src={selectedDog.imageUrl || 'https://via.placeholder.com/300x200?text=Dog+Image'}
                          alt={selectedDog.name}
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </div>

                      {/* Dog Details */}
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                          <div>
                            <span style={{ fontWeight: '600', color: '#374151', display: 'block' }}>Breed:</span>
                            <span style={{ color: '#6b7280' }}>{selectedDog.breed}</span>
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', color: '#374151', display: 'block' }}>Age:</span>
                            <span style={{ color: '#6b7280' }}>{selectedDog.age} years</span>
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', color: '#374151', display: 'block' }}>Size:</span>
                            <span style={{ color: '#6b7280' }}>{selectedDog.size}</span>
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', color: '#374151', display: 'block' }}>Price:</span>
                            <span style={{ color: '#059669', fontWeight: 'bold' }}>
                              ${selectedDog.pricePerDay}/day
                            </span>
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', color: '#374151', display: 'block' }}>Location:</span>
                            <span style={{ color: '#6b7280' }}>{selectedDog.location}</span>
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', color: '#374151', display: 'block' }}>Owner:</span>
                            <span style={{ color: '#6b7280' }}>{selectedDog.ownerName}</span>
                          </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <span style={{ fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>
                            Description:
                          </span>
                          <p style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            color: '#6b7280',
                            lineHeight: '1.5',
                            background: 'rgba(249, 250, 251, 0.8)',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(229, 231, 235, 0.5)'
                          }}>
                            {selectedDog.description}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => onRentDog(selectedDog)}
                            disabled={!selectedDog.isAvailable}
                            className="btn-glass-primary"
                            style={{
                              padding: '12px 24px',
                              fontSize: '1rem',
                              opacity: selectedDog.isAvailable ? 1 : 0.6,
                              cursor: selectedDog.isAvailable ? 'pointer' : 'not-allowed'
                            }}
                          >
                            {selectedDog.isAvailable ? '✅ Rent Dog' : '❌ Not Available'}
                          </button>
                          <button
                            onClick={() => onMessageOwner(selectedDog)}
                            className="btn-glass-primary"
                            style={{
                              padding: '12px 24px',
                              fontSize: '1rem',
                              backgroundColor: 'rgba(16, 185, 129, 0.9)',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            💬 Message Owner
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Available Dogs Grid - Only show if there are dogs */}
                {availableDogs.length > 0 && (
                  <div style={{
                    marginTop: '24px',
                    padding: '20px',
                    background: 'rgba(249, 250, 251, 0.8)',
                    borderRadius: '12px',
                    border: '1px solid rgba(229, 231, 235, 0.5)'
                  }}>
                    <h5 style={{
                      margin: '0 0 16px 0',
                      fontSize: '1.1rem',
                      color: '#1f2937',
                      fontWeight: '600'
                    }}>
                      🐕 All Available Dogs ({availableDogs.length} found)
                    </h5>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '16px'
                    }}>
                      {availableDogs.map((dog) => (
                        <div
                          key={dog.id}
                          onClick={() => setSelectedDog(dog)}
                          style={{
                            background: 'white',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(229, 231, 235, 0.5)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                            <img
                              src={dog.imageUrl || 'https://via.placeholder.com/50x50?text=🐕'}
                              alt={dog.name}
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '50%',
                                marginRight: '12px'
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                {dog.name}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {dog.breed}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: '1rem', color: '#059669', fontWeight: 'bold', textAlign: 'center' }}>
                            ${dog.pricePerDay}/day
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FindDogsNearYou;
