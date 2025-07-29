import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/layout/AuthProvider';

export const useShopifyConnection = () => {
  const { user } = useAuth();
  const [currentStore, setCurrentStore] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStore = () => {
      const store = localStorage.getItem('current_shopify_store');
      const connected = localStorage.getItem('shopify_connected') === 'true';
      
      setCurrentStore(store);
      setIsConnected(connected && !!store);
      setLoading(false);
      
      console.log('🔗 Shopify connection loaded:', { store, connected });
    };

    loadStore();

    // استمع لتغييرات localStorage
    const handleStorageChange = () => {
      loadStore();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const switchStore = async (shopDomain: string): Promise<boolean> => {
    try {
      if (!user) return false;

      // تحديث قاعدة البيانات
      // @ts-ignore - temporary fix for type issue
      await supabase
        .from('shopify_stores')
        .upsert({
          shop: shopDomain,
          user_id: user.id,
          is_active: true,
          updated_at: new Date().toISOString()
        });

      // تحديث localStorage
      localStorage.setItem('current_shopify_store', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
      
      setCurrentStore(shopDomain);
      setIsConnected(true);
      
      console.log('✅ Store switched successfully:', shopDomain);
      return true;
    } catch (error) {
      console.error('❌ Error switching store:', error);
      return false;
    }
  };

  const disconnect = () => {
    localStorage.removeItem('current_shopify_store');
    localStorage.removeItem('shopify_connected');
    
    setCurrentStore(null);
    setIsConnected(false);
    
    console.log('🚪 Disconnected from Shopify store');
  };

  return {
    currentStore,
    isConnected,
    loading,
    switchStore,
    disconnect
  };
};