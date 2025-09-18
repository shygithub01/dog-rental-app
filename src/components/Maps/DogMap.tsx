import React, { useState, useEffect, useCallback } from 'react';
import { useMapsService } from '../../services/mapsService';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore';
import type { DogLocation, Location, MapFilters } from '../../types/Location';
import type { Dog } from '../../types/Dog';

interface DogMapProps {
  dogs: Dog[];
  onDogClick?: (dog: Dog) => void;
  onRentDog?: (dog: Dog) => void;
  onMessageOwner?: (dog: Dog) => void;
  userLocation?: Location;
  currentUserId: string;
}

const DogMap: React.FC<DogMapProps> = ({
  dogs,
  onDogClick,
  onRentDog,
  onMessageOwner,
  userLocation,
  currentUserId
}) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [filters, setFilters] = useState<MapFilters>({
    maxDistance: 10,
    maxPrice: 100,
    availableOnly: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useMiles, setUseMiles] = useState(true); // Default to miles
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState<Set<string>>(new Set());
  const mapsService = useMapsService();
  const { db } = useFirebase();

  // Get current location on component mount - only run once
  useEffect(() => {
    let isMounted = true;
    
    const getLocation = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        let location: Location;
        
        if (userLocation) {
          location = userLocation;
        } else {
          try {
            location = await mapsService.getCurrentLocation();
          } catch (error) {
            console.warn('Using default location');
            location = { lat: 40.7128, lng: -74.0060 }; // NYC
          }
        }
        
        if (isMounted) {
          setCurrentLocation(location);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        if (isMounted) {
          setError('Could not get your current location. Using default location.');
          setCurrentLocation({ lat: 40.7128, lng: -74.0060 });
          setLoading(false);
        }
      }
    };

    getLocation();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once

  // Check which dogs are in user's favorites
  useEffect(() => {
    const checkFavorites = async () => {
      try {
        if (!currentUserId) return;
        
        const userRef = doc(db, 'users', currentUserId);
        const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', currentUserId)));
        
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          const favoriteDogIds = userData.favoriteDogs || [];
          setFavorites(new Set(favoriteDogIds));
        }
      } catch (error) {
        console.error('Error checking favorites:', error);
      }
    };

    checkFavorites();
  }, [db, currentUserId]);

  const toggleFavorite = async (dogId: string) => {
    try {
      console.log('🔍 DEBUG: Toggling favorite for dog:', dogId, 'user:', currentUserId);
      
      if (!currentUserId) return;
      
      setFavoritesLoading(prev => new Set(prev).add(dogId));
      
      const userRef = doc(db, 'users', currentUserId);
      const isFavorite = favorites.has(dogId);
      
      console.log('🔍 DEBUG: Current favorites state:', Array.from(favorites));
      console.log('🔍 DEBUG: Is favorite:', isFavorite);
      
      if (isFavorite) {
        // Remove from favorites
        console.log('🔍 DEBUG: Removing from favorites');
        await updateDoc(userRef, {
          favoriteDogs: arrayRemove(dogId)
        });
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(dogId);
          return newSet;
        });
        console.log('🔍 DEBUG: Removed from favorites');
      } else {
        // Add to favorites
        console.log('🔍 DEBUG: Adding to favorites');
        await updateDoc(userRef, {
          favoriteDogs: arrayUnion(dogId)
        });
        setFavorites(prev => new Set(prev).add(dogId));
        console.log('🔍 DEBUG: Added to favorites');
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
    } finally {
      setFavoritesLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(dogId);
        return newSet;
      });
    }
  };

  const handleFilterChange = useCallback((key: keyof MapFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleUseMyLocation = useCallback(async () => {
    try {
      setLoading(true);
      const location = await mapsService.getCurrentLocation();
      setCurrentLocation(location);
      setError('');
    } catch (error) {
      console.error('Error getting current location:', error);
      setError('Could not get your current location. Please check your browser settings.');
    } finally {
      setLoading(false);
    }
  }, [mapsService]);

  // Filter dogs for display
  const getFilteredDogs = useCallback(() => {
    if (!currentLocation) return dogs.filter(dog => dog.ownerId !== currentUserId);

    return dogs.filter(dog => {
      // Don't show user's own dogs
      if (dog.ownerId === currentUserId) return false;
      
      // Check availability
      if (filters.availableOnly && !dog.isAvailable) return false;
      
      // Check price
      if (filters.maxPrice && dog.pricePerDay > filters.maxPrice) return false;
      
      // Check distance (simplified calculation)
      if (filters.maxDistance && dog.coordinates) {
        const distance = useMiles 
          ? mapsService.calculateDistanceInMiles(currentLocation, dog.coordinates)
          : mapsService.calculateDistance(currentLocation, dog.coordinates);
        if (distance > filters.maxDistance) return false;
      }
      
      return true;
    });
  }, [dogs, currentLocation, filters, mapsService, useMiles, currentUserId]);

  const filteredDogs = getFilteredDogs();

  // Debug logging
  console.log('🔍 DEBUG DogMap:', {
    totalDogs: dogs.length,
    currentUserId: currentUserId,
    filteredDogsCount: filteredDogs.length,
    currentLocation: currentLocation,
    filters: filters,
    allDogs: dogs.map(dog => ({ 
      id: dog.id, 
      name: dog.name, 
      ownerId: dog.ownerId, 
      isAvailable: dog.isAvailable 
    }))
  });

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
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Getting your location</div>
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
            <option value={5}>{useMiles ? '5 miles' : '5 km'}</option>
            <option value={10}>{useMiles ? '10 miles' : '10 km'}</option>
            <option value={20}>{useMiles ? '20 miles' : '20 km'}</option>
            <option value={50}>{useMiles ? '50 miles' : '50 km'}</option>
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
          onClick={() => setUseMiles(!useMiles)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#6A32B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {useMiles ? '📏 Miles' : '📏 KM'}
        </button>

        <button
          onClick={handleUseMyLocation}
          style={{
            padding: '6px 12px',
            backgroundColor: '#6A32B0',
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

      {/* Dogs List View */}
      <div style={{ flex: 1, padding: '20px', backgroundColor: '#f8f9fa', overflow: 'auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Dogs Near You</h3>
          <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
            {error ? `${error} ` : ''}Showing {filteredDogs.length} dog{filteredDogs.length !== 1 ? 's' : ''} found.
            {currentLocation && (
              <span style={{ marginLeft: '10px', fontSize: '12px', color: '#888' }}>
                📍 Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </span>
            )}
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
                  border: '1px solid #eee',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
                onClick={() => onDogClick?.(dog)}
              >
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <img
                    src={dog.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNSAxNUg0NVY0NUgxNVYxNVoiIGZpbGw9IiNFRUVFRUUiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIyMCIgeT0iMjAiPgo8cGF0aCBkPSJNMTAgMTVMMTUgMTBMMTAgNVYxNVoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+Cg=='}
                    alt={dog.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNSAxNUg0NVY0NUgxNVYxNVoiIGZpbGw9IiNFRUVFRUUiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIyMCIgeT0iMjAiPgo8cGF0aCBkPSJNMTAgMTVMMTUgMTBMMTAgNVYxNVoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+Cg==';
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
                    {dog.coordinates && currentLocation && (
                      <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '12px' }}>
                        📍 {useMiles ? mapsService.calculateDistanceInMiles(currentLocation, dog.coordinates).toFixed(1) : mapsService.calculateDistance(currentLocation, dog.coordinates).toFixed(1)} {useMiles ? 'miles' : 'km'} away
                      </p>
                    )}
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
                        backgroundColor: '#6A32B0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#8A52D0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#6A32B0';
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
                        backgroundColor: '#6A32B0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#8A52D0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#6A32B0';
                      }}
                    >
                      Message
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(dog.id);
                    }}
                    disabled={favoritesLoading.has(dog.id)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: favorites.has(dog.id) ? '#e53e3e' : '#ed8936',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: favoritesLoading.has(dog.id) ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      transition: 'background-color 0.2s',
                      minWidth: '60px'
                    }}
                    onMouseEnter={(e) => {
                      if (!favoritesLoading.has(dog.id)) {
                        e.currentTarget.style.backgroundColor = favorites.has(dog.id) ? '#c53030' : '#dd6b20';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = favorites.has(dog.id) ? '#e53e3e' : '#ed8936';
                    }}
                    title={favorites.has(dog.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {favoritesLoading.has(dog.id) ? '⏳' : (favorites.has(dog.id) ? '❤️' : '🤍')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DogMap; 