import { useState, useEffect } from 'react';
import { useAuth } from '@/components/layout/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface ShopifyStore {
  shop: string;
  is_active: boolean;
  access_token?: string;
  user_id?: string;
  updated_at: string;
}

export const useShopifyStores = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [activeStore, setActiveStore] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب المتاجر مباشرة من قاعدة البيانات
  const fetchStores = async () => {
    if (!user) {
      setStores([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching stores for user:', user.id);
      
      // @ts-ignore - temporary fix for type issue
      const { data, error } = await supabase
        .from('shopify_stores')
        .select('shop, is_active, access_token, updated_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false }) as any;

      if (error) {
        throw error;
      }

      console.log('📦 Stores loaded:', data);

      if (data && data.length > 0) {
        setStores(data);
        
        // تعيين المتجر النشط
        const currentActive = localStorage.getItem('current_shopify_store');
        if (!currentActive) {
          const firstStore = data[0].shop;
          localStorage.setItem('current_shopify_store', firstStore);
          localStorage.setItem('shopify_connected', 'true');
          setActiveStore(firstStore);
          console.log('✅ First store set as active:', firstStore);
        } else {
          setActiveStore(currentActive);
          console.log('✅ Using cached active store:', currentActive);
        }
      } else {
        setStores([]);
        setActiveStore(null);
        localStorage.removeItem('current_shopify_store');
        localStorage.removeItem('shopify_connected');
      }
    } catch (err) {
      console.error('❌ Error fetching stores:', err);
      setError('Failed to fetch stores');
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  };

  // تبديل المتجر النشط
  const switchStore = async (storeName: string): Promise<boolean> => {
    try {
      console.log('🔄 Switching to store:', storeName);
      
      localStorage.setItem('current_shopify_store', storeName);
      localStorage.setItem('shopify_connected', 'true');
      setActiveStore(storeName);
      
      console.log('✅ Store switched successfully');
      return true;
    } catch (error) {
      console.error('❌ Error switching store:', error);
      return false;
    }
  };

  const refreshStores = () => {
    return fetchStores();
  };

  useEffect(() => {
    if (user) {
      fetchStores();
    }
  }, [user]);

  // استمع لتغييرات localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const currentStore = localStorage.getItem('current_shopify_store');
      setActiveStore(currentStore);
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    stores,
    activeStore: activeStore || localStorage.getItem('current_shopify_store'),
    isLoading,
    error,
    fetchStores,
    switchStore,
    refreshStores,
    totalStores: stores.length,
    isConnected: !!activeStore && stores.length > 0
  };
};