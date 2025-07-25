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

  // Load stores from database
  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      
      // First try to link active stores to current user
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          // Use direct SQL call since rpc function typing isn't available
          const result = await fetch('https://trlklwixfeaexhydzaue.supabase.co/rest/v1/rpc/link_active_store_to_user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          if (result.ok) {
            console.log('✅ Successfully linked active stores to user');
          }
        } catch (linkError) {
          console.log('Could not link stores to user:', linkError);
        }
      }
      
      // Now fetch stores using the Supabase client directly
      const { data: storesList, error } = await supabase
        .from('shopify_stores')
        .select('shop, is_active, updated_at, access_token')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      setStores(storesList || []);
      
      // Update current store
      const activeStore = getActiveStore();
      setCurrentStore(activeStore);
      
      console.log(`📋 تم تحميل ${(storesList || []).length} متجر، المتجر النشط: ${activeStore}`);
      
    } catch (error) {
      console.error('❌ خطأ في تحميل المتاجر:', error);
      toast.error('فشل في تحميل المتاجر');
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