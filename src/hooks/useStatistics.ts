import { useState, useEffect, useCallback } from 'react';
import { statisticsService, PlatformStatistics } from '../services/statisticsService';
import { useFirebase } from '../contexts/FirebaseContext';

interface UseStatisticsReturn {
  statistics: PlatformStatistics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useStatistics = (userId: string): UseStatisticsReturn => {
  const { db } = useFirebase();
  const [statistics, setStatistics] = useState<PlatformStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!userId || !db) return;
    
    try {
      setLoading(true);
      setError(null);
      const stats = await statisticsService.getUserStatistics(userId, db);
      setStatistics(stats);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, [userId, db]);

  const refresh = useCallback(async () => {
    // Clear cache and fetch fresh data
    statisticsService.clearUserCache(userId);
    await fetchStatistics();
  }, [userId, fetchStatistics]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refresh
  };
};