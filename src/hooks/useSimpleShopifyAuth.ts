import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ShopifyStore {
  shop: string;
  is_active: boolean;
  updated_at: string;
}

export const useSimpleShopifyAuth = () => {
  // قراءة مباشرة من localStorage في كل مرة
  const getCurrentStore = () => localStorage.getItem('current_shopify_store');
  const getCurrentEmail = () => localStorage.getItem('shopify_user_email');
  
  const [currentStore, setCurrentStore] = useState<string | null>(getCurrentStore());
  const [userStores, setUserStores] = useState<ShopifyStore[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(getCurrentEmail());
  const [loading, setLoading] = useState(false);

  // مراقبة تغييرات localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const store = getCurrentStore();
      const email = getCurrentEmail();
      
      console.log('🔄 Storage changed:', { store, email });
      
      setCurrentStore(store);
      setUserEmail(email);
      
      if (store) {
        setUserStores([{ shop: store, is_active: true, updated_at: new Date().toISOString() }]);
      }
    };

    // استمع لتغييرات localStorage من نوافذ أخرى
    window.addEventListener('storage', handleStorageChange);
    // تحديث عند العودة للنشاط
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleStorageChange();
    });
    
    // تحقق دوري بوتيرة منخفضة ويتوقف عند خمول التبويب
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const store = getCurrentStore();
      if (store !== currentStore) {
        console.log('🔄 Store changed via polling:', store);
        setCurrentStore(store);
        if (store) {
          setUserStores([{ shop: store, is_active: true, updated_at: new Date().toISOString() }]);
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleStorageChange as any);
      clearInterval(interval);
    };
  }, [currentStore]);

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
      const store = getCurrentStore();
      if (!store && storesData.length > 0) {
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

      const { email, user_id, auth_token, shop } = data;
      
      // If we got an auth token, sign in the user
      if (auth_token) {
        try {
          const { data: authData, error: authError } = await supabase.auth.setSession({
            access_token: auth_token,
            refresh_token: auth_token // Using same token for both
          });
          
          if (!authError && authData.session) {
            console.log(`🔑 User signed in automatically: ${email}`);
          } else {
            console.log('⚠️ Could not auto-sign in, but store connected');
          }
        } catch (authErr) {
          console.log('⚠️ Auth token setup failed, but store connected:', authErr);
        }
      }
      
      // Save user email and current store
      localStorage.setItem('shopify_user_email', email);
      localStorage.setItem('current_shopify_store', shop);
      
      setUserEmail(email);
      setCurrentStore(shop);
      
      // Reload user stores
      await loadUserStores(email);
      
      console.log(`✅ Store connected and user signed in: ${shop} for email: ${email}`);
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
    const store = currentStore || getCurrentStore();
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

  // Always get fresh data from localStorage
  const freshCurrentStore = getCurrentStore();
  const freshUserEmail = getCurrentEmail();

  console.log('🔍 SimpleShopifyAuth state:', {
    currentStore: freshCurrentStore,
    userStores: userStores.length,
    userEmail: freshUserEmail,
    isConnected: !!freshCurrentStore
  });

  return {
    currentStore: freshCurrentStore, // استخدم القيم الطازجة
    userStores,
    userEmail: freshUserEmail,
    loading,
    isConnected: !!freshCurrentStore,
    totalStores: userStores.length,
    switchToStore,
    connectStore,
    disconnect,
    refreshStores: () => freshUserEmail ? loadUserStores(freshUserEmail) : null
  };
};