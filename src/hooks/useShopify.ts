
import { useState, useEffect, useCallback } from 'react';
import { ShopifyProduct } from '@/lib/shopify/types';
import { shopifyStores, shopifySupabase } from '@/lib/shopify/supabase-client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

interface ShopifyFormSync {
  formId: string;
  shopDomain?: string;
  settings?: {
    position?: 'product-page' | 'cart-page' | 'checkout';
    blockId?: string;
    products?: string[];
    themeType?: 'os2' | 'traditional' | 'auto-detect';
    insertionMethod?: 'auto' | 'manual';
    singleProductSync?: boolean;
    productId?: string;
    replaceExisting?: boolean;
  };
}

export const useShopify = () => {
  const { shop } = useAuth();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [shopifyAPI, setShopifyAPI] = useState<any>(null);
  const [pendingSyncForms, setPendingSyncForms] = useState<string[]>([]);
  
  // Recovery mode - for handling errors gracefully
  const [failSafeMode, setFailSafeMode] = useState(() => {
    return localStorage.getItem('shopify_failsafe') === 'true';
  });

  // Initialize connection state
  useEffect(() => {
    const checkConnection = async () => {
      if (!shop) {
        setIsConnected(false);
        return;
      }

      try {
        // Try to get token from db
        const { data, error } = await shopifyStores()
          .select('*')
          .eq('shop', shop)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching token:', error);
          setIsConnected(false);
          setTokenError(true);
          return;
        }

        if (data && data.length > 0) {
          setAccessToken(data[0].access_token || '');
          setIsConnected(true);
          return;
        }

        setIsConnected(false);
      } catch (error) {
        console.error('Error in checkConnection:', error);
        setIsConnected(false);
        setTokenError(true);
      }
    };

    checkConnection();
  }, [shop]);

  // Load products when connected
  const loadProducts = useCallback(async () => {
    if (!isConnected || !shop) {
      return [];
    }

    setIsLoading(true);
    try {
      // Get token
      const { data: tokenData, error: tokenError } = await shopifyStores()
        .select('*')
        .eq('shop', shop)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (tokenError || !tokenData || tokenData.length === 0) {
        throw new Error('Token not found');
      }

      const token = tokenData[0].access_token || '';
      
      // Fetch products using edge function
      const { data, error } = await shopifySupabase.functions.invoke('shopify-products', {
        body: { shop, accessToken: token }
      });

      if (error) {
        throw error;
      }

      setProducts(data?.products || []);
      setIsLoading(false);
      return data?.products || [];
    } catch (error) {
      console.error('Error loading products:', error);
      setIsLoading(false);
      setTokenError(true);
      return [];
    }
  }, [isConnected, shop]);

  // Test connection
  const testConnection = useCallback(async (withRetry = false) => {
    if (!shop) return false;
    
    if (withRetry) {
      setIsRetrying(true);
    }
    
    try {
      // Get token
      const { data: tokenData, error: tokenError } = await shopifyStores()
        .select('*')
        .eq('shop', shop)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (tokenError || !tokenData || tokenData.length === 0) {
        throw new Error('Token not found');
      }

      // Test token with a simple API call
      const { data, error } = await shopifySupabase.functions.invoke('shopify-test-connection', {
        body: { shop, accessToken: tokenData[0].access_token || '' }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setIsConnected(true);
        setTokenError(false);
        setTokenExpired(false);
        return true;
      } else {
        throw new Error(data.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
      setTokenError(true);
      return false;
    } finally {
      if (withRetry) {
        setIsRetrying(false);
      }
    }
  }, [shop]);

  // Toggle fail-safe mode
  const toggleFailSafeMode = useCallback((value?: boolean) => {
    const newValue = value !== undefined ? value : !failSafeMode;
    setFailSafeMode(newValue);
    localStorage.setItem('shopify_failsafe', newValue ? 'true' : 'false');
  }, [failSafeMode]);

  // Refresh connection
  const refreshConnection = useCallback(async () => {
    return await testConnection(true);
  }, [testConnection]);

  // Sync a form with Shopify
  const syncForm = useCallback(async (formData: ShopifyFormSync) => {
    if (!isConnected && !failSafeMode) {
      throw new Error('Not connected to Shopify');
    }

    setIsSyncing(true);
    try {
      const shopDomain = formData.shopDomain || shop;
      
      if (!shopDomain) {
        throw new Error('No shop domain provided');
      }

      if (failSafeMode) {
        // In fail-safe mode, store pending syncs locally
        const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
        pendingSyncs.push(formData);
        localStorage.setItem('pending_form_syncs', JSON.stringify(pendingSyncs));
        
        // Update state
        setPendingSyncForms([...pendingSyncForms, formData.formId]);
        
        // Mock success
        console.log('Form saved for future sync:', formData);
        return { success: true, message: 'Form saved for future sync' };
      }

      // Ensure settings has the singleProductSync flag if needed
      if (formData.settings && formData.settings.productId && !formData.settings.products) {
        formData.settings.singleProductSync = true;
      }
      
      // Default to replacing existing settings to avoid duplication
      if (formData.settings && !formData.settings.replaceExisting) {
        formData.settings.replaceExisting = true;
      }

      // Real sync with Shopify
      const { data, error } = await shopifySupabase.functions.invoke('shopify-sync-form', {
        body: {
          shop: shopDomain,
          formId: formData.formId,
          settings: formData.settings
        }
      });

      if (error) {
        throw error;
      }

      setIsSyncing(false);
      
      // Show toast notification
      toast({
        title: "نجاح!",
        description: "تم مزامنة النموذج بنجاح مع متجرك على Shopify.",
        variant: "success"
      });
      
      return data;
    } catch (error) {
      console.error('Error syncing form with Shopify:', error);
      setIsSyncing(false);
      
      // Show toast notification
      toast({
        title: "خطأ",
        description: `فشل في مزامنة النموذج: ${error.message || 'خطأ غير معروف'}`,
        variant: "destructive"
      });
      
      // If sync fails, store pending sync
      const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
      pendingSyncs.push(formData);
      localStorage.setItem('pending_form_syncs', JSON.stringify(pendingSyncs));
      
      // Update state
      setPendingSyncForms([...pendingSyncForms, formData.formId]);
      
      throw error;
    }
  }, [isConnected, failSafeMode, shop]);

  // Alias for syncForm for compatibility
  const syncFormWithShopify = syncForm;

  // Resync pending forms
  const resyncPendingForms = useCallback(async () => {
    if (!isConnected || !shop) {
      toast.error('Cannot resync while disconnected');
      return;
    }

    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
      
      if (pendingSyncs.length === 0) {
        toast.info('No pending forms to sync');
        setIsSyncing(false);
        return;
      }

      for (const formData of pendingSyncs) {
        try {
          await syncForm(formData);
          successCount++;
        } catch (error) {
          console.error('Error resyncing form:', error);
          failCount++;
        }
      }

      // Clear synced forms
      localStorage.setItem('pending_form_syncs', '[]');
      setPendingSyncForms([]);
      
      toast.success(`Resynced ${successCount} forms successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
    } catch (error) {
      console.error('Error in resyncPendingForms:', error);
      toast.error('Error resyncing pending forms');
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, shop, syncForm]);

  // Load pending syncs on init
  useEffect(() => {
    const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
    const formIds = pendingSyncs.map((sync: ShopifyFormSync) => sync.formId);
    setPendingSyncForms(formIds);
  }, []);

  // Emergency reset for recovery
  const emergencyReset = useCallback(() => {
    // Clear all Shopify-related localStorage items
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_token');
    localStorage.removeItem('shopify_failsafe');
    localStorage.removeItem('pending_form_syncs');
    localStorage.removeItem('shopify_recovery_mode');
    localStorage.removeItem('shopify_last_url_shop');
    
    // Reset state
    setIsConnected(false);
    setTokenError(false);
    setTokenExpired(false);
    setFailSafeMode(false);
    setPendingSyncForms([]);
    
    // Clear Shopify connection manager
    shopifyConnectionManager.clearAllStores();
    
    return true;
  }, []);

  return {
    isLoading,
    isSyncing,
    isRetrying,
    isConnected,
    tokenError,
    tokenExpired,
    accessToken,
    shopifyAPI,
    products,
    shop,
    error: tokenError,
    failSafeMode,
    pendingSyncForms,
    toggleFailSafeMode,
    loadProducts,
    testConnection,
    refreshConnection,
    syncForm,
    syncFormWithShopify: syncForm, // Alias for compatibility
    resyncPendingForms,
    emergencyReset
  };
};
