import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/layout/AuthProvider';
import { toast } from 'sonner';

interface ShopifyStore {
  shop: string;
  is_active: boolean;
  updated_at: string;
  access_token?: string;
  user_id?: string;
}

export const useShopifyStoreSync = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStore, setCurrentStore] = useState<string | null>(null);

  // Get current active store from localStorage with better validation
  const getActiveStore = useCallback(() => {
    const sources = [
      'active_shopify_store', // UnifiedStoreManager key
      'shopify_store', 
      'simple_active_store', 
      'active_shop'
    ];
    
    for (const source of sources) {
      const store = localStorage.getItem(source);
      if (store && store !== 'null' && store.includes('.myshopify.com')) {
        console.log(`✅ Found active store from ${source}:`, store);
        return store;
      }
    }
    console.log('⚠️ No active store found in localStorage');
    return null;
  }, []);

  // Load stores for current user only
  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('🔄 جاري تحميل المتاجر...');
      
      // جلب المتجر النشط أولاً
      const activeStore = getActiveStore();
      console.log('🏪 المتجر النشط من localStorage:', activeStore);
      
      if (!activeStore) {
        console.log('⚠️ لا يوجد متجر نشط');
        setStores([]);
        setCurrentStore(null);
        setLoading(false);
        return;
      }

      // جلب متجر واحد فقط - المتجر النشط من localStorage
      const { data: storeData, error } = await supabase
        .from('shopify_stores')
        .select('shop, is_active, updated_at, access_token')
        .eq('shop', activeStore)
        .eq('is_active', true)
        .not('access_token', 'is', null)
        .neq('access_token', '')
        .neq('access_token', 'placeholder_token')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ خطأ في جلب المتجر:', error);
        throw error;
      }

      console.log('📋 بيانات المتجر المستلمة:', storeData);
      
      // إما أن نعرض المتجر من قاعدة البيانات أو من localStorage
      const storeToShow = storeData || {
        shop: activeStore,
        is_active: true,
        updated_at: new Date().toISOString(),
        access_token: 'session_based'
      };
      
      setStores([storeToShow]);
      setCurrentStore(activeStore);
      
      console.log(`✅ تم تحميل المتجر: ${activeStore}`);
      
    } catch (error) {
      console.error('❌ خطأ في تحميل المتاجر:', error);
      toast.error('فشل في تحميل المتاجر');
      
      // fallback: عرض المتجر النشط من localStorage
      const activeStore = getActiveStore();
      if (activeStore) {
        setStores([{
          shop: activeStore,
          is_active: true,
          updated_at: new Date().toISOString(),
          access_token: 'fallback'
        }]);
        setCurrentStore(activeStore);
      } else {
        setStores([]);
        setCurrentStore(null);
      }
    } finally {
      setLoading(false);
    }
  }, [getActiveStore]);

  // Switch to a different store
  const switchToStore = useCallback((shopDomain: string) => {
    try {
      // Update localStorage keys including UnifiedStoreManager
      localStorage.setItem('active_shopify_store', shopDomain);
      localStorage.setItem('shopify_store', shopDomain);
      localStorage.setItem('simple_active_store', shopDomain);
      localStorage.setItem('active_shop', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
      
      // Update current store state immediately
      setCurrentStore(shopDomain);
      
      // Force reload stores to ensure UI consistency
      loadStores();
      
      console.log(`🔄 Switched to store: ${shopDomain}`);
      toast.success(`تم التبديل إلى متجر: ${shopDomain}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error switching store:', error);
      toast.error('فشل في تبديل المتجر');
      return false;
    }
  }, [loadStores]);

  // Disconnect from all stores
  const disconnectAll = useCallback(() => {
    try {
      // Clear localStorage
      const keysToRemove = [
        'active_shopify_store', // UnifiedStoreManager key
        'shopify_store',
        'simple_active_store', 
        'active_shop',
        'shopify_connected',
        'cached_forms'
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Update state
      setCurrentStore(null);
      
      console.log('🔌 Disconnected from all stores');
      toast.success('تم قطع الاتصال من جميع المتاجر');
      
      return true;
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
      toast.error('فشل في قطع الاتصال');
      return false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadStores();
  }, [loadStores]);

  return {
    stores,
    loading,
    currentStore,
    loadStores,
    switchToStore,
    disconnectAll,
    getActiveStore
  };
};