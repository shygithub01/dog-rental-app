import React from 'react';

interface AnalyticsDashboardProps {
  adminData: any;
  onRefresh: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ adminData, onRefresh }) => {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#1f2937', margin: '0 0 10px 0' }}>
        📈 Analytics Dashboard
      </h1>
      <p style={{ color: '#6b7280', margin: '0 0 30px 0' }}>
        Advanced analytics and business intelligence
      </p>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚧</div>
        <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>Analytics Dashboard Coming Soon</h3>
        <p style={{ color: '#6b7280' }}>
          Advanced analytics features including:
          <br />• User behavior tracking
          <br />• Conversion funnel analysis
          <br />• Revenue forecasting
          <br />• Market insights and trends
        </p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;