
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
  const { shopDomain: shop, isConnected, testConnection } = useShopifyConnection();
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
  
  // Get access token for the current shop
  const getAccessToken = useCallback(async (shopDomain: string): Promise<string | null> => {
    try {
      if (!shopDomain) return null;
      
      const { data, error } = await shopifyStores()
        .select('access_token')
        .eq('shop', shopDomain)
        .single();
        
      if (error || !data?.access_token) {
        console.error('Error getting access token:', error);
        setTokenError(true);
        return null;
      }
      
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      setTokenError(true);
      return null;
    }
  }, []);
  
  // Load products when connected - use the connection provider for status
  const loadProducts = useCallback(async () => {
    if (!isConnected || !shop) {
      console.log('Cannot load products: no active connection or shop');
      return [];
    }

    // Check if already loaded and cached
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
        // Get token for the current shop
        const token = await getAccessToken(shop);
        
        if (!token) {
          throw new Error('لا يمكن الحصول على رمز الوصول للمتجر');
        }
        
        setAccessToken(token);
        
        // Generate unique request ID
        const requestId = `req_prod_${Math.random().toString(36).substring(2, 10)}`;
        
        console.log('Fetching products with request ID:', requestId);
        
        // Call Shopify Products Edge Function
        const { data, error } = await shopifySupabase.functions.invoke('shopify-products', {
          body: { 
            shop, 
            accessToken: token,
            requestId
          }
        });
        
        if (error) {
          console.error('Error invoking shopify-products function:', error);
          
          // Retry with API route
          console.log('Retrying with API route...');
          setIsRetrying(true);
          
          const apiResponse = await fetch(`/api/shopify-products?shop=${encodeURIComponent(shop)}&debug=true`);
          
          if (!apiResponse.ok) {
            throw new Error(`API route returned status: ${apiResponse.status}`);
          }
          
          const apiData = await apiResponse.json();
          
          if (apiData.error) {
            throw new Error(apiData.error.message || 'API error');
          }
          
          if (apiData.products) {
            setProducts(apiData.products);
            productCache.set(cacheKey, { products: apiData.products, timestamp: now });
            return apiData.products;
          } else {
            throw new Error('No products returned from API route');
          }
        }

        if (!data || !data.success || !data.products) {
          if (data?.errors) {
            console.error('GraphQL errors from Shopify:', data.errors);
            throw new Error(data.errors[0]?.message || 'GraphQL error');
          }
          throw new Error('Invalid response from Shopify API');
        }
        
        // Clear error states if successful
        setTokenError(false);
        setTokenExpired(false);
        setIsNetworkError(false);
        
        // Set and cache products
        setProducts(data.products || []);
        productCache.set(cacheKey, { products: data.products || [], timestamp: now });
        console.log(`Successfully fetched ${data.products.length} products`);
        
        return data.products || [];
      } catch (error) {
        console.error('Error loading products:', error);
        
        // Handle different error types
        if (error instanceof Error) {
          if (error.message.includes('token') || error.message.includes('auth')) {
            setTokenError(true);
            setTokenExpired(true);
          } else {
            setIsNetworkError(true);
          }
        } else {
          setIsNetworkError(true);
        }
        
        throw error;
      } finally {
        setIsLoading(false);
        setIsRetrying(false);
        requestsInProgress.delete(cacheKey);
      }
    })();
    
    // Store the promise for deduplication
    requestsInProgress.set(cacheKey, requestPromise);
    
    return requestPromise;
  }, [isConnected, shop, getAccessToken]);

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
      
      // Get token
      const token = await getAccessToken(shopDomain);
      
      if (!token) {
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
          accessToken: token,
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
  }, [isConnected, failSafeMode, shop, getAccessToken, pendingSyncForms]);

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

  // Force refresh products (clear cache and reload)
  const refreshProducts = useCallback(async () => {
    // Clear cache for the current shop
    const cacheKey = `products:${shop}`;
    productCache.delete(cacheKey);
    
    // Reset error states
    setTokenError(false);
    setTokenExpired(false);
    setIsNetworkError(false);
    
    try {
      // Test connection first
      const isValid = await testConnection();
      
      if (!isValid) {
        throw new Error('Connection test failed - please check your access token');
      }
      
      // Load products
      return await loadProducts();
    } catch (error) {
      console.error('Error refreshing products:', error);
      toast.error('فشل في تحديث المنتجات: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
      throw error;
    }
  }, [shop, loadProducts, testConnection]);

  // Add the missing refreshConnection method
  const refreshConnection = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setTokenError(false);
      setTokenExpired(false);
      setIsNetworkError(false);
      
      // Test connection first to validate current token
      const isValid = await testConnection(true); // Force token refresh
      
      if (!isValid) {
        setTokenError(true);
        setTokenExpired(true);
        return false;
      }
      
      // Clear product cache
      if (shop) {
        const cacheKey = `products:${shop}`;
        productCache.delete(cacheKey);
      }
      
      // Load products to verify connection is working
      try {
        await loadProducts();
        toast.success('تم تحديث الاتصال بنجاح');
        return true;
      } catch (loadError) {
        console.error('Error loading products after connection refresh:', loadError);
        return false;
      }
    } catch (error) {
      console.error('Error refreshing connection:', error);
      setTokenError(true);
      setIsNetworkError(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [shop, testConnection, loadProducts]);

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
    syncFormWithShopify,
    resyncPendingForms,
    emergencyReset,
    testConnection,
    refreshProducts,
    getAccessToken,
    // Add the refreshConnection method to the returned object
    refreshConnection
  };
};
