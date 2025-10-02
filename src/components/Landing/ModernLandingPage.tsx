import React from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';

interface ModernLandingPageProps {
  onGetStarted: () => void;
}

const ModernLandingPage: React.FC<ModernLandingPageProps> = ({ onGetStarted }) => {
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* Navigation */}
      <nav style={{
        padding: isMobile ? '20px' : '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Logo */}
        <div style={{
          fontSize: isMobile ? '1.5rem' : '1.75rem',
          fontWeight: '800',
          color: '#FF6B35',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🐕 DogRental
        </div>

        {/* Navigation Links */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            gap: '32px',
            alignItems: 'center'
          }}>
            <a href="#how-it-works" style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.2s ease'
            }}>
              How it works
            </a>
            <a href="#testimonials" style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.2s ease'
            }}>
              Testimonials
            </a>
            <a href="#safety" style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.2s ease'
            }}>
              Safety
            </a>
            <a href="#faq" style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.2s ease'
            }}>
              FAQ
            </a>
          </div>
        )}

        {/* Get Started Button */}
        <button
          onClick={onGetStarted}
          style={{
            padding: isMobile ? '12px 20px' : '14px 28px',
            backgroundColor: '#FF6B35',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 14px rgba(255, 107, 53, 0.3)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#FF8E53';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#FF6B35';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(255, 107, 53, 0.3)';
          }}
        >
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: isMobile ? '80px 20px' : '120px 48px',
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Main Headline */}
        <h1 style={{
          fontSize: isMobile ? '2.5rem' : '4rem',
          fontWeight: '800',
          lineHeight: '1.1',
          color: '#1f2937',
          marginBottom: '24px',
          letterSpacing: '-0.02em'
        }}>
          Find and rent your perfect{' '}
          <span style={{
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            furry companion
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          color: '#6b7280',
          lineHeight: '1.6',
          maxWidth: '600px',
          margin: '0 auto 40px auto'
        }}>
          Discover trusted dog owners in your area. Perfect for walks, companionship, 
          and adventures. Available now on web.
        </p>

        {/* CTA Button */}
        <button
          onClick={onGetStarted}
          style={{
            padding: isMobile ? '16px 32px' : '20px 40px',
            backgroundColor: '#FF6B35',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: isMobile ? '1.1rem' : '1.2rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 32px rgba(255, 107, 53, 0.3)',
            marginBottom: '60px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#FF8E53';
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 107, 53, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#FF6B35';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 107, 53, 0.3)';
          }}
        >
          Get Started
        </button>

        {/* Hero Image Placeholder */}
        <div style={{
          width: '100%',
          height: isMobile ? '300px' : '400px',
          backgroundColor: '#f8f9fa',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #e5e7eb',
          marginTop: '40px'
        }}>
          <div style={{
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🐕‍🦺</div>
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>
              Happy dogs with their temporary families
            </p>
            <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
              Professional photo coming soon
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{
        padding: isMobile ? '80px 20px' : '120px 48px',
        backgroundColor: '#fafaf9',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '800',
            color: '#1f2937',
            marginBottom: '16px'
          }}>
            How it works
          </h2>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.2rem',
            color: '#6b7280',
            marginBottom: '60px',
            maxWidth: '600px',
            margin: '0 auto 60px auto'
          }}>
            Three simple steps to find your perfect furry companion
          </p>

          {/* Steps */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '40px' : '60px'
          }}>
            {/* Step 1 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#FF6B35',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto',
                fontSize: '2rem'
              }}>
                🔍
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '12px'
              }}>
                Browse & Search
              </h3>
              <p style={{
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                Find verified dog owners in your area. Filter by breed, size, and availability.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#FF6B35',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto',
                fontSize: '2rem'
              }}>
                📅
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '12px'
              }}>
                Book & Connect
              </h3>
              <p style={{
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                Send a request with your preferred dates. Chat with owners to plan the perfect experience.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#FF6B35',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto',
                fontSize: '2rem'
              }}>
                ❤️
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '12px'
              }}>
                Enjoy & Review
              </h3>
              <p style={{
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                Spend quality time with your furry friend. Leave reviews to help the community grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: isMobile ? '80px 20px' : '120px 48px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(255, 142, 83, 0.05) 100%)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '800',
            color: '#1f2937',
            marginBottom: '24px'
          }}>
            Ready to find your perfect companion?
          </h2>
          <p style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            color: '#6b7280',
            marginBottom: '40px',
            lineHeight: '1.6'
          }}>
            Join thousands of happy dog lovers who have found their perfect furry friends through DogRental.
          </p>
          <button
            onClick={onGetStarted}
            style={{
              padding: isMobile ? '16px 32px' : '20px 40px',
              backgroundColor: '#FF6B35',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontSize: isMobile ? '1.1rem' : '1.2rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(255, 107, 53, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#FF8E53';
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 107, 53, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#FF6B35';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 107, 53, 0.3)';
            }}
          >
            Get Started Today
          </button>
        </div>
      </section>
    </div>
  );
};

export default ModernLandingPage;