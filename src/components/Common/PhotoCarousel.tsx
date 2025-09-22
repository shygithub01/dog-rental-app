import React, { useState } from 'react';

interface PhotoCarouselProps {
  images: string[];
  dogName: string;
  height?: string;
  showCounter?: boolean;
  showDots?: boolean;
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ 
  images, 
  dogName, 
  height = '200px',
  showCounter = true,
  showDots = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});

  if (!images || images.length === 0) {
    return (
      <div style={{
        width: '100%',
        height,
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        color: '#6b7280'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🐕</div>
          <div style={{ fontSize: '0.875rem' }}>No photos available</div>
        </div>
      </div>
    );
  }

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(index);
  };

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height,
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#f3f4f6'
    }}>
      {/* Main Image */}
      {!imageError[currentIndex] ? (
        <img
          src={images[currentIndex]}
          alt={`${dogName} photo ${currentIndex + 1}`}
          onError={() => handleImageError(currentIndex)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.3s ease'
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
          color: '#6b7280'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🐕</div>
            <div style={{ fontSize: '0.875rem' }}>Photo unavailable</div>
          </div>
        </div>
      )}

      {/* Navigation Arrows (only show if multiple images) */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              zIndex: 2
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
          >
            ‹
          </button>

          <button
            onClick={nextImage}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              zIndex: 2
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
          >
            ›
          </button>
        </>
      )}

      {/* Photo Counter */}
      {showCounter && images.length > 1 && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>
          {currentIndex + 1}/{images.length}
        </div>
      )}

      {/* Dots Navigation */}
      {showDots && images.length > 1 && images.length <= 5 && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '6px'
        }}>
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToImage(index, e)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: index === currentIndex ? '#FF6B35' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>
      )}

      {/* Touch/Swipe Support for Mobile */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          cursor: images.length > 1 ? 'pointer' : 'default'
        }}
        onClick={images.length > 1 ? nextImage : undefined}
      />
    </div>
  );
};

export default PhotoCarousel;