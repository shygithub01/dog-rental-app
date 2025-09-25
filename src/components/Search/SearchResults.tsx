import React, { useState, useMemo, memo } from 'react';
import PhotoCarousel from '../Common/PhotoCarousel';
import type { SearchFilters } from './AdvancedSearch';
import { useIsMobile } from '../../hooks/useIsMobile';

interface Dog {
  id: string;
  name: string;
  breed: string;
  age: number;
  size: 'small' | 'medium' | 'large';
  description: string;
  pricePerDay: number;
  location: string;
  imageUrl?: string;
  imageUrls?: string[];
  temperament?: string[];
  goodWith?: string[];
  activityLevel?: string;
  specialNotes?: string;
  isAvailable: boolean;
  ownerId: string;
  ownerName: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface SearchResultsProps {
  dogs: Dog[];
  filters: SearchFilters;
  onDogSelect?: (dog: Dog) => void;
  onRentDog?: (dog: Dog) => void;
  onMessageOwner?: (dog: Dog) => void;
  loading?: boolean;
}

type SortOption = 'relevance' | 'price-low' | 'price-high' | 'distance' | 'newest';

const SearchResults: React.FC<SearchResultsProps> = ({
  dogs,
  filters,
  onDogSelect,
  onRentDog,
  onMessageOwner,
  loading = false
}) => {
  const isMobile = useIsMobile();
  const [sortBy, setSortBy] = useState<SortOption>('relevance');


  // Filter dogs based on search criteria
  const filteredDogs = useMemo(() => {
    return dogs.filter(dog => {
      // Availability filter
      if (filters.availability === 'available' && !dog.isAvailable) {
        return false;
      }

      // Breed filter
      if (filters.breed && !dog.breed.toLowerCase().includes(filters.breed.toLowerCase())) {
        return false;
      }

      // Size filter
      if (filters.size && dog.size !== filters.size) {
        return false;
      }

      // Activity level filter
      if (filters.activityLevel && dog.activityLevel !== filters.activityLevel) {
        return false;
      }

      // Price range filter
      if (filters.priceRange) {
        if (dog.pricePerDay < filters.priceRange.min || dog.pricePerDay > filters.priceRange.max) {
          return false;
        }
      }

      // Location filter (basic string matching for now)
      if (filters.location && !dog.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Temperament filter
      if (filters.temperament && filters.temperament.length > 0) {
        const dogTemperament = dog.temperament || [];
        const hasMatchingTemperament = filters.temperament.some(trait => 
          dogTemperament.includes(trait)
        );
        if (!hasMatchingTemperament) {
          return false;
        }
      }

      // Good with filter
      if (filters.goodWith && filters.goodWith.length > 0) {
        const dogGoodWith = dog.goodWith || [];
        const hasMatchingGoodWith = filters.goodWith.some(trait => 
          dogGoodWith.includes(trait)
        );
        if (!hasMatchingGoodWith) {
          return false;
        }
      }

      return true;
    });
  }, [dogs, filters]);

  // Sort filtered dogs
  const sortedDogs = useMemo(() => {
    const sorted = [...filteredDogs];
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.pricePerDay - b.pricePerDay);
      case 'price-high':
        return sorted.sort((a, b) => b.pricePerDay - a.pricePerDay);
      case 'newest':
        return sorted.reverse(); // Assuming newer dogs are added later
      case 'distance':
        // TODO: Implement distance sorting when user location is available
        return sorted;
      case 'relevance':
      default:
        // Sort by relevance (matching filters)
        return sorted.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;
          
          // Boost score for matching temperament
          if (filters.temperament && filters.temperament.length > 0) {
            const aMatches = (a.temperament || []).filter(t => filters.temperament!.includes(t)).length;
            const bMatches = (b.temperament || []).filter(t => filters.temperament!.includes(t)).length;
            scoreA += aMatches;
            scoreB += bMatches;
          }
          
          // Boost score for matching goodWith
          if (filters.goodWith && filters.goodWith.length > 0) {
            const aMatches = (a.goodWith || []).filter(t => filters.goodWith!.includes(t)).length;
            const bMatches = (b.goodWith || []).filter(t => filters.goodWith!.includes(t)).length;
            scoreA += aMatches;
            scoreB += bMatches;
          }
          
          return scoreB - scoreA;
        });
    }
  }, [filteredDogs, sortBy, filters]);

  const getActivityLevelEmoji = (level?: string) => {
    switch (level) {
      case 'Low': return '😴';
      case 'Medium': return '🚶';
      case 'High': return '🏃';
      default: return '🐕';
    }
  };

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'small': return 'Small (under 20 lbs)';
      case 'medium': return 'Medium (20-50 lbs)';
      case 'large': return 'Large (over 50 lbs)';
      default: return size;
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        fontSize: '1.125rem',
        color: '#6b7280'
      }}>
        🔍 Searching for dogs...
      </div>
    );
  }

  return (
    <div>
      {/* Results Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '16px 24px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: 0,
            marginBottom: '4px'
          }}>
            {sortedDogs.length} Dog{sortedDogs.length !== 1 ? 's' : ''} Found
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0
          }}>
            {filters.location && `Near ${filters.location} • `}
            Showing available dogs
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>


          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.875rem',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="relevance">Most Relevant</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="distance">Distance</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* No Results */}
      {sortedDogs.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔍</div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            No dogs found
          </h3>
          <p style={{
            fontSize: '1rem',
            color: '#6b7280',
            marginBottom: '24px'
          }}>
            Try adjusting your search filters to find more dogs.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#FF6B35',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Results Grid/List */}
      {sortedDogs.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile 
            ? '1fr' 
            : 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: isMobile ? '16px' : '24px'
        }}>
          {sortedDogs.map(dog => (
            <div
              key={dog.id}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => onDogSelect?.(dog)}
            >
              {/* Dog Image */}
              <div style={{ height: '200px', position: 'relative' }}>
                {dog.imageUrls && dog.imageUrls.length > 0 ? (
                  <PhotoCarousel 
                    images={dog.imageUrls} 
                    dogName={dog.name}
                    height="200px"
                  />
                ) : dog.imageUrl ? (
                  <img
                    src={dog.imageUrl}
                    alt={dog.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem'
                  }}>
                    🐕
                  </div>
                )}
                
                {/* Availability Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '4px 8px',
                  backgroundColor: dog.isAvailable ? '#10b981' : '#ef4444',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  borderRadius: '12px'
                }}>
                  {dog.isAvailable ? 'Available' : 'Unavailable'}
                </div>
              </div>

              {/* Dog Info */}
              <div style={{ padding: '20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      margin: 0,
                      marginBottom: '4px'
                    }}>
                      {dog.name}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {dog.breed} • {dog.age} year{dog.age !== 1 ? 's' : ''} old
                    </p>
                  </div>
                  <div style={{
                    textAlign: 'right'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#FF6B35'
                    }}>
                      ${dog.pricePerDay}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      per day
                    </div>
                  </div>
                </div>

                {/* Dog Details */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    color: '#374151'
                  }}>
                    📏 {getSizeLabel(dog.size)}
                  </span>
                  {dog.activityLevel && (
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      color: '#374151'
                    }}>
                      {getActivityLevelEmoji(dog.activityLevel)} {dog.activityLevel} Energy
                    </span>
                  )}
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    color: '#374151'
                  }}>
                    📍 {dog.location}
                  </span>
                </div>

                {/* Temperament Tags */}
                {dog.temperament && dog.temperament.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '12px'
                  }}>
                    {dog.temperament.slice(0, 3).map(trait => (
                      <span
                        key={trait}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: '#FF6B35',
                          color: 'white',
                          fontSize: '0.625rem',
                          fontWeight: '500',
                          borderRadius: '8px'
                        }}
                      >
                        {trait}
                      </span>
                    ))}
                    {dog.temperament.length > 3 && (
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: '#e5e7eb',
                        color: '#6b7280',
                        fontSize: '0.625rem',
                        borderRadius: '8px'
                      }}>
                        +{dog.temperament.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Description */}
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  lineHeight: '1.5',
                  margin: 0,
                  marginBottom: '16px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {dog.description}
                </p>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  {dog.isAvailable && onRentDog && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRentDog(dog);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        backgroundColor: '#FF6B35',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Rent Now
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
                        padding: '10px 16px',
                        backgroundColor: 'transparent',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        color: '#374151',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      💬 Message
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(SearchResults);