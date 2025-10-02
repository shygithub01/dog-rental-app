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

        {/* Hero Image - Featuring Stanny Dogs */}
        <div style={{
          width: '100%',
          marginTop: '40px'
        }}>
          {/* Main Featured Dog */}
          <div style={{
            width: '100%',
            height: isMobile ? '300px' : '400px',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            marginBottom: '20px'
          }}>
            <img
              src="/images/stanny7.jpg"
              alt="Stanny 7 - Beautiful Golden Retriever available for companionship"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              onError={(e) => {
                // Fallback to Stanny 5 if Stanny 7 doesn't load
                e.currentTarget.src = '/images/stanny5.jpg';
                e.currentTarget.alt = 'Stanny 5 - Adorable companion dog';
                e.currentTarget.onerror = () => {
                  // Final fallback to stock image
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2124&q=80';
                  e.currentTarget.alt = 'Happy Golden Retriever';
                };
              }}
            />
            
            {/* Dog Info Overlay */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                🐕
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  Meet Stanny 7
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  color: '#6b7280'
                }}>
                  Golden Retriever • Available for walks & companionship
                </p>
              </div>
              <div style={{
                padding: '6px 12px',
                backgroundColor: '#10b981',
                color: 'white',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                Available
              </div>
            </div>
          </div>

          {/* Secondary Dogs Showcase */}
          {!isMobile && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              {/* Stanny 5 */}
              <div style={{
                height: '200px',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                position: 'relative'
              }}>
                <img
                  src="/images/stanny5.jpg"
                  alt="Stanny 5 - Playful companion dog"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    Stanny 5
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    Perfect for adventures
                  </div>
                </div>
              </div>

              {/* More Dogs Available */}
              <div style={{
                height: '200px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 142, 83, 0.1) 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '20px',
                border: '2px dashed rgba(255, 107, 53, 0.3)'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '12px'
                }}>
                  🐕‍🦺
                </div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: '#FF6B35',
                  margin: '0 0 8px 0'
                }}>
                  +10 More Dogs
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Discover more amazing companions in your area
                </p>
              </div>
            </div>
          )}
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