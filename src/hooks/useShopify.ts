
import { useState, useEffect, useCallback, useRef } from 'react';
import { ShopifyProduct } from '@/lib/shopify/types';
import { shopifyStores, shopifySupabase } from '@/lib/shopify/supabase-client';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast } from 'sonner';
import { tokenValidationCache } from '@/lib/shopify/ShopifyConnectionProvider';

// Test store configuration for development
const DEV_TEST_STORE = 'astrem.myshopify.com';
const DEV_TEST_TOKEN = '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';

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
// Cache expiry reduced to 2 minutes
const CACHE_EXPIRY = 2 * 60 * 1000; 

export const useShopify = () => {
  const { shopDomain: shop, isConnected, testConnection, isDevMode } = useShopifyConnection();
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
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  
  // Get access token for the current shop
  const getAccessToken = useCallback(async (shopDomain: string): Promise<string | null> => {
    try {
      if (!shopDomain) return null;
      
      // Development mode test store bypass
      if (isDevMode && shopDomain === DEV_TEST_STORE) {
        console.log(`[DEV MODE] Using hardcoded token for test store: ${DEV_TEST_STORE}`);
        setAccessToken(DEV_TEST_TOKEN);
        return DEV_TEST_TOKEN;
      }
      
      // Generate unique request ID for logging
      const requestId = `get_token_${Math.random().toString(36).substring(2, 8)}`;
      console.log(`[${requestId}] Getting access token for shop: ${shopDomain}`);
      
      const { data, error } = await shopifyStores()
        .select('access_token')
        .eq('shop', shopDomain)
        .single();
        
      if (error || !data?.access_token) {
        console.error(`[${requestId}] Error getting access token:`, error);
        setTokenError(true);
        return null;
      }
      
      // Check if token is placeholder
      if (data.access_token === 'placeholder_token') {
        console.warn(`[${requestId}] Detected placeholder token for shop: ${shopDomain}`);
        setTokenError(true);
        setTokenExpired(true);
        return null;
      }
      
      console.log(`[${requestId}] Successfully retrieved token for: ${shopDomain}`);
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      setTokenError(true);
      return null;
    }
  }, [isDevMode]);
  
  // Reset error states function
  const resetErrorStates = useCallback(() => {
    setTokenError(false);
    setTokenExpired(false);
    setIsNetworkError(false);
  }, []);
  
  // Cancel ongoing requests when unmounting
  useEffect(() => {
    return () => {
      // Abort any pending requests when component unmounts
      abortControllers.current.forEach((controller, key) => {
        console.log(`Aborting request ${key} due to unmount`);
        controller.abort();
      });
      abortControllers.current.clear();
    };
  }, []);
  
  // Load products when connected - use the connection provider for status
  const loadProducts = useCallback(async () => {
    // Development mode bypass for test store
    if (isDevMode && shop === DEV_TEST_STORE) {
      console.log('[DEV MODE] Using mock products for test store');
      
      // Create some mock products for test store in development
      const mockProducts: ShopifyProduct[] = [
        {
          id: 'gid://shopify/Product/1',
          title: '[DEV] Test Product 1',
          handle: 'test-product-1',
          price: '19.99',
          images: [
            'https://via.placeholder.com/800x600?text=Test+Product+1'
          ],
          variants: [
            {
              id: 'gid://shopify/ProductVariant/1',
              title: 'Default',
              price: '19.99',
              available: true
            }
          ]
        },
        {
          id: 'gid://shopify/Product/2',
          title: '[DEV] Test Product 2',
          handle: 'test-product-2',
          price: '29.99',
          images: [
            'https://via.placeholder.com/800x600?text=Test+Product+2'
          ],
          variants: [
            {
              id: 'gid://shopify/ProductVariant/2',
              title: 'Default',
              price: '29.99',
              available: true
            }
          ]
        }
      ];
      
      setProducts(mockProducts);
      
      // Cache the mock products
      const cacheKey = `products:${shop}`;
      productCache.set(cacheKey, { products: mockProducts, timestamp: Date.now() });
      
      return mockProducts;
    }
    
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
    
    // Create a new AbortController for this request
    const abortController = new AbortController();
    const reqId = `req_prod_${Math.random().toString(36).substring(2, 10)}`;
    abortControllers.current.set(reqId, abortController);
    
    // Start a new request and track it
    const requestPromise = (async () => {
      try {
        // Reset error states
        resetErrorStates();
        
        // Verify connection is valid before proceeding
        const connectionValid = await testConnection(false);
        
        if (!connectionValid) {
          throw new Error('Shopify connection validation failed');
        }
        
        // Get token for the current shop
        const token = await getAccessToken(shop);
        
        if (!token) {
          throw new Error('لا يمكن الحصول على رمز الوصول للمتجر');
        }
        
        setAccessToken(token);
        
        console.log(`[${reqId}] Fetching products with request ID: ${reqId}`);
        
        // Call Shopify Products Edge Function
        const { data, error } = await shopifySupabase.functions.invoke('shopify-products', {
          body: { 
            shop, 
            accessToken: token,
            requestId: reqId
          }
          // Remove the signal property as it's not supported in the type
        });
        
        if (error) {
          console.error(`[${reqId}] Error invoking shopify-products function:`, error);
          
          // Retry with API route
          console.log(`[${reqId}] Retrying with API route...`);
          setIsRetrying(true);
          
          // Create a fetch request that we can abort if needed
          const apiResponse = await fetch(`/api/shopify-products?shop=${encodeURIComponent(shop)}&debug=true`, {
            signal: abortController.signal
          });
          
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
            console.error(`[${reqId}] GraphQL errors from Shopify:`, data.errors);
            throw new Error(data.errors[0]?.message || 'GraphQL error');
          }
          throw new Error('Invalid response from Shopify API');
        }
        
        // Clear error states if successful
        resetErrorStates();
        
        // Set and cache products
        setProducts(data.products || []);
        productCache.set(cacheKey, { products: data.products || [], timestamp: now });
        console.log(`[${reqId}] Successfully fetched ${data.products.length} products`);
        
        // Clean up abort controller reference
        abortControllers.current.delete(reqId);
        
        return data.products || [];
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`[${reqId}] Request was aborted`);
          return [];
        }
        
        console.error(`[${reqId}] Error loading products:`, error);
        
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
        
        // Clean up abort controller reference
        abortControllers.current.delete(reqId);
        
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
  }, [isConnected, shop, getAccessToken, testConnection, resetErrorStates, isDevMode]);
  
  // Sync a form with Shopify
  const syncForm = useCallback(async (formData: ShopifyFormSync) => {
    // Development mode bypass for test store
    if (isDevMode && (shop === DEV_TEST_STORE || formData.shopDomain === DEV_TEST_STORE)) {
      console.log('[DEV MODE] Mock form sync for test store:', formData);
      toast.success('تم مزامنة النموذج مع متجر الاختبار (وضع التطوير)');
      return { 
        success: true, 
        message: 'تمت المزامنة بنجاح (وضع التطوير)',
        devMode: true
      };
    }
    
    if (!isConnected && !failSafeMode) {
      throw new Error('Not connected to Shopify');
    }

    const syncRequestId = `sync_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`[${syncRequestId}] Starting form sync`);
    
    setIsSyncing(true);
    try {
      // Reset error states
      resetErrorStates();
      
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
        console.log(`[${syncRequestId}] Form saved for future sync:`, formData);
        return { success: true, message: 'Form saved for future sync' };
      }
      
      // Test connection first
      console.log(`[${syncRequestId}] Testing connection before form sync`);
      const isConnectionValid = await testConnection(true);
      
      if (!isConnectionValid) {
        throw new Error('فشل اختبار اتصال Shopify. يرجى تحديث رمز الوصول الخاص بك.');
      }
      
      // Get token
      console.log(`[${syncRequestId}] Getting token for shop: ${shopDomain}`);
      const token = await getAccessToken(shopDomain);
      
      if (!token) {
        throw new Error('تعذر الحصول على رمز وصول صالح');
      }
      
      // Real sync with Shopify
      console.log(`[${syncRequestId}] Invoking sync form function for formId: ${formData.formId}`);
      const { data, error } = await shopifySupabase.functions.invoke('shopify-sync-form', {
        body: {
          shop: shopDomain,
          formId: formData.formId,
          settings: formData.settings,
          accessToken: token,
          requestId: syncRequestId
        }
      });

      if (error) {
        console.error(`[${syncRequestId}] Sync form error:`, error);
        setIsNetworkError(true);
        throw error;
      }

      console.log(`[${syncRequestId}] Form sync completed successfully`);
      setIsSyncing(false);
      setIsNetworkError(false);
      return data;
    } catch (error) {
      console.error(`[${syncRequestId}] Error syncing form with Shopify:`, error);
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
  }, [isConnected, failSafeMode, shop, getAccessToken, pendingSyncForms, testConnection, resetErrorStates, isDevMode]);

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
      toast.error('لا يمكن إعادة المزامنة أثناء قطع الاتصال');
      return;
    }

    const resyncId = `resync_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`[${resyncId}] Starting resync of pending forms`);
    
    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
      
      if (pendingSyncs.length === 0) {
        toast.info('لا توجد نماذج معلقة للمزامنة');
        setIsSyncing(false);
        return;
      }

      // Verify connection status before attempting resync
      console.log(`[${resyncId}] Verifying connection status before resync`);
      const connectionValid = await testConnection(true);
      
      if (!connectionValid) {
        toast.error('فشل التحقق من الاتصال. يرجى تحديث رمز الوصول الخاص بك.');
        throw new Error('فشل التحقق من الاتصال');
      }

      for (const formData of pendingSyncs) {
        try {
          console.log(`[${resyncId}] Resyncing form ID: ${formData.formId}`);
          await syncForm(formData);
          successCount++;
        } catch (error) {
          console.error(`[${resyncId}] Error resyncing form:`, error);
          failCount++;
        }
      }

      // Clear synced forms
      localStorage.setItem('pending_form_syncs', '[]');
      setPendingSyncForms([]);
      
      toast.success(`تمت إعادة مزامنة ${successCount} نماذج بنجاح${failCount > 0 ? `، فشلت ${failCount} نماذج` : ''}`);
    } catch (error) {
      console.error(`[${resyncId}] Error in resyncPendingForms:`, error);
      toast.error('خطأ في إعادة مزامنة النماذج المعلقة');
      setIsNetworkError(true);
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, shop, syncForm, testConnection]);

  // Load pending syncs on init
  useEffect(() => {
    const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
    const formIds = pendingSyncs.map((sync: ShopifyFormSync) => sync.formId);
    setPendingSyncForms(formIds);
  }, []);

  // Force refresh products (clear cache and reload)
  const refreshProducts = useCallback(async () => {
    // Generate unique request ID
    const refreshId = `refresh_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`[${refreshId}] Starting product refresh`);
    
    // Clear cache for the current shop
    const cacheKey = `products:${shop}`;
    productCache.delete(cacheKey);
    
    // Clear token validation cache to ensure fresh connection test
    if (tokenValidationCache) {
      console.log(`[${refreshId}] Clearing token validation cache`);
      tokenValidationCache.clear();
    }
    
    // Reset error states
    resetErrorStates();
    
    try {
      // Test connection first
      console.log(`[${refreshId}] Testing connection before product refresh`);
      const isValid = await testConnection(true);
      
      if (!isValid) {
        throw new Error('فشل اختبار الاتصال - يرجى التحقق من رمز الوصول الخاص بك');
      }
      
      // Load products
      console.log(`[${refreshId}] Loading products after successful connection test`);
      return await loadProducts();
    } catch (error) {
      console.error(`[${refreshId}] Error refreshing products:`, error);
      toast.error('فشل في تحديث المنتجات: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
      throw error;
    }
  }, [shop, loadProducts, testConnection, resetErrorStates]);

  // Refresh the connection with better error handling
  const refreshConnection = useCallback(async (forceRefresh: boolean = false): Promise<boolean> => {
    const refreshId = `conn_refresh_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`[${refreshId}] Starting connection refresh with forceRefresh=${forceRefresh}`);
    
    try {
      setIsLoading(true);
      resetErrorStates();
      
      // Clear the token validation cache if forcing refresh
      if (forceRefresh && tokenValidationCache) {
        console.log(`[${refreshId}] Clearing token validation cache`);
        tokenValidationCache.clear();
      }
      
      // Test connection with the provided forceRefresh parameter
      console.log(`[${refreshId}] Testing connection`);
      const isValid = await testConnection(forceRefresh);
      
      if (!isValid) {
        setTokenError(true);
        setTokenExpired(true);
        toast.error('فشل اختبار الاتصال. يرجى تحديث رمز الوصول.');
        return false;
      }
      
      // Clear product cache
      if (shop) {
        const cacheKey = `products:${shop}`;
        console.log(`[${refreshId}] Clearing product cache for ${shop}`);
        productCache.delete(cacheKey);
      }
      
      // Load products to verify connection is working
      try {
        console.log(`[${refreshId}] Loading products to verify connection`);
        await loadProducts();
        toast.success('تم تحديث الاتصال بنجاح');
        return true;
      } catch (loadError) {
        console.error(`[${refreshId}] Error loading products after connection refresh:`, loadError);
        toast.error('نجح اختبار الاتصال ولكن فشل تحميل المنتجات');
        return false;
      }
    } catch (error) {
      console.error(`[${refreshId}] Error refreshing connection:`, error);
      setTokenError(true);
      setIsNetworkError(true);
      toast.error('خطأ في تحديث الاتصال: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [shop, testConnection, loadProducts, resetErrorStates]);

  // Emergency reset for recovery
  const emergencyReset = useCallback(() => {
    console.log('Performing emergency reset of all Shopify connection data');
    
    // Clear all Shopify-related localStorage items
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_token');
    localStorage.removeItem('shopify_failsafe');
    localStorage.removeItem('pending_form_syncs');
    localStorage.removeItem('shopify_recovery_mode');
    localStorage.removeItem('shopify_last_url_shop');
    
    // Clear all token validation cache
    if (tokenValidationCache) {
      tokenValidationCache.clear();
    }
    
    // Reset state
    resetErrorStates();
    setFailSafeMode(false);
    setPendingSyncForms([]);
    
    // Clear product cache
    productCache.clear();
    
    toast.success('تم إعادة تعيين حالة الاتصال بنجاح');
    return true;
  }, [resetErrorStates]);

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
    isDevMode, // Export the dev mode flag
    toggleFailSafeMode,
    loadProducts,
    syncForm,
    syncFormWithShopify,
    resyncPendingForms,
    emergencyReset,
    testConnection,
    refreshProducts,
    getAccessToken,
    refreshConnection
  };
};

// Share the productCache with the rest of the application
export const clearShopifyCache = () => {
  productCache.clear();
  
  // Also clear token validation cache if imported
  if (tokenValidationCache) {
    tokenValidationCache.clear();
  }
};

