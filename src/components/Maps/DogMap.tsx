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
  const [useFallback, setUseFallback] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapsService = useMapsService();

  // Check for API errors and switch to fallback immediately
  useEffect(() => {
    const checkForAPIErrors = () => {
      // Check if there are any Google Maps API errors in the console
      const hasAPIError = window.location.href.includes('api-not-activated-map-error') || 
                         document.querySelector('[data-api-error]') ||
                         error.includes('ApiNotActivatedMapError');
      
      if (hasAPIError || error.includes('ApiNotActivatedMapError')) {
        console.log('API error detected, switching to fallback mode');
        setUseFallback(true);
        setError('Google Maps API not available. Showing dogs in list format.');
        return true;
      }
      return false;
    };

    // Check immediately and also set up a listener for future errors
    if (checkForAPIErrors()) return;

    const errorListener = (event: ErrorEvent) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('ApiNotActivatedMapError') || 
           event.error.message.includes('Google Maps'))) {
        console.log('API error detected via error listener');
        setUseFallback(true);
        setError('Google Maps API not available. Showing dogs in list format.');
      }
    };

    window.addEventListener('error', errorListener);
    return () => window.removeEventListener('error', errorListener);
  }, [error]);

  // Simple map initialization
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current || mapInitialized || useFallback) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        console.log('Starting simple map initialization...');

        // Get center location
        let center: Location;
        if (userLocation) {
          center = userLocation;
          setCurrentLocation(userLocation);
        } else {
          try {
            center = await mapsService.getCurrentLocation();
            setCurrentLocation(center);
          } catch (error) {
            console.warn('Using default location');
            center = { lat: 40.7128, lng: -74.0060 }; // NYC
            setCurrentLocation(center);
          }
        }

        // Initialize map
        console.log('Initializing map with center:', center);
        await mapsService.initializeMap(mapContainerRef.current, center);
        
        if (isMounted) {
          setMapInitialized(true);
          console.log('Map initialized successfully');
        }

      } catch (error) {
        console.error('Error initializing map:', error);
        if (isMounted) {
          setError(`Google Maps API not available. Showing dogs in list format.`);
          setUseFallback(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(initMap, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [mapContainerRef.current, mapInitialized, userLocation, mapsService, useFallback]);

  // Update markers when dogs or filters change
  useEffect(() => {
    if (!mapInitialized || !currentLocation || useFallback) return;

    try {
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

      const filteredDogs = mapsService.filterDogsByLocation(dogLocations, currentLocation, filters);
      mapsService.addDogMarkers(filteredDogs, (dog) => {
        const originalDog = dogs.find(d => d.id === dog.dogId);
        if (originalDog && onDogClick) {
          onDogClick(originalDog);
        }
      });

      mapsService.fitBounds();
    } catch (error) {
      console.error('Error updating markers:', error);
      // If markers fail, switch to fallback
      setUseFallback(true);
      setError('Error displaying map markers. Showing dogs in list format.');
    }
  }, [dogs, filters, mapInitialized, currentLocation, mapsService, onDogClick, useFallback]);

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

  // Filter dogs for fallback display
  const getFilteredDogs = () => {
    if (!currentLocation) return dogs;

    return dogs.filter(dog => {
      // Check availability
      if (filters.availableOnly && !dog.isAvailable) return false;
      
      // Check price
      if (filters.maxPrice && dog.pricePerDay > filters.maxPrice) return false;
      
      // Check distance (simplified calculation)
      if (filters.maxDistance && dog.coordinates) {
        const distance = mapsService.calculateDistance(currentLocation, dog.coordinates);
        if (distance > filters.maxDistance) return false;
      }
      
      return true;
    });
  };

  const filteredDogs = getFilteredDogs();

  // If we should use fallback or there's an error, show the list view
  if (useFallback || error.includes('ApiNotActivatedMapError') || error.includes('Google Maps API not available')) {
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
            <span style={{ fontSize: '12px', color: '#666' }}>
              (Uses GPS coordinates for precise distance calculation)
            </span>
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

        {/* Fallback List View */}
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#f8f9fa' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Dogs Near You</h3>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
              {error || 'Google Maps API not available. Showing dogs in list format.'} Showing {filteredDogs.length} dog{filteredDogs.length !== 1 ? 's' : ''} found.
            </p>
          </div>
          
          {filteredDogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>No dogs found</div>
              <div style={{ fontSize: '14px' }}>Try adjusting your filters or location</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {filteredDogs.map((dog) => (
                <div
                  key={dog.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '15px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    border: '1px solid #eee'
                  }}
                  onClick={() => onDogClick?.(dog)}
                >
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <img
                      src={dog.imageUrl || 'https://via.placeholder.com/60x60?text=Dog'}
                      alt={dog.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{dog.name}</h4>
                      <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                        Breed: {dog.breed}
                      </p>
                      <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                        Owner: {dog.ownerName}
                      </p>
                      <p style={{ margin: '0', color: '#28a745', fontWeight: 'bold' }}>
                        ${dog.pricePerDay}/day
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    {onRentDog && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRentDog(dog);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Rent
                      </button>
                    )}
                    {onMessageOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMessageOwner(dog);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Message
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
          <span style={{ fontSize: '12px', color: '#666' }}>
            (Uses GPS coordinates for precise distance calculation)
          </span>
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
          backgroundColor: '#f8f9fa',
          position: 'relative',
          border: '1px solid #ddd'
        }}
      >
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', marginBottom: '10px' }}>Loading Map...</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Please wait while we initialize the map</div>
            </div>
          </div>
        )}
        {error && !useFallback && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxWidth: '300px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '10px', color: '#dc3545' }}>Map Error</div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>{error}</div>
            <button
              onClick={() => {
                setError('');
                setMapInitialized(false);
                setLoading(false);
                setUseFallback(false);
              }}
              style={{
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
        )}
        {!loading && !error && !mapInitialized && !useFallback && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '10px' }}>Initializing Map...</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Setting up Google Maps</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DogMap; 