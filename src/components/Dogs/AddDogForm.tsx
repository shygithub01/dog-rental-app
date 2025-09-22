import React, { useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import MultiImageUpload from '../Common/MultiImageUpload';
import type { Location } from '../../types/Location';

interface CreateDogData {
  name: string;
  breed: string;
  age: number;
  size: 'small' | 'medium' | 'large';
  description: string;
  pricePerDay: number;
  location: string;
  coordinates?: Location;
  imageUrl?: string; // Keep for backward compatibility
  imageUrls?: string[]; // New multiple images field
  // Personality fields
  temperament?: string[];
  goodWith?: string[];
  activityLevel?: string;
  specialNotes?: string;
}

interface AddDogFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddDogForm: React.FC<AddDogFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<CreateDogData>({
    name: '',
    breed: '',
    age: 1,
    size: 'medium',
    description: '',
    pricePerDay: 50,
    location: '',
    imageUrl: '',
    imageUrls: [],
    // Personality defaults
    temperament: [],
    goodWith: [],
    activityLevel: 'Medium',
    specialNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coordinates, setCoordinates] = useState<Location | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const { auth, db } = useFirebase();

  // Get current location for coordinates
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const location: Location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      setCoordinates(location);
      setError('');
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Could not get your current location. Please enter coordinates manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to add a dog');
      }

      // Validate coordinates
      if (!coordinates) {
        throw new Error('Please get your current location or enter coordinates manually');
      }

      console.log('Adding dog to database:', { ...formData, coordinates });
      console.log('User:', auth.currentUser.displayName || auth.currentUser.email);

      // Actually save to Firestore with coordinates
      await addDoc(collection(db, 'dogs'), {
        ...formData,
        coordinates, // Include coordinates
        ownerId: auth.currentUser.uid,
        ownerName: auth.currentUser.displayName || auth.currentUser.email || 'Unknown',
        isAvailable: true,
        status: 'available', // Add explicit status field
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log('Dog saved successfully with coordinates!');

      setFormData({
        name: '',
        breed: '',
        age: 1,
        size: 'medium',
        description: '',
        pricePerDay: 50,
        location: '',
        imageUrl: '',
        imageUrls: [],
        temperament: [],
        goodWith: [],
        activityLevel: 'Medium',
        specialNotes: ''
      });
      setCoordinates(null);

      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding dog:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'pricePerDay' ? Number(value) : value
    }));
  };

  const handleImagesUploaded = (imageUrls: string[]) => {
    setFormData(prev => ({
      ...prev,
      imageUrls,
      imageUrl: imageUrls[0] || '' // Set first image as primary for backward compatibility
    }));
  };

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
              Add your furry friend to our community
            </h1>
            <p className="hero-subtitle">
              Share your dog with trusted renters and start earning while creating happy memories for fellow dog lovers.
            </p>
            
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-number">📸</div>
                <div className="hero-stat-label">Upload photos</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">🐕</div>
                <div className="hero-stat-label">Dog details</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">💰</div>
                <div className="hero-stat-label">Set your price</div>
              </div>
            </div>
          </div>

          {/* Form Card - Same Style as Search Card in App.tsx */}
          <div className="search-card slide-up">
            <h3 className="search-title">
              List Your Dog
            </h3>
            <p className="search-subtitle">
              Fill out the details below to get started
            </p>

            <form onSubmit={handleSubmit} style={{ marginTop: '32px' }}>
              {/* Multi-Image Upload Section */}
              <div style={{ marginBottom: '32px' }}>
                <MultiImageUpload 
                  onImagesUploaded={handleImagesUploaded}
                  currentImages={formData.imageUrls}
                  maxImages={5}
                  label="Dog Photos"
                />
              </div>

              {/* Basic Information */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px', 
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Dog Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter dog's name"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s ease',
                      backgroundColor: 'white'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Breed *
                  </label>
                  <input
                    type="text"
                    name="breed"
                    value={formData.breed}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Golden Retriever"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s ease',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px', 
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Age (years) *
                  </label>
                  <input
                    type="number"
                    name="age"
                    min="1"
                    max="20"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s ease',
                      backgroundColor: 'white'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Size *
                  </label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s ease',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="small">Small (under 20 lbs)</option>
                    <option value="medium">Medium (20-50 lbs)</option>
                    <option value="large">Large (over 50 lbs)</option>
                  </select>
                </div>
              </div>

              {/* Personality & Traits Section */}
              <div style={{ 
                marginBottom: '32px',
                padding: '24px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '2px solid #e2e8f0'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🌟 Personality & Traits
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '20px'
                }}>
                  Help renters find the perfect match by describing your dog's personality!
                </p>

                {/* Temperament */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    🎭 Temperament
                  </label>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {['Calm', 'Energetic', 'Playful', 'Gentle', 'Protective', 'Social', 'Independent', 'Cuddly'].map((trait) => (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => {
                          const currentTraits = formData.temperament || [];
                          const newTraits = currentTraits.includes(trait)
                            ? currentTraits.filter(t => t !== trait)
                            : [...currentTraits, trait];
                          setFormData(prev => ({ ...prev, temperament: newTraits }));
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: '2px solid',
                          borderColor: (formData.temperament || []).includes(trait) ? '#FF6B35' : '#d1d5db',
                          backgroundColor: (formData.temperament || []).includes(trait) ? '#FF6B35' : 'white',
                          color: (formData.temperament || []).includes(trait) ? 'white' : '#6b7280',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {trait}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Good With */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    👨‍👩‍👧‍👦 Good With
                  </label>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {['Kids', 'Other Dogs', 'Cats', 'Strangers', 'Seniors'].map((trait) => (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => {
                          const currentTraits = formData.goodWith || [];
                          const newTraits = currentTraits.includes(trait)
                            ? currentTraits.filter(t => t !== trait)
                            : [...currentTraits, trait];
                          setFormData(prev => ({ ...prev, goodWith: newTraits }));
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: '2px solid',
                          borderColor: (formData.goodWith || []).includes(trait) ? '#2DD4BF' : '#d1d5db',
                          backgroundColor: (formData.goodWith || []).includes(trait) ? '#2DD4BF' : 'white',
                          color: (formData.goodWith || []).includes(trait) ? 'white' : '#6b7280',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {trait}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity Level */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    ⚡ Activity Level
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '8px'
                  }}>
                    {[
                      { level: 'Low', emoji: '😴', desc: 'Couch potato' },
                      { level: 'Medium', emoji: '🚶', desc: 'Moderate walks' },
                      { level: 'High', emoji: '🏃', desc: 'Needs lots of exercise' }
                    ].map(({ level, emoji, desc }) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, activityLevel: level }))}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '12px',
                          border: '2px solid',
                          borderColor: formData.activityLevel === level ? '#FDE047' : '#d1d5db',
                          backgroundColor: formData.activityLevel === level ? '#FDE047' : 'white',
                          color: formData.activityLevel === level ? '#92400e' : '#6b7280',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{emoji}</div>
                        <div style={{ fontWeight: '600' }}>{level}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special Notes */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    📝 Special Notes (Optional)
                  </label>
                  <textarea
                    name="specialNotes"
                    value={formData.specialNotes || ''}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Any special training, medical needs, or quirks renters should know about..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: 'white',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="General description of your dog..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: 'white',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Pricing & Location */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px', 
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Price per day ($) *
                  </label>
                  <input
                    type="number"
                    name="pricePerDay"
                    min="10"
                    max="500"
                    value={formData.pricePerDay}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s ease',
                      backgroundColor: 'white'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, State"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s ease',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>

              {/* GPS Coordinates */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  📍 GPS Coordinates (Required for Maps)
                </label>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="btn-glass-primary"
                    style={{
                      fontSize: '0.875rem',
                      padding: '10px 16px'
                    }}
                  >
                    {locationLoading ? '📍 Getting Location...' : '📍 Use My Current Location'}
                  </button>
                  
                  {coordinates && (
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '6px',
                      color: '#166534',
                      fontSize: '0.75rem'
                    }}>
                      ✅ Location set: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                    </div>
                  )}
                </div>
                
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#6b7280'
                }}>
                  <strong>Why GPS coordinates?</strong> This helps renters find dogs near them on the map. 
                  Your exact location is only used for distance calculations and won't be shared publicly.
                </div>
              </div>

              {error && (
                <div style={{
                  color: '#dc2626',
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  fontSize: '0.875rem'
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Action Buttons - Same style as App.tsx */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '12px', 
                marginTop: '24px'
              }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-glass-primary w-full mb-4"
                >
                  {loading ? '🐕 Adding Dog...' : '✅ Add Dog'}
                </button>
                
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="btn-glass-primary w-full mb-4"
                  >
                    ← Back to Dashboard
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AddDogForm;
