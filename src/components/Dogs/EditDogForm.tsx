import React, { useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import MultiImageUpload from '../Common/MultiImageUpload';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { Location } from '../../types/Location';

interface Dog {
  id: string;
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
  ownerId: string;
  ownerName: string;
  isAvailable: boolean;
  status?: 'available' | 'requested' | 'rented';
  createdAt: any;
  updatedAt: any;
  // Personality fields
  temperament?: string[];
  goodWith?: string[];
  activityLevel?: string;
  specialNotes?: string;
}

interface EditDogFormProps {
  dog: Dog;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EditDogForm: React.FC<EditDogFormProps> = ({ dog, onSuccess, onCancel }) => {
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
    name: dog.name,
    breed: dog.breed,
    age: dog.age,
    size: dog.size,
    description: dog.description,
    pricePerDay: dog.pricePerDay,
    location: dog.location,
    imageUrl: dog.imageUrl || '',
    imageUrls: dog.imageUrls || (dog.imageUrl ? [dog.imageUrl] : []),
    isAvailable: dog.isAvailable,
    // Personality fields
    temperament: dog.temperament || [],
    goodWith: dog.goodWith || [],
    activityLevel: dog.activityLevel || 'Medium',
    specialNotes: dog.specialNotes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coordinates, setCoordinates] = useState<Location | null>(dog.coordinates || null);
  const [locationLoading, setLocationLoading] = useState(false);

  const { db } = useFirebase();

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
      setError('Could not get your current location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if dog has pending requests or is rented
      if (dog.status === 'requested' || dog.status === 'rented' || !dog.isAvailable) {
        throw new Error('Cannot edit dog while it has pending requests or is currently rented. Please wait until the rental period ends.');
      }

      console.log('Updating dog in database:', { ...formData, coordinates });

      await updateDoc(doc(db, 'dogs', dog.id), {
        ...formData,
        coordinates, // Include coordinates in update
        updatedAt: Timestamp.now()
      });

      console.log('Dog updated successfully with coordinates!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating dog:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               name === 'age' || name === 'pricePerDay' ? Number(value) : value
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
            {onCancel && (
              <button
                onClick={onCancel}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#FF6B35',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF8E53';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF6B35';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isMobile ? '←' : '← Back to Dashboard'}
              </button>
            )}
            <a href="#" className="logo">
              DogRental
            </a>
          </div>
        </div>
      </header>

      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(45, 212, 191, 0.1) 25%, rgba(253, 224, 71, 0.1) 50%, rgba(132, 204, 22, 0.1) 75%, rgba(255, 142, 83, 0.1) 100%), radial-gradient(circle at 20% 20%, rgba(255, 107, 53, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(45, 212, 191, 0.15) 0%, transparent 50%), radial-gradient(circle at 40% 60%, rgba(253, 224, 71, 0.1) 0%, transparent 30%), radial-gradient(circle at 70% 30%, rgba(132, 204, 22, 0.1) 0%, transparent 30%), #FAFAF9',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: 'calc(100vh - 80px)',
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
          margin: '0 auto'
        }}>
        {/* Form Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          paddingBottom: '20px',
          borderBottom: '2px solid #f7fafc'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '15px'
          }}>
            ✏️
          </div>
          <h2 style={{
            fontSize: '2.5rem',
            color: '#2d3748',
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }}>
            Edit {dog.name}
          </h2>
          <p style={{
            color: '#4a5568',
            fontSize: '1.1rem',
            margin: 0,
            lineHeight: '1.6'
          }}>
            Update your dog's information and photos
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Image Upload Section */}
          <div style={{
            marginBottom: '30px',
            padding: '25px',
            backgroundColor: '#f7fafc',
            borderRadius: '15px',
            border: '2px dashed #e2e8f0'
          }}>
            <MultiImageUpload 
              onImagesUploaded={handleImagesUploaded}
              currentImages={formData.imageUrls}
              maxImages={5}
              label="Update Dog Photos"
            />
          </div>

          {/* Dog Information */}
          <div style={{
            marginBottom: '30px'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              color: '#2d3748',
              margin: '0 0 20px 0',
              fontWeight: 'bold'
            }}>
              🐾 Basic Information
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px', 
              marginBottom: '20px'
            }} className="mobile-form-grid">
              <div>
                <label htmlFor="name" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#2d3748',
                  fontSize: '1rem'
                }}>
                  Dog Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your dog's name"
                  style={{ 
                    width: '100%', 
                    padding: '15px', 
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6B35'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div>
                <label htmlFor="breed" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#2d3748',
                  fontSize: '1rem'
                }}>
                  Breed *
                </label>
                <input
                  type="text"
                  id="breed"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Golden Retriever"
                  style={{ 
                    width: '100%', 
                    padding: '15px', 
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6B35'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px', 
              marginBottom: '20px'
            }} className="mobile-form-grid">
              <div>
                <label htmlFor="age" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#2d3748',
                  fontSize: '1rem'
                }}>
                  Age (years) *
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  min="1"
                  max="20"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '15px', 
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6B35'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div>
                <label htmlFor="size" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#2d3748',
                  fontSize: '1rem'
                }}>
                  Size *
                </label>
                <select
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '15px', 
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6B35'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="small">Small (under 20 lbs)</option>
                  <option value="medium">Medium (20-50 lbs)</option>
                  <option value="large">Large (over 50 lbs)</option>
                </select>
              </div>
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
          <div style={{
            marginBottom: '30px'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              color: '#2d3748',
              margin: '0 0 20px 0',
              fontWeight: 'bold'
            }}>
              📝 Description
            </h3>
            <label htmlFor="description" style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#2d3748',
              fontSize: '1rem'
            }}>
              Tell us about your dog *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Describe your dog's personality, training, special needs, etc."
              style={{ 
                width: '100%', 
                padding: '15px', 
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '1rem',
                transition: 'all 0.2s',
                backgroundColor: 'white',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#FF6B35'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Pricing & Location */}
          <div style={{
            marginBottom: '30px'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              color: '#2d3748',
              margin: '0 0 20px 0',
              fontWeight: 'bold'
            }}>
              💰 Pricing & Location
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px'
            }} className="mobile-form-grid">
              <div>
                <label htmlFor="pricePerDay" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#2d3748',
                  fontSize: '1rem'
                }}>
                  Price per day ($) *
                </label>
                <input
                  type="number"
                  id="pricePerDay"
                  name="pricePerDay"
                  min="10"
                  max="500"
                  value={formData.pricePerDay}
                  onChange={handleChange}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '15px', 
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6B35'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div>
                <label htmlFor="location" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#2d3748',
                  fontSize: '1rem'
                }}>
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '15px', 
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6B35'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
          </div>

          {/* GPS Coordinates */}
          <div style={{
            marginBottom: '30px'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              color: '#2d3748',
              margin: '0 0 20px 0',
              fontWeight: 'bold'
            }}>
              📍 GPS Coordinates (Required for Maps)
            </h3>
            
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={locationLoading}
                style={{
                  padding: '12px 20px',
                  backgroundColor: locationLoading ? '#cbd5e0' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: locationLoading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                {locationLoading ? '📍 Getting Location...' : '📍 Use My Current Location'}
              </button>
              
              {coordinates && (
                <div style={{
                  padding: '10px 15px',
                  backgroundColor: '#f0fff4',
                  border: '2px solid #68d391',
                  borderRadius: '8px',
                  color: '#22543d',
                  fontSize: '0.9rem'
                }}>
                  ✅ Location set: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </div>
              )}
            </div>
            
            <div style={{
              padding: '15px',
              backgroundColor: '#f7fafc',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#4a5568'
            }}>
              <strong>Why GPS coordinates?</strong> This helps renters find dogs near them on the map. 
              Your exact location is only used for distance calculations and won't be shared publicly.
            </div>
          </div>

          {/* Availability */}
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f7fafc',
            borderRadius: '15px',
            border: '2px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '1.3rem',
              color: '#2d3748',
              margin: '0 0 20px 0',
              fontWeight: 'bold'
            }}>
              ✅ Availability
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <input
                type="checkbox"
                id="isAvailable"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer'
                }}
              />
              <label htmlFor="isAvailable" style={{
                fontSize: '1rem',
                color: '#2d3748',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                Make this dog available for rent
              </label>
            </div>
            <p style={{
              color: '#4a5568',
              fontSize: '0.9rem',
              margin: '10px 0 0 0',
              lineHeight: '1.5'
            }}>
              Uncheck this if you want to temporarily remove your dog from the rental listings
            </p>
          </div>

          {error && (
            <div style={{
              color: '#e53e3e',
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#fed7d7',
              borderRadius: '10px',
              border: '1px solid #feb2b2',
              fontSize: '0.95rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            justifyContent: 'center',
            marginTop: '30px'
          }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '15px 30px',
                  backgroundColor: '#FF6B35',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  minWidth: '120px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FF8E53'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF6B35'}
              >
                ← Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '16px 24px',
                backgroundColor: loading ? '#9ca3af' : '#FF6B35',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '1.1rem',
                transition: 'all 0.2s ease',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(255, 107, 53, 0.3)'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#FF8E53';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#FF6B35';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? '✏️ Updating...' : '✅ Update Dog'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default EditDogForm; 