import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ShopifyStore {
  shop: string;
  is_active: boolean;
  updated_at: string;
}

export const useSimpleShopifyAuth = () => {
  const [currentStore, setCurrentStore] = useState<string | null>(() => {
    // قراءة فورية من localStorage عند إنشاء الـ state
    return localStorage.getItem('current_shopify_store') || null;
  });
  const [userStores, setUserStores] = useState<ShopifyStore[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('shopify_user_email') || null;
  });
  const [loading, setLoading] = useState(false);

  // تحديث فوري للـ state عند تغيير localStorage
  useEffect(() => {
    const store = localStorage.getItem('current_shopify_store');
    const email = localStorage.getItem('shopify_user_email');
    
    console.log('🔍 SimpleShopifyAuth - Loading from localStorage:', { store, email, currentStore });
    
    if (store !== currentStore) {
      setCurrentStore(store);
    }
    if (email !== userEmail) {
      setUserEmail(email);
    }
    
    if (store) {
      // إذا كان هناك متجر، أنشئ قائمة المتاجر فوراً
      setUserStores([{ shop: store, is_active: true, updated_at: new Date().toISOString() }]);
    }
  }, [currentStore, userEmail]);

  // Load all stores for current user email using raw SQL since the function returns different structure
  const loadUserStores = async (email: string) => {
    try {
      setLoading(true);
      
      // Use direct query - temporarily without email column until migration completes
      const { data, error } = await supabase
        .from('shopify_stores')
        .select('shop, is_active, updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading user stores:', error);
        return;
      }

      const storesData = data || [];
      setUserStores(storesData);
      
      // If no current store is set, use the most recent one
      if (!currentStore && storesData.length > 0) {
        switchToStore(storesData[0].shop, false);
      }
      
    } catch (error) {
      console.error('Error in loadUserStores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Switch to a different store
  const switchToStore = (shopDomain: string, reload = true) => {
    localStorage.setItem('current_shopify_store', shopDomain);
    setCurrentStore(shopDomain);
    
    console.log(`🔄 Switched to store: ${shopDomain}`);
    
    if (reload) {
      window.location.reload();
    }
  };

  // Connect a new store
  const connectStore = async (shopDomain: string, accessToken: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('simple-shopify-connect', {
        body: {
          shop: shopDomain,
          access_token: accessToken
        }
      });

      if (error) {
        console.error('Error connecting store:', error);
        return false;
      }

      const email = data.email;
      
      // Save user email and current store
      localStorage.setItem('shopify_user_email', email);
      localStorage.setItem('current_shopify_store', shopDomain);
      
      setUserEmail(email);
      setCurrentStore(shopDomain);
      
      // Reload user stores
      await loadUserStores(email);
      
      console.log(`✅ Store connected: ${shopDomain} for email: ${email}`);
      return true;
      
    } catch (error) {
      console.error('Error in connectStore:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check if user is "logged in" (has a connected store)
  const isConnected = () => {
    const store = currentStore || localStorage.getItem('current_shopify_store');
    return !!store;
  };

  // Disconnect (clear all data)
  const disconnect = () => {
    localStorage.removeItem('current_shopify_store');
    localStorage.removeItem('shopify_user_email');
    
    setCurrentStore(null);
    setUserEmail(null);
    setUserStores([]);
    
    console.log('🚪 Disconnected from all stores');
  };

  return {
    currentStore,
    userStores,
    userEmail,
    loading,
    isConnected: isConnected(),
    totalStores: userStores.length,
    switchToStore,
    connectStore,
    disconnect,
    refreshStores: () => userEmail ? loadUserStores(userEmail) : null
  };
};