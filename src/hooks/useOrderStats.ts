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

      console.log('🔍 OrderStats - Active store:', activeStore);
      
      // استدعاء دالة الإحصائيات الشهرية
      const { data, error: functionError } = await supabase.rpc('get_monthly_usage_stats', {
        p_shop_id: activeStore
      });

      console.log('📊 OrderStats - Function response:', { data, functionError });

      if (functionError) {
        throw functionError;
      }

      if (data) {
        console.log('📊 OrderStats - Plan type from function:', data.plan_type);
        setStats({
          ordersUsed: data.orders_used || 0,
          ordersLimit: data.orders_limit,
          abandonedUsed: data.abandoned_used || 0,
          abandonedLimit: data.abandoned_limit,
          planType: data.plan_type || 'free',
          ordersPercentage: data.orders_percentage || 0,
          abandonedPercentage: data.abandoned_percentage || 0
        });
        console.log('✅ OrderStats - Stats updated with plan:', data.plan_type || 'free');
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