import { useState, useEffect } from 'react';
import { useAuth } from '@/components/layout/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import UnifiedStoreManager from '@/utils/unified-store-manager';

interface ShopifyStore {
  shop: string;
  is_active: boolean;
  access_token?: string;
  user_id?: string;
  updated_at: string;
}

export const useShopifyStores = () => {
  const { user, isShopifyAuthenticated, shop } = useAuth();
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [activeStore, setActiveStore] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب المتاجر باستخدام UnifiedStoreManager
  const fetchStores = async () => {
    try {
      // الحصول على المتجر النشط من UnifiedStoreManager
      const activeStore = UnifiedStoreManager.getActiveStore();
      
      if (!activeStore) {
        console.log('⚠️ useShopifyStores: No active store in UnifiedStoreManager');
        setStores([]);
        setActiveStore(null);
        setIsLoading(false);
        return;
      }

      console.log('🔍 useShopifyStores - Active store from UnifiedStoreManager:', activeStore);
      
      // إنشاء قائمة المتاجر بناءً على المتجر النشط الحالي
      const storesList = [{
        shop: activeStore,
        is_active: true,
        access_token: 'active',
        user_id: user?.id || 'shopify_user',
        updated_at: new Date().toISOString()
      }];

      console.log('📦 useShopifyStores - Stores created:', storesList);
      setStores(storesList);
      setActiveStore(activeStore);
      setIsLoading(false);

    } catch (err) {
      console.error('❌ useShopifyStores - Error:', err);
      setError('Failed to fetch stores');
      setStores([]);
      setActiveStore(null);
      setIsLoading(false);
    }
  };

  // تبديل المتجر النشط باستخدام UnifiedStoreManager
  const switchStore = async (storeName: string): Promise<boolean> => {
    try {
      console.log('🔄 useShopifyStores - Switching to store:', storeName);
      
      const success = UnifiedStoreManager.setActiveStore(storeName);
      if (success) {
        setActiveStore(storeName);
        // تحديث قائمة المتاجر
        await fetchStores();
        console.log('✅ useShopifyStores - Store switched successfully');
        return true;
      } else {
        console.error('❌ useShopifyStores - Failed to set store in UnifiedStoreManager');
        return false;
      }
    } catch (error) {
      console.error('❌ useShopifyStores - Error switching store:', error);
      return false;
    }
  };

  const refreshStores = () => {
    return fetchStores();
  };

  useEffect(() => {
    // تحديث المتاجر عند تغيير حالة المصادقة أو المتجر النشط
    fetchStores();
  }, [isShopifyAuthenticated, shop]);

  // استمع لتغييرات المتجر عبر UnifiedStoreManager
  useEffect(() => {
    const unsubscribe = UnifiedStoreManager.onStoreChange((store) => {
      console.log('🔄 useShopifyStores - Store changed via UnifiedStoreManager:', store);
      setActiveStore(store);
      // تحديث قائمة المتاجر عند تغيير المتجر
      if (store) {
        fetchStores();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    stores,
    activeStore: activeStore || UnifiedStoreManager.getActiveStore(),
    isLoading,
    error,
    fetchStores,
    switchStore,
    refreshStores,
    totalStores: stores.length,
    isConnected: !!activeStore && stores.length > 0
  };
};