import React, { useState, useEffect, useCallback } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, getDocs } from 'firebase/firestore';
import AdvancedSearch, { type SearchFilters } from './AdvancedSearch';
import SearchResults from './SearchResults';
import FindDogsNearYou from '../Maps/FindDogsNearYou';
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
  const isMobile = useIsMobile(768);
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
                  padding: isMobile ? '10px 16px' : '12px 24px',
                  backgroundColor: '#FF6B35',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)',
                  minHeight: isMobile ? '44px' : 'auto', // Touch-friendly on mobile
                  minWidth: isMobile ? '44px' : 'auto'
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

      {/* Compact Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(45, 212, 191, 0.05) 25%, rgba(253, 224, 71, 0.05) 50%, rgba(132, 204, 22, 0.05) 75%, rgba(255, 142, 83, 0.05) 100%), radial-gradient(circle at 20% 20%, rgba(255, 107, 53, 0.1) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(45, 212, 191, 0.1) 0%, transparent 40%), var(--surface-light)',
        padding: isMobile ? '60px 20px 40px' : '80px 40px 60px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: isMobile ? '2.5rem' : '3.5rem',
            fontWeight: '800',
            lineHeight: '1.1',
            marginBottom: '1rem',
            letterSpacing: '-0.025em',
            color: '#1f2937',
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8E53 50%, #2DD4BF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Find Your Perfect Dog Companion
          </h1>
          <p style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            color: '#6b7280',
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem auto',
            lineHeight: '1.6'
          }}>
            Search, filter, and discover amazing dogs available for rent
          </p>
          
          {/* Stats Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? '16px' : '32px',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: isMobile ? '12px 16px' : '16px 24px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 107, 53, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800', color: '#FF6B35', marginBottom: '4px' }}>
                {dogs.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>
                Dogs Available
              </div>
            </div>
            
            <div style={{
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: isMobile ? '12px 16px' : '16px 24px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 107, 53, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800', color: '#FF6B35', marginBottom: '4px' }}>
                🔍
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>
                Smart Filters
              </div>
            </div>
            
            <div style={{
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: isMobile ? '12px 16px' : '16px 24px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 107, 53, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800', color: '#FF6B35', marginBottom: '4px' }}>
                🗺️
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>
                Map View
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? '8px' : '12px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: isMobile ? '12px 20px' : '14px 28px',
                backgroundColor: viewMode === 'list' ? '#FF6B35' : 'rgba(255, 255, 255, 0.9)',
                color: viewMode === 'list' ? 'white' : '#6b7280',
                border: viewMode === 'list' ? '2px solid #FF6B35' : '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: isMobile ? '140px' : '160px'
              }}
            >
              📋 Search & Filter
            </button>
            <button
              onClick={() => setViewMode('map')}
              style={{
                padding: isMobile ? '12px 20px' : '14px 28px',
                backgroundColor: viewMode === 'map' ? '#FF6B35' : 'rgba(255, 255, 255, 0.9)',
                color: viewMode === 'map' ? 'white' : '#6b7280',
                border: viewMode === 'map' ? '2px solid #FF6B35' : '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: isMobile ? '140px' : '160px'
              }}
            >
              🗺️ Explore Map
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section style={{
        background: '#fafaf9',
        minHeight: '100vh',
        padding: isMobile ? '20px' : '40px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {viewMode === 'list' ? (
            <>
              {/* Search Filters at Top */}
              <div style={{ marginBottom: '32px' }}>
                <AdvancedSearch
                  onFiltersChange={handleFiltersChange}
                  initialFilters={initialFilters}
                  showLocationFilter={true}
                />
              </div>
              
              {/* Search Results Below */}
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
                onBack={() => {}}
                currentUserId={''}
                embedded={true}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SearchPage;