import React, { useState } from 'react';

export interface SearchFilters {
  breed?: string;
  size?: 'small' | 'medium' | 'large' | '';
  temperament?: string[];
  goodWith?: string[];
  activityLevel?: 'Low' | 'Medium' | 'High' | '';
  priceRange?: {
    min: number;
    max: number;
  };
  location?: string;
  radius?: number; // in miles
  availability?: 'available' | 'all';
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
  showLocationFilter?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ 
  onFiltersChange, 
  initialFilters = {},
  showLocationFilter = true 
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    breed: '',
    size: '',
    temperament: [],
    goodWith: [],
    activityLevel: '',
    priceRange: { min: 0, max: 500 },
    location: '',
    radius: 25,
    availability: 'available',
    ...initialFilters
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Common breed options
  const popularBreeds = [
    'Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'Bulldog',
    'Poodle', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund',
    'Siberian Husky', 'Boxer', 'Border Collie', 'Chihuahua', 'Shih Tzu'
  ];

  const temperamentOptions = [
    'Calm', 'Energetic', 'Playful', 'Gentle', 'Protective', 
    'Social', 'Independent', 'Cuddly'
  ];

  const goodWithOptions = [
    'Kids', 'Other Dogs', 'Cats', 'Strangers', 'Seniors'
  ];



  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleArrayFilterToggle = (key: 'temperament' | 'goodWith', value: string) => {
    const currentArray = filters[key] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    const newFilters = {
      ...filters,
      [key]: newArray
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      breed: '',
      size: '',
      temperament: [],
      goodWith: [],
      activityLevel: '',
      priceRange: { min: 0, max: 500 },
      location: '',
      radius: 25,
      availability: 'available'
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.breed) count++;
    if (filters.size) count++;
    if (filters.temperament && filters.temperament.length > 0) count++;
    if (filters.goodWith && filters.goodWith.length > 0) count++;
    if (filters.activityLevel) count++;
    if (filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max < 500)) count++;
    if (filters.location) count++;
    return count;
  };

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isExpanded ? '24px' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: 0
          }}>
            🔍 Find Your Perfect Dog
          </h3>
          {getActiveFilterCount() > 0 && (
            <span style={{
              backgroundColor: '#FF6B35',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: '600',
              padding: '4px 8px',
              borderRadius: '12px'
            }}>
              {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {getActiveFilterCount() > 0 && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                color: '#6b7280',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Clear All
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '8px 16px',
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
            {isExpanded ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {/* Quick Search Bar */}
      {!isExpanded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: showLocationFilter ? '1fr 1fr 1fr' : '1fr 1fr',
          gap: '12px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Search by breed..."
            value={filters.breed || ''}
            onChange={(e) => handleFilterChange('breed', e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              backgroundColor: 'white'
            }}
          />
          
          <select
            value={filters.size || ''}
            onChange={(e) => handleFilterChange('size', e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">Any Size</option>
            <option value="small">Small (under 20 lbs)</option>
            <option value="medium">Medium (20-50 lbs)</option>
            <option value="large">Large (over 50 lbs)</option>
          </select>

          {showLocationFilter && (
            <input
              type="text"
              placeholder="Enter location for radius search"
              value={filters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}
            />
          )}
        </div>
      )}

      {/* Expanded Filters */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Basic Filters Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            {/* Breed */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                🐕 Breed
              </label>
              <select
                value={filters.breed || ''}
                onChange={(e) => handleFilterChange('breed', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Any Breed</option>
                {popularBreeds.map(breed => (
                  <option key={breed} value={breed}>{breed}</option>
                ))}
              </select>
            </div>

            {/* Size */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                📏 Size
              </label>
              <select
                value={filters.size || ''}
                onChange={(e) => handleFilterChange('size', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Any Size</option>
                <option value="small">Small (under 20 lbs)</option>
                <option value="medium">Medium (20-50 lbs)</option>
                <option value="large">Large (over 50 lbs)</option>
              </select>
            </div>

            {/* Activity Level */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                ⚡ Activity Level
              </label>
              <select
                value={filters.activityLevel || ''}
                onChange={(e) => handleFilterChange('activityLevel', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Any Activity Level</option>
                <option value="Low">Low - Couch potato</option>
                <option value="Medium">Medium - Moderate walks</option>
                <option value="High">High - Lots of exercise</option>
              </select>
            </div>


          </div>

          {/* Price Range */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              💰 Price Range: ${filters.priceRange?.min} - ${filters.priceRange?.max} per day
            </label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <input
                type="range"
                min="0"
                max="500"
                value={filters.priceRange?.min || 0}
                onChange={(e) => handleFilterChange('priceRange', {
                  ...filters.priceRange,
                  min: parseInt(e.target.value)
                })}
                style={{ flex: 1 }}
              />
              <input
                type="range"
                min="0"
                max="500"
                value={filters.priceRange?.max || 500}
                onChange={(e) => handleFilterChange('priceRange', {
                  ...filters.priceRange,
                  max: parseInt(e.target.value)
                })}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {/* Temperament */}
          <div>
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
              {temperamentOptions.map(trait => (
                <button
                  key={trait}
                  type="button"
                  onClick={() => handleArrayFilterToggle('temperament', trait)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '2px solid',
                    borderColor: (filters.temperament || []).includes(trait) ? '#FF6B35' : '#d1d5db',
                    backgroundColor: (filters.temperament || []).includes(trait) ? '#FF6B35' : 'white',
                    color: (filters.temperament || []).includes(trait) ? 'white' : '#6b7280',
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
          <div>
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
              {goodWithOptions.map(trait => (
                <button
                  key={trait}
                  type="button"
                  onClick={() => handleArrayFilterToggle('goodWith', trait)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '2px solid',
                    borderColor: (filters.goodWith || []).includes(trait) ? '#2DD4BF' : '#d1d5db',
                    backgroundColor: (filters.goodWith || []).includes(trait) ? '#2DD4BF' : 'white',
                    color: (filters.goodWith || []).includes(trait) ? 'white' : '#6b7280',
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

          {/* Location & Search Radius */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: showLocationFilter ? '2fr 1fr' : '1fr',
            gap: '16px',
            alignItems: 'end'
          }}>
            {showLocationFilter && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  📍 Location
                </label>
                <input
                  type="text"
                  placeholder="Enter city, state, or zip code"
                  value={filters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    backgroundColor: 'white'
                  }}
                />
              </div>
            )}
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                📏 Search Radius: {filters.radius} miles
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>5mi</span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={filters.radius || 25}
                  onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>100mi</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;