import React from 'react';

interface EarningsReportProps {
  ownerEarnings: any[];
  onClose: () => void;
}

const EarningsReport: React.FC<EarningsReportProps> = ({ ownerEarnings, onClose }) => {
  // Calculate earnings
  const pastEarnings = ownerEarnings
    .filter(rental => rental.status === 'completed')
    .reduce((sum: number, rental: any) => sum + (rental.totalCost || 0), 0);

  const pendingEarnings = ownerEarnings
    .filter(rental => rental.status === 'active')
    .reduce((sum: number, rental: any) => sum + (rental.totalCost || 0), 0);

  const totalEarnings = pastEarnings + pendingEarnings;

  // Helper function to format dates safely
  const formatDate = (date: any) => {
    try {
      if (!date) return 'Date not available';
      
      // Debug logging
      console.log('Formatting date:', date, 'Type:', typeof date);
      
      // Handle Firestore Timestamp
      if (date.toDate && typeof date.toDate === 'function') {
        const jsDate = date.toDate();
        return jsDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      
      // Handle regular Date object or date string
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        console.log('Invalid date object created from:', date);
        return 'Invalid Date';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'Date value:', date);
      return 'Date not available';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* Modern Header - Same as App.tsx */}
      <header className="modern-header fade-in">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#" className="logo">
              DogRental
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section - Matching App.tsx Pattern */}
      <section className="hero-section">
        <div className="hero-content fade-in">
          {/* Hero Text */}
          <div className="hero-text">
            <h1 className="hero-title">
              Your Earnings Report
            </h1>
            <p className="hero-subtitle">
              Track your rental income, view completed transactions, and monitor your earning potential from your furry friends.
            </p>
            
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-number">${pastEarnings}</div>
                <div className="hero-stat-label">Past Earnings</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">${pendingEarnings}</div>
                <div className="hero-stat-label">Pending Earnings</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">${totalEarnings}</div>
                <div className="hero-stat-label">Total Earnings</div>
              </div>
            </div>
          </div>

          {/* Earnings Card - Same Style as Search Card in App.tsx */}
          <div className="search-card slide-up">
            <h3 className="search-title">
              💰 Earnings Overview
            </h3>
            <p className="search-subtitle">
              Your complete earnings breakdown and financial summary
            </p>

            {/* Back to Dashboard Button */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={onClose}
                className="btn-glass-primary"
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem'
                }}
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* Earnings Breakdown */}
            <div style={{ marginTop: '32px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                {/* Past Earnings Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  color: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💰</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    ${pastEarnings}
                  </div>
                  <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                    Past Earnings
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>
                    Completed Rentals
                  </div>
                </div>

                {/* Pending Earnings Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    ${pendingEarnings}
                  </div>
                  <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                    Pending Earnings
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>
                    Active Rentals
                  </div>
                </div>

                {/* Total Earnings Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📈</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    ${totalEarnings}
                  </div>
                  <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                    Total Earnings
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>
                    All Time
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              {ownerEarnings.length > 0 ? (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '24px',
                  marginTop: '24px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                  <h4 style={{
                    margin: '0 0 20px 0',
                    color: '#1f2937',
                    fontSize: '1.25rem',
                    fontWeight: '600'
                  }}>
                    📋 Transaction History ({ownerEarnings.length} rentals)
                  </h4>
                  
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {ownerEarnings.map((rental, index) => (
                      <div key={rental.id || index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        marginBottom: '12px',
                        background: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 0, 0, 0.1)'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                            🐕 {rental.dogName} ({rental.dogBreed})
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {rental.startDate && rental.endDate ? 
                              `${formatDate(rental.startDate)} - ${formatDate(rental.endDate)}` :
                              'Date not available'
                            }
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold', color: '#059669', fontSize: '1.1rem' }}>
                            ${rental.totalCost || 0}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontWeight: '600',
                            backgroundColor: rental.status === 'completed' ? '#DCFCE7' : '#FEF3C7',
                            color: rental.status === 'completed' ? '#166534' : '#92400E'
                          }}>
                            {rental.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '40px',
                  marginTop: '24px',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📊</div>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    color: '#1f2937',
                    fontSize: '1.25rem',
                    fontWeight: '600'
                  }}>
                    No Earnings Yet
                  </h4>
                  <p style={{
                    margin: 0,
                    color: '#6b7280',
                    fontSize: '1rem'
                  }}>
                    Start renting out your dogs to begin earning! Your earnings will appear here once you have completed rentals.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EarningsReport;
