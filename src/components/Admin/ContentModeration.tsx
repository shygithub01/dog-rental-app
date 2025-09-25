import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';

interface ContentModerationProps {
  adminData: any;
  onRefresh: () => void;
}

const ContentModeration: React.FC<ContentModerationProps> = ({ adminData, onRefresh }) => {
  const { db } = useFirebase();
  const [contentData, setContentData] = useState({
    pendingDogs: [] as any[],
    reportedContent: [] as any[],
    flaggedPhotos: [] as any[],
    totalReports: 0,
    resolvedReports: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending');

  useEffect(() => {
    fetchContentData();
  }, []);

  const fetchContentData = async () => {
    try {
      const [dogsSnapshot, reportsSnapshot] = await Promise.all([
        getDocs(collection(db, 'dogs')),
        getDocs(collection(db, 'reports')).catch(() => ({ docs: [] })) // Handle if reports collection doesn't exist
      ]);

      const dogs = dogsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const reports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      const pendingDogs = dogs.filter(dog => !dog.adminReviewed || dog.status === 'pending');
      const reportedContent = reports.filter(report => !report.resolved);

      setContentData({
        pendingDogs,
        reportedContent,
        flaggedPhotos: [], // TODO: Implement photo flagging
        totalReports: reports.length,
        resolvedReports: reports.filter(report => report.resolved).length
      });

    } catch (error) {
      console.error('Error fetching content data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDogApproval = async (dogId: string, approved: boolean) => {
    try {
      await updateDoc(doc(db, 'dogs', dogId), {
        status: approved ? 'available' : 'rejected',
        adminReviewed: true,
        reviewedAt: new Date(),
        isAvailable: approved
      });
      
      fetchContentData();
    } catch (error) {
      console.error('Error updating dog approval:', error);
    }
  };

  const handleReportResolution = async (reportId: string, action: 'resolve' | 'escalate') => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        resolved: action === 'resolve',
        escalated: action === 'escalate',
        resolvedAt: new Date(),
        resolvedBy: 'admin'
      });
      
      fetchContentData();
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading content data...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', color: '#1f2937', margin: '0 0 10px 0' }}>
          📝 Content Moderation
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Review and moderate user-generated content
        </p>
      </div>

      {/* Content Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <ContentMetricCard
          title="Pending Reviews"
          value={contentData.pendingDogs.length}
          icon="⏳"
          color="#f59e0b"
          subtitle="Dog listings awaiting approval"
        />
        <ContentMetricCard
          title="Active Reports"
          value={contentData.reportedContent.length}
          icon="🚨"
          color="#ef4444"
          subtitle="User reports to review"
        />
        <ContentMetricCard
          title="Total Reports"
          value={contentData.totalReports}
          icon="📊"
          color="#6b7280"
          subtitle={`${contentData.resolvedReports} resolved`}
        />
        <ContentMetricCard
          title="Flagged Photos"
          value={contentData.flaggedPhotos.length}
          icon="📸"
          color="#8b5cf6"
          subtitle="AI-flagged content"
        />
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px'
      }}>
        {[
          { key: 'pending', label: 'Pending Dogs', count: contentData.pendingDogs.length },
          { key: 'reports', label: 'Reports', count: contentData.reportedContent.length },
          { key: 'photos', label: 'Flagged Photos', count: contentData.flaggedPhotos.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            style={{
              padding: '10px 16px',
              background: activeFilter === tab.key ? '#FF6B35' : 'white',
              color: activeFilter === tab.key ? 'white' : '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: activeFilter === tab.key ? 'rgba(255,255,255,0.3)' : '#ef4444',
                color: activeFilter === tab.key ? 'white' : 'white',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Review Area */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {activeFilter === 'pending' && (
          <PendingDogsReview 
            dogs={contentData.pendingDogs} 
            onApproval={handleDogApproval}
          />
        )}
        
        {activeFilter === 'reports' && (
          <ReportsReview 
            reports={contentData.reportedContent} 
            onResolve={handleReportResolution}
          />
        )}
        
        {activeFilter === 'photos' && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '15px' }}>📸</div>
            <h3>Photo Moderation</h3>
            <p>AI-powered photo content moderation coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PendingDogsReview: React.FC<{ dogs: any[]; onApproval: (id: string, approved: boolean) => void }> = ({ dogs, onApproval }) => {
  if (dogs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🎉</div>
        <h3>All caught up!</h3>
        <p>No dog listings pending review</p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>🐕 Pending Dog Approvals</h3>
      <div style={{ display: 'grid', gap: '15px' }}>
        {dogs.map(dog => (
          <div key={dog.id} style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '15px',
            display: 'flex',
            gap: '15px',
            alignItems: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              background: dog.imageUrl ? `url(${dog.imageUrl})` : '#f3f4f6',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
            
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#1f2937' }}>{dog.name}</h4>
              <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '0.9rem' }}>
                {dog.breed} • {dog.age} years • ${dog.pricePerDay}/day
              </p>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>
                Owner: {dog.ownerName} • {dog.location}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onApproval(dog.id, true)}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                ✅ Approve
              </button>
              <button
                onClick={() => onApproval(dog.id, false)}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                ❌ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReportsReview: React.FC<{ reports: any[]; onResolve: (id: string, action: 'resolve' | 'escalate') => void }> = ({ reports, onResolve }) => {
  if (reports.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🎉</div>
        <h3>No active reports!</h3>
        <p>All user reports have been resolved</p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>🚨 Active Reports</h3>
      <div style={{ color: '#6b7280' }}>
        Report management system coming soon...
      </div>
    </div>
  );
};

const ContentMetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: `2px solid ${color}20`
  }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
      <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>{icon}</span>
      <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{title}</span>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 'bold', color, marginBottom: '5px' }}>
      {value}
    </div>
    {subtitle && (
      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
        {subtitle}
      </div>
    )}
  </div>
);

export default ContentModeration;