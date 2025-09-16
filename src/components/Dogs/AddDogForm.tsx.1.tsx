import React, { useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import ImageUpload from '../Common/ImageUpload';
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
  imageUrl?: string;
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
    imageUrl: ''
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
        imageUrl: ''
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

  const handleImageUploaded = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl
    }));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* Modern Header */}
      <header className="modern-header fade-in">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#" className="logo">
              DogRental
            </a>
          </div>
        </div>
      </header>

      <div style={{
        background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("/images/image1.png")',
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
            🐕
          </div>
          <h2 style={{
            fontSize: '2.5rem',
            color: '#2d3748',
            margin: '0 0 10px 0',
            fontWeight: 'bold'
          }}>
            Add Your Dog
          </h2>
          <p style={{
            color: '#4a5568',
            fontSize: '1.1rem',
            margin: 0,
            lineHeight: '1.6'
          }}>
            Share your furry friend with the community and start earning
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
            <h3 style={{
              fontSize: '1.3rem',
              color: '#2d3748',
              margin: '0 0 15px 0',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              📸 Dog Photo
            </h3>
            <ImageUpload 
              onImageUploaded={handleImageUploaded}
              currentImageUrl={formData.imageUrl}
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
                  onFocus={(e) => e.target.style.borderColor = '#6A32B0'}
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
                  onFocus={(e) => e.target.style.borderColor = '#6A32B0'}
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
                  onFocus={(e) => e.target.style.borderColor = '#6A32B0'}
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
                  onFocus={(e) => e.target.style.borderColor = '#6A32B0'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="small">Small (under 20 lbs)</option>
                  <option value="medium">Medium (20-50 lbs)</option>
                  <option value="large">Large (over 50 lbs)</option>
                </select>
              </div>
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
              onFocus={(e) => e.target.style.borderColor = '#6A32B0'}
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
                  onFocus={(e) => e.target.style.borderColor = '#6A32B0'}
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
                  onFocus={(e) => e.target.style.borderColor = '#6A32B0'}
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
                className="btn-glass-primary"
                style={{
                  fontSize: '1rem',
                  padding: '12px 20px',
                  cursor: locationLoading ? 'not-allowed' : 'pointer'
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
                className="btn-glass-primary"
                style={{
                  fontSize: '1rem',
                  padding: '15px 30px',
                  minWidth: '120px'
                }}
              >
                ← Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-glass-primary"
              style={{
                fontSize: '1rem',
                padding: '15px 30px',
                minWidth: '120px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '🐕 Adding Dog...' : '✅ Add Dog'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default AddDogForm;
