import React, { useState, useEffect } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import ImageUpload from '../Common/ImageUpload';
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
  imageUrl?: string;
  ownerId: string;
  ownerName: string;
  isAvailable: boolean;
  status?: 'available' | 'requested' | 'rented';
  createdAt: any;
  updatedAt: any;
}

interface EditDogFormProps {
  dog: Dog;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EditDogForm: React.FC<EditDogFormProps> = ({ dog, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: dog.name,
    breed: dog.breed,
    age: dog.age,
    size: dog.size,
    description: dog.description,
    pricePerDay: dog.pricePerDay,
    location: dog.location,
    imageUrl: dog.imageUrl || '',
    isAvailable: dog.isAvailable
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

  const handleImageUploaded = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl
    }));
  };

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
            <h3 style={{
              fontSize: '1.3rem',
              color: '#2d3748',
              margin: '0 0 15px 0',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              📸 Update Dog Photo
            </h3>
            <ImageUpload 
              onImageUploaded={handleImageUploaded}
              currentImageUrl={formData.imageUrl}
              label="Update Dog Photo"
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
                  onFocus={(e) => e.target.style.borderColor = '#4299e1'}
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
                  onFocus={(e) => e.target.style.borderColor = '#4299e1'}
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
                  onFocus={(e) => e.target.style.borderColor = '#4299e1'}
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
                  onFocus={(e) => e.target.style.borderColor = '#4299e1'}
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
              onFocus={(e) => e.target.style.borderColor = '#4299e1'}
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
                  onFocus={(e) => e.target.style.borderColor = '#4299e1'}
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
                  onFocus={(e) => e.target.style.borderColor = '#4299e1'}
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
                  backgroundColor: '#718096',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  minWidth: '120px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4a5568'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#718096'}
              >
                ← Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '15px 30px',
                backgroundColor: loading ? '#cbd5e0' : '#4299e1',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s',
                minWidth: '120px'
              }}
              onMouseOver={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#3182ce';
              }}
              onMouseOut={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#4299e1';
              }}
            >
              {loading ? '✏️ Updating...' : '✅ Update Dog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDogForm; 