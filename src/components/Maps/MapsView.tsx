import React, { useState } from 'react';
import DogMap from './DogMap';
import type { Dog } from '../../types/Dog';
import type { Location } from '../../types/Location';

interface MapsViewProps {
  dogs: Dog[];
  onRentDog: (dog: Dog) => void;
  onMessageOwner: (dog: Dog) => void;
  onBack: () => void;
  currentUserId: string;
}

const MapsView: React.FC<MapsViewProps> = ({
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

  return (
    <div style={{
      width: '1000px',
      maxWidth: '90%',
      height: '80vh',
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '24px', marginRight: '10px' }}>🗺️</span>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
            Find Dogs Near You
          </h2>
        </div>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Map Content */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Map */}
        <div style={{ flex: 1 }}>
          <DogMap
            dogs={dogs}
            onDogClick={handleDogClick}
            onRentDog={handleRentFromMap}
            onMessageOwner={handleMessageFromMap}
            userLocation={userLocation || undefined}
            currentUserId={currentUserId}
          />
        </div>

        {/* Selected Dog Info */}
        {selectedDog && (
          <div style={{
            width: '300px',
            borderLeft: '1px solid #eee',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
              {selectedDog.name}
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <img
                src={selectedDog.imageUrl || 'https://via.placeholder.com/200x150?text=Dog+Image'}
                alt={selectedDog.name}
                style={{
                  width: '100%',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <strong>Breed:</strong> {selectedDog.breed}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Age:</strong> {selectedDog.age} years
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Size:</strong> {selectedDog.size}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Price:</strong> ${selectedDog.pricePerDay}/day
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Location:</strong> {selectedDog.location}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Owner:</strong> {selectedDog.ownerName}
            </div>

            <div style={{ marginBottom: '10px' }}>
              <strong>Description:</strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                {selectedDog.description}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => onRentDog(selectedDog)}
                disabled={!selectedDog.isAvailable}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: selectedDog.isAvailable ? '#007bff' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedDog.isAvailable ? 'pointer' : 'not-allowed',
                  fontSize: '14px'
                }}
              >
                {selectedDog.isAvailable ? 'Rent Dog' : 'Not Available'}
              </button>
              <button
                onClick={() => onMessageOwner(selectedDog)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Message Owner
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapsView; 