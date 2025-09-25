import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useFirebase } from '../../contexts/FirebaseContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface FinancialDashboardProps {
  adminData: any;
  onRefresh: () => void;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ adminData, onRefresh }) => {
  const { db } = useFirebase();
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    platformFees: 0,
    ownerEarnings: 0,
    pendingPayouts: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    avgTransactionValue: 0,
    topEarners: [] as any[],
    recentTransactions: [] as any[],
    monthlyBreakdown: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchFinancialData();
  }, [timeRange]);

  const fetchFinancialData = async () => {
    try {
      // Fetch rentals and calculate financial metrics
      const rentalsSnapshot = await getDocs(collection(db, 'rentals'));
      const rentalsData = rentalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as any[];

      // Calculate metrics based on time range
      const now = new Date();
      const timeRangeMs = getTimeRangeMs(timeRange);
      const cutoffDate = new Date(now.getTime() - timeRangeMs);
      
      const filteredRentals = rentalsData.filter(rental => 
        rental.createdAt && rental.createdAt >= cutoffDate
      );

      const totalRevenue = filteredRentals.reduce((sum, rental) => sum + (rental.totalCost || 0), 0);
      const platformFeeRate = 0.15; // 15% platform fee
      const platformFees = totalRevenue * platformFeeRate;
      const ownerEarnings = totalRevenue - platformFees;

      // Calculate growth (compare with previous period)
      const previousPeriodStart = new Date(cutoffDate.getTime() - timeRangeMs);
      const previousPeriodRentals = rentalsData.filter(rental =>
        rental.createdAt && 
        rental.createdAt >= previousPeriodStart && 
        rental.createdAt < cutoffDate
      );
      const previousRevenue = previousPeriodRentals.reduce((sum, rental) => sum + (rental.totalCost || 0), 0);
      const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      setFinancialData({
        totalRevenue,
        platformFees,
        ownerEarnings,
        pendingPayouts: ownerEarnings * 0.1, // Assume 10% pending
        monthlyRevenue: totalRevenue,
        revenueGrowth,
        avgTransactionValue: filteredRentals.length > 0 ? totalRevenue / filteredRentals.length : 0,
        topEarners: [], // TODO: Calculate top earning dog owners
        recentTransactions: filteredRentals.slice(0, 10),
        monthlyBreakdown: [] // TODO: Calculate monthly breakdown
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeMs = (range: string) => {
    switch (range) {
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      case '90d': return 90 * 24 * 60 * 60 * 1000;
      case '1y': return 365 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  };

  const generateRevenueChartData = (transactions: any[]) => {
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTransactions = transactions.filter(transaction => {
        const transactionDate = transaction.createdAt;
        return transactionDate && 
               transactionDate.toDateString() === date.toDateString();
      });
      const dayRevenue = dayTransactions.reduce((sum, transaction) => sum + (transaction.totalCost || 0), 0);
      
      last14Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
        transactions: dayTransactions.length
      });
    }
    return last14Days;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading financial data...</div>;
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px' 
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#1f2937', margin: '0 0 10px 0' }}>
            💰 Financial Dashboard
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Revenue tracking and financial analytics
          </p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Revenue Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <RevenueCard
          title="Total Revenue"
          value={`$${financialData.totalRevenue.toLocaleString()}`}
          icon="💰"
          color="#10b981"
          growth={financialData.revenueGrowth}
        />
        <RevenueCard
          title="Platform Fees (15%)"
          value={`$${financialData.platformFees.toLocaleString()}`}
          icon="🏦"
          color="#3b82f6"
        />
        <RevenueCard
          title="Owner Earnings"
          value={`$${financialData.ownerEarnings.toLocaleString()}`}
          icon="👥"
          color="#f59e0b"
        />
        <RevenueCard
          title="Avg Transaction"
          value={`$${financialData.avgTransactionValue.toFixed(0)}`}
          icon="📊"
          color="#8b5cf6"
        />
      </div>

      {/* Charts and Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px'
      }}>
        {/* Revenue Trends Chart */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>📈 Revenue Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={generateRevenueChartData(financialData.recentTransactions)}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: any) => [`$${value}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#revenueGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>💳 Recent Transactions</h3>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {financialData.recentTransactions.map((transaction, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>
                    {transaction.dogName || 'Dog Rental'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {transaction.createdAt?.toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontWeight: '600', color: '#10b981' }}>
                  ${transaction.totalCost || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payout Management */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>💸 Payout Management</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div style={{ textAlign: 'center', padding: '15px', background: '#fef3c7', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>
              ${financialData.pendingPayouts.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#92400e' }}>Pending Payouts</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button style={{
              padding: '10px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              Process Payouts
            </button>
            <button style={{
              padding: '10px 20px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RevenueCard: React.FC<{
  title: string;
  value: string;
  icon: string;
  color: string;
  growth?: number;
}> = ({ title, value, icon, color, growth }) => (
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
    {growth !== undefined && (
      <div style={{ 
        fontSize: '0.8rem', 
        color: growth >= 0 ? '#10b981' : '#ef4444',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}>
        <span>{growth >= 0 ? '↗️' : '↘️'}</span>
        <span>{Math.abs(growth).toFixed(1)}% vs previous period</span>
      </div>
    )}
  </div>
);

export default FinancialDashboard;