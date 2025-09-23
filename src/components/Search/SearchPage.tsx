import React, { useState, useEffect, useCallback } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, getDocs } from 'firebase/firestore';
import AdvancedSearch, { type SearchFilters } from './AdvancedSearch';
import SearchResults from './SearchResults';
import FindDogsNearYou from '../Maps/FindDogsNearYou';

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

interface SearchPageProps {
  onDogSelect?: (dog: Dog) => void;
  onRentDog?: (dog: Dog) => void;
  onMessageOwner?: (dog: Dog) => void;
  onBack?: () => void;
  initialFilters?: SearchFilters;
}

const SearchPage: React.FC<SearchPageProps> = ({
  onDogSelect,
  onRentDog,
  onMessageOwner,
  onBack,
  initialFilters = {}
}) => {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { db } = useFirebase();

  // Load all dogs
  useEffect(() => {
    const loadDogs = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'dogs'));
        const allDogs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Dog[];
        
        setDogs(allDogs);
      } catch (error) {
        console.error('Error loading dogs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDogs();
  }, [db]);

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* Header */}
      <header className="modern-header fade-in">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {onBack && (
              <button
                onClick={onBack}
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
                ← Back to Dashboard
              </button>
            )}
            <a href="#" className="logo">
              DogRental
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content fade-in">
          {/* Hero Text */}
          <div className="hero-text">
            <h1 className="hero-title">
              Find Your Perfect Dog Companion
            </h1>
            <p className="hero-subtitle">
              Search, filter, and discover amazing dogs available for rent. Use advanced filters or explore on the map to find your ideal furry friend.
            </p>
            
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-number">{dogs.length}</div>
                <div className="hero-stat-label">Dogs Available</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">🔍</div>
                <div className="hero-stat-label">Smart Filters</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">🗺️</div>
                <div className="hero-stat-label">Map View</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              marginTop: '32px',
              flexWrap: 'wrap'
            }}>


              {/* View Mode Toggle */}
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: viewMode === 'list' ? '#FF6B35' : 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  📋 Search & Filter
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: viewMode === 'map' ? '#FF6B35' : 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  🗺️ Explore Map
                </button>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div style={{ width: '100%', maxWidth: '1200px' }}>


            {viewMode === 'list' ? (
              <>
                <AdvancedSearch
                  onFiltersChange={handleFiltersChange}
                  initialFilters={initialFilters}
                  showLocationFilter={true}
                />
                
                <SearchResults
                  dogs={dogs}
                  filters={filters}
                  onDogSelect={onDogSelect}
                  onRentDog={onRentDog}
                  onMessageOwner={onMessageOwner}
                  loading={loading}
                />
              </>
            ) : (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                height: '600px'
              }}>
                <FindDogsNearYou
                  dogs={dogs as any}
                  onRentDog={onRentDog || (() => {})}
                  onMessageOwner={onMessageOwner || (() => {})}
                  onBack={() => {}} // Don't show back button in embedded mode
                  currentUserId={''} // Will be handled by the parent component
                  embedded={true}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SearchPage;