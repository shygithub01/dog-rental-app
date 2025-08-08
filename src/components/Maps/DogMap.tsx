import React, { useState, useEffect, useRef } from 'react';
import { useMapsService } from '../../services/mapsService';
import type { DogLocation, Location, MapFilters } from '../../types/Location';
import type { Dog } from '../../types/Dog';

interface DogMapProps {
  dogs: Dog[];
  onDogClick?: (dog: Dog) => void;
  onRentDog?: (dog: Dog) => void;
  onMessageOwner?: (dog: Dog) => void;
  userLocation?: Location;
}

const DogMap: React.FC<DogMapProps> = ({
  dogs,
  onDogClick,
  onRentDog,
  onMessageOwner,
  userLocation
}) => {
  const [mapInitialized, setMapInitialized] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [filters, setFilters] = useState<MapFilters>({
    maxDistance: 10,
    maxPrice: 100,
    availableOnly: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapsService = useMapsService();

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainerRef.current || mapInitialized) return;

      try {
        setLoading(true);
        setError('');

        console.log('Starting map initialization...');

        // Get user's current location
        let center: Location;
        if (userLocation) {
          center = userLocation;
          setCurrentLocation(userLocation);
        } else {
          try {
            console.log('Getting current location...');
            center = await mapsService.getCurrentLocation();
            setCurrentLocation(center);
            console.log('Current location obtained:', center);
          } catch (error) {
            console.warn('Could not get current location, using default:', error);
            center = { lat: 40.7128, lng: -74.0060 }; // Default to NYC
          }
        }

        // Initialize map
        console.log('Initializing map with center:', center);
        if (mapContainerRef.current) {
          await mapsService.initializeMap(mapContainerRef.current, center);
          setMapInitialized(true);
          console.log('Map initialized successfully');
        } else {
          throw new Error('Map container ref not available');
        }

        // Add global functions for info window buttons
        (window as any).rentDog = (dogId: string) => {
          const dog = dogs.find(d => d.id === dogId);
          if (dog && onRentDog) {
            onRentDog(dog);
          }
        };

        (window as any).messageOwner = (dogId: string) => {
          const dog = dogs.find(d => d.id === dogId);
          if (dog && onMessageOwner) {
            onMessageOwner(dog);
          }
        };

      } catch (error) {
        console.error('Error initializing map:', error);
        setError(`Failed to load map: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    initializeMap();
  }, [mapInitialized, userLocation]);

  // Update markers when dogs or filters change
  useEffect(() => {
    if (!mapInitialized || !currentLocation) return;

    try {
      // Convert dogs to DogLocation format
      const dogLocations: DogLocation[] = dogs.map(dog => ({
        dogId: dog.id,
        dogName: dog.name,
        ownerName: dog.ownerName,
        location: dog.coordinates || { lat: 0, lng: 0 },
        price: dog.pricePerDay,
        breed: dog.breed,
        imageUrl: dog.imageUrl,
        available: dog.isAvailable
      }));

      // Filter dogs based on current filters
      const filteredDogs = mapsService.filterDogsByLocation(dogLocations, currentLocation, filters);

      // Add markers to map
      mapsService.addDogMarkers(filteredDogs, (dog) => {
        const originalDog = dogs.find(d => d.id === dog.dogId);
        if (originalDog && onDogClick) {
          onDogClick(originalDog);
        }
      });

      // Fit map to show all markers
      mapsService.fitBounds();

    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [dogs, filters, mapInitialized, currentLocation]);

  const handleFilterChange = (key: keyof MapFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUseMyLocation = async () => {
    try {
      setLoading(true);
      const location = await mapsService.getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting current location:', error);
      setError('Could not get your current location. Please check your browser settings.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading map...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Please wait while we initialize the map</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center', color: '#dc3545' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Map Error</div>
          <div style={{ fontSize: '14px' }}>{error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filters */}
      <div style={{
        padding: '15px',
        backgroundColor: 'white',
        borderBottom: '1px solid #eee',
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Max Distance:</label>
          <select
            value={filters.maxDistance || 10}
            onChange={(e) => handleFilterChange('maxDistance', Number(e.target.value))}
            style={{
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={50}>50 km</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Max Price:</label>
          <select
            value={filters.maxPrice || 100}
            onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
            style={{
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value={50}>$50/day</option>
            <option value={100}>$100/day</option>
            <option value={200}>$200/day</option>
            <option value={500}>$500/day</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(e) => handleFilterChange('availableOnly', e.target.checked)}
              style={{ marginRight: '4px' }}
            />
            Available Only
          </label>
        </div>

        <button
          onClick={handleUseMyLocation}
          style={{
            padding: '6px 12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📍 Use My Location
        </button>
      </div>

      {/* Map Container */}
      <div
        id="dog-map"
        ref={mapContainerRef}
        style={{
          flex: 1,
          minHeight: '400px',
          backgroundColor: '#f8f9fa'
        }}
      />
    </div>
  );
};

export default DogMap; 