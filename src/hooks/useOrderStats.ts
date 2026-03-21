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

      // Count orders this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', activeStore)
        .gte('created_at', startOfMonth.toISOString());

      const { count: abandonedCount } = await supabase
        .from('abandoned_carts')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', activeStore)
        .gte('created_at', startOfMonth.toISOString());

      setStats({
        ordersUsed: ordersCount || 0,
        ordersLimit: null,
        abandonedUsed: abandonedCount || 0,
        abandonedLimit: null,
        planType: 'free',
        ordersPercentage: 0,
        abandonedPercentage: 0
      });

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
