import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import UnifiedStoreManager from '@/utils/unified-store-manager';

interface OrderStats {
  ordersUsed: number;
  ordersLimit: number | null;
  abandonedUsed: number;
  abandonedLimit: number | null;
  planType: string;
  ordersPercentage: number;
  abandonedPercentage: number;
}

export const useOrderStats = () => {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const activeStore = UnifiedStoreManager.getActiveStore();
      if (!activeStore) {
        setError('لا يوجد متجر نشط');
        return;
      }

      // استدعاء دالة الإحصائيات الشهرية
      const { data, error: functionError } = await supabase.rpc('get_monthly_usage_stats', {
        p_shop_id: activeStore
      });

      if (functionError) {
        throw functionError;
      }

      if (data) {
        setStats({
          ordersUsed: data.orders_used || 0,
          ordersLimit: data.orders_limit,
          abandonedUsed: data.abandoned_used || 0,
          abandonedLimit: data.abandoned_limit,
          planType: data.plan_type || 'free',
          ordersPercentage: data.orders_percentage || 0,
          abandonedPercentage: data.abandoned_percentage || 0
        });
      }

    } catch (err) {
      console.error('Error loading order stats:', err);
      setError('فشل في تحميل إحصائيات الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const refetch = () => {
    loadStats();
  };

  return {
    stats,
    loading,
    error,
    refetch
  };
};