import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/layout/AuthProvider';
import UnifiedStoreManager from '@/utils/unified-store-manager';

export const useShopifyConnection = () => {
  const { user } = useAuth();
  const [currentStore, setCurrentStore] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStore = () => {
      const store = UnifiedStoreManager.getActiveStore();
      const connected = UnifiedStoreManager.isConnected();
      
      setCurrentStore(store);
      setIsConnected(connected);
      setLoading(false);
      
      console.log('🔗 Shopify connection loaded (unified):', { store, connected });
    };

    loadStore();

    // استمع لتغييرات النظام الموحد + localStorage (عبر التبويبات)
    const unsubscribe = UnifiedStoreManager.onStoreChange((store) => {
      setCurrentStore(store);
      setIsConnected(!!store);
    });

    const handleStorageChange = () => {
      loadStore();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      unsubscribe?.();
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

      // استخدم النظام الموحد لضبط المتجر
      const ok = UnifiedStoreManager.setActiveStore(shopDomain);
      setCurrentStore(shopDomain);
      setIsConnected(ok);
      
      console.log('✅ Store switched successfully (unified):', shopDomain);
      return ok;
    } catch (error) {
      console.error('❌ Error switching store:', error);
      return false;
    }
  };

  const disconnect = () => {
    UnifiedStoreManager.clearActiveStore();
    
    setCurrentStore(null);
    setIsConnected(false);
    
    console.log('🚪 Disconnected from Shopify store (unified)');
  };

  return {
    currentStore,
    isConnected,
    loading,
    switchStore,
    disconnect
  };
};