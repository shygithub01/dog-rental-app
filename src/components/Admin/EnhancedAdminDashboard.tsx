import React, { useState, useEffect } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import AdminOverview from './AdminOverview';
import UserManagement from './UserManagement';
import ContentModeration from './ContentModeration';
import FinancialDashboard from './FinancialDashboard';
import SafetyCenter from './SafetyCenter';
import AnalyticsDashboard from './AnalyticsDashboard';
import SystemHealth from './SystemHealth';
import { useIsMobile } from '../../hooks/useIsMobile';

interface EnhancedAdminDashboardProps {
  onClose: () => void;
}

const EnhancedAdminDashboard: React.FC<EnhancedAdminDashboardProps> = ({ onClose }) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊', component: AdminOverview },
    { id: 'users', label: 'Users', icon: '👥', component: UserManagement },
    { id: 'content', label: 'Content', icon: '📝', component: ContentModeration },
    { id: 'financial', label: 'Financial', icon: '💰', component: FinancialDashboard },
    { id: 'safety', label: 'Safety', icon: '🛡️', component: SafetyCenter },
    { id: 'analytics', label: 'Analytics', icon: '📈', component: AnalyticsDashboard },
    { id: 'system', label: 'System', icon: '⚙️', component: SystemHealth }
  ];

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    // Fetch comprehensive admin data
    setLoading(false);
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || AdminOverview;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '95%',
        height: '95%',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden'
      }}>
        {/* Sidebar Navigation */}
        <div style={{
          width: isMobile ? '100%' : '250px',
          background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
          color: 'white',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>🛠️ Admin Center</h2>
            <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Enterprise Dashboard</p>
          </div>
          
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                padding: '12px 16px',
                margin: '5px 0',
                background: activeTab === tab.id ? 'rgba(255, 107, 53, 0.2)' : 'transparent',
                border: activeTab === tab.id ? '1px solid #FF6B35' : '1px solid transparent',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
          
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px 16px',
              margin: '20px 0 0 0',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            ← Exit Admin
          </button>
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          background: '#f8fafc'
        }}>
          <ActiveComponent adminData={adminData} onRefresh={fetchAdminData} />
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;