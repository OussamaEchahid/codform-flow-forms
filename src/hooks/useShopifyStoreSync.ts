import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShopifyStore {
  shop: string;
  is_active: boolean;
  updated_at: string;
  access_token?: string;
  user_id?: string;
}

export const useShopifyStoreSync = () => {
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStore, setCurrentStore] = useState<string | null>(null);

  // Get current active store from localStorage
  const getActiveStore = useCallback(() => {
    const sources = ['shopify_store', 'simple_active_store', 'active_shop'];
    for (const source of sources) {
      const store = localStorage.getItem(source);
      if (store && store !== 'null') {
        return store;
      }
    }
    return null;
  }, []);

  // Load stores from database - إصدار مُبسط بدون تعقيدات
  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('🔄 جاري تحميل المتاجر من قاعدة البيانات...');
      
      // جلب جميع المتاجر مباشرة بدون شروط معقدة
      const { data: storesList, error } = await supabase
        .from('shopify_stores')
        .select('shop, is_active, updated_at, access_token')
        .eq('is_active', true)
        .not('access_token', 'is', null)
        .neq('access_token', '')
        .neq('access_token', 'placeholder_token')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ خطأ في جلب المتاجر:', error);
        throw error;
      }

      console.log('📋 المتاجر المستلمة من قاعدة البيانات:', storesList);
      
      setStores(storesList || []);
      
      // تحديث المتجر النشط
      const activeStore = getActiveStore();
      setCurrentStore(activeStore);
      
      console.log(`✅ تم تحميل ${(storesList || []).length} متجر، المتجر النشط: ${activeStore}`);
      
    } catch (error) {
      console.error('❌ خطأ في تحميل المتاجر:', error);
      toast.error('فشل في تحميل المتاجر');
      // في حالة الخطأ، نحاول جلب المتجر من localStorage على الأقل
      const activeStore = getActiveStore();
      if (activeStore) {
        setStores([{
          shop: activeStore,
          is_active: true,
          updated_at: new Date().toISOString(),
          access_token: 'unknown'
        }]);
        setCurrentStore(activeStore);
      }
    } finally {
      setLoading(false);
    }
  }, [getActiveStore]);

  // Switch to a different store
  const switchToStore = useCallback((shopDomain: string) => {
    try {
      // Update localStorage keys
      localStorage.setItem('shopify_store', shopDomain);
      localStorage.setItem('simple_active_store', shopDomain);
      localStorage.setItem('active_shop', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
      
      // Update current store
      setCurrentStore(shopDomain);
      
      console.log(`🔄 Switched to store: ${shopDomain}`);
      toast.success(`تم التبديل إلى متجر: ${shopDomain}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error switching store:', error);
      toast.error('فشل في تبديل المتجر');
      return false;
    }
  }, []);

  // Disconnect from all stores
  const disconnectAll = useCallback(() => {
    try {
      // Clear localStorage
      const keysToRemove = [
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