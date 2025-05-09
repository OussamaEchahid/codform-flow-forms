
import { useState, useEffect, useCallback } from 'react';
import { ShopifyProduct } from '@/lib/shopify/types';
import { shopifyStores, shopifySupabase } from '@/lib/shopify/supabase-client';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast } from 'sonner';

interface ShopifyFormSync {
  formId: string;
  shopDomain?: string;
  settings?: {
    position?: 'product-page' | 'cart-page' | 'checkout';
    blockId?: string;
    products?: string[];
  };
}

// Cache for API responses to reduce redundant calls
const productCache = new Map<string, { products: ShopifyProduct[], timestamp: number }>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const useShopify = () => {
  const { shopDomain: shop, isConnected } = useShopifyConnection();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [shopifyAPI, setShopifyAPI] = useState<any>(null);
  const [pendingSyncForms, setPendingSyncForms] = useState<string[]>([]);
  const [isNetworkError, setIsNetworkError] = useState(false);
  
  // Recovery mode - for handling errors gracefully
  const [failSafeMode, setFailSafeMode] = useState(() => {
    return localStorage.getItem('shopify_failsafe') === 'true';
  });

  // Rate limiting for API calls
  const requestsInProgress = new Map<string, Promise<any>>();
  
  // Test connection with the Shopify API
  const testConnection = useCallback(async (force = false) => {
    if (!shop) return false;
    
    try {
      const cacheKey = `connection_test:${shop}`;
      const cachedResult = localStorage.getItem(cacheKey);
      
      // Use cached result unless forced refresh
      if (!force && cachedResult) {
        const { isValid, timestamp } = JSON.parse(cachedResult);
        const now = Date.now();
        // Cache valid for 5 minutes
        if (now - timestamp < 5 * 60 * 1000) {
          return isValid;
        }
      }
      
      // Get token
      const { data: tokenData, error: tokenError } = await shopifyStores()
        .select('access_token')
        .eq('shop', shop)
        .single();
        
      if (tokenError || !tokenData?.access_token) {
        setTokenError(true);
        return false;
      }
      
      // Test token
      const { data, error } = await shopifySupabase.functions.invoke('shopify-test-connection', {
        body: { 
          shop, 
          accessToken: tokenData.access_token,
          timestamp: Date.now(), // Prevent caching
          requestId: `conn_test_${Math.random().toString(36).substring(2, 10)}`
        }
      });
      
      if (error) {
        console.error('[Shopify Connection] Test error:', error);
        setIsNetworkError(true);
        return false;
      }
      
      const isValid = data?.success === true;
      
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({
        isValid,
        timestamp: Date.now()
      }));
      
      if (!isValid) {
        setTokenError(true);
      } else {
        setTokenError(false);
      }
      
      return isValid;
    } catch (error) {
      console.error('[Shopify Connection] Test error:', error);
      setIsNetworkError(true);
      return false;
    }
  }, [shop]);
  
  // Refresh connection with Shopify
  const refreshConnection = useCallback(async () => {
    if (!shop) return false;
    
    try {
      // Clear any cached connection test results
      localStorage.removeItem(`connection_test:${shop}`);
      
      // Test connection with force refresh
      const isValid = await testConnection(true);
      
      if (isValid) {
        // Clear error states
        setTokenError(false);
        setTokenExpired(false);
        setIsNetworkError(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[Shopify Connection] Refresh error:', error);
      setIsNetworkError(true);
      return false;
    }
  }, [shop, testConnection]);

  // Load products when connected - use the connection provider for status
  const loadProducts = useCallback(async () => {
    if (!isConnected || !shop) {
      return [];
    }

    // Check cache first
    const cacheKey = `products:${shop}`;
    const cached = productCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < CACHE_EXPIRY)) {
      console.log('Using cached products data');
      setProducts(cached.products);
      return cached.products;
    }
    
    // Check if request is already in progress
    if (requestsInProgress.has(cacheKey)) {
      console.log('Product request already in progress, waiting...');
      try {
        const result = await requestsInProgress.get(cacheKey);
        return result;
      } catch (error) {
        console.error('Error waiting for in-progress request:', error);
        throw error;
      }
    }

    setIsLoading(true);
    
    // Start a new request and track it
    const requestPromise = (async () => {
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
        
        // Add a unique request ID and timestamp for debugging
        const requestId = `req_prod_${Math.random().toString(36).substring(2, 10)}`;
        
        // Fetch products using edge function
        const { data, error } = await shopifySupabase.functions.invoke('shopify-products', {
          body: { 
            shop, 
            accessToken: token,
            requestId
          }
        });

        if (error) {
          setIsNetworkError(true);
          throw error;
        }

        if (!data || !data.products) {
          console.error('Invalid product data returned:', data);
          throw new Error('No products data returned from Shopify API');
        }
        
        setIsNetworkError(false);
        setProducts(data.products || []);
        
        // Cache the results
        productCache.set(cacheKey, { 
          products: data.products || [], 
          timestamp: Date.now() 
        });
        
        return data.products || [];
      } catch (error) {
        console.error('Error loading products:', error);
        setTokenError(true);
        setIsNetworkError(true);
        throw error;
      } finally {
        setIsLoading(false);
        // Remove the tracked promise
        requestsInProgress.delete(cacheKey);
      }
    })();
    
    // Store the promise for deduplication
    requestsInProgress.set(cacheKey, requestPromise);
    
    return requestPromise;
  }, [isConnected, shop]);

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
      
      // First verify token is valid
      const { data: tokenData, error: tokenError } = await shopifyStores()
        .select('access_token')
        .eq('shop', shopDomain)
        .single();
        
      if (tokenError || !tokenData?.access_token) {
        throw new Error('Could not retrieve valid access token');
      }
      
      // Add a unique request ID for debugging
      const requestId = `req_sync_${Math.random().toString(36).substring(2, 10)}`;

      // Real sync with Shopify
      const { data, error } = await shopifySupabase.functions.invoke('shopify-sync-form', {
        body: {
          shop: shopDomain,
          formId: formData.formId,
          settings: formData.settings,
          accessToken: tokenData.access_token,
          requestId
        }
      });

      if (error) {
        setIsNetworkError(true);
        throw error;
      }

      setIsSyncing(false);
      setIsNetworkError(false);
      return data;
    } catch (error) {
      console.error('Error syncing form with Shopify:', error);
      setIsSyncing(false);
      setIsNetworkError(true);
      
      // If sync fails, store pending sync
      const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
      pendingSyncs.push(formData);
      localStorage.setItem('pending_form_syncs', JSON.stringify(pendingSyncs));
      
      // Update state
      setPendingSyncForms([...pendingSyncForms, formData.formId]);
      
      throw error;
    }
  }, [isConnected, failSafeMode, shop, pendingSyncForms]);

  // Alias for syncForm for compatibility
  const syncFormWithShopify = syncForm;

  // Toggle fail-safe mode
  const toggleFailSafeMode = useCallback((value?: boolean) => {
    const newValue = value !== undefined ? value : !failSafeMode;
    setFailSafeMode(newValue);
    localStorage.setItem('shopify_failsafe', newValue ? 'true' : 'false');
  }, [failSafeMode]);

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
      setIsNetworkError(true);
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
    setTokenError(false);
    setTokenExpired(false);
    setFailSafeMode(false);
    setPendingSyncForms([]);
    setIsNetworkError(false);
    
    // Clear product cache
    productCache.clear();
    
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
    isNetworkError,
    toggleFailSafeMode,
    loadProducts,
    syncForm,
    syncFormWithShopify, // Alias for compatibility
    resyncPendingForms,
    emergencyReset,
    testConnection, // Add missing method
    refreshConnection // Add missing method
  };
};
