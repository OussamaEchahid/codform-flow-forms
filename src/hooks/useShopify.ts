import { useState, useEffect, useCallback, useRef } from 'react';
import { ShopifyProduct, ShopifyUser } from '@/lib/shopify/types';
import { shopifyStores, shopifySupabase } from '@/lib/shopify/supabase-client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { toast } from 'sonner';
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
  };
}

interface CachedFormResult {
  data: any;
  timestamp: number;
}

export const useShopify = () => {
  const { shop, user: authUser } = useAuth();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [allProducts, setAllProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [shopifyAPI, setShopifyAPI] = useState<any>(null);
  const [pendingSyncForms, setPendingSyncForms] = useState<string[]>([]);
  const [user, setUser] = useState<ShopifyUser | null>(null);
  
  // Recovery mode - for handling errors gracefully
  const [failSafeMode, setFailSafeMode] = useState(() => {
    return localStorage.getItem('shopify_failsafe') === 'true';
  });

  // Add a ref to track if we've already checked for the default form
  const defaultFormChecked = useRef(false);
  // Use a ref to prevent redundant calls in the same session
  const requestInProgress = useRef(false);
  // Add cache to prevent excessive API calls
  const defaultFormCache = useRef<{
    [shopId: string]: CachedFormResult
  }>({});
  // Add a cooldown mechanism
  const lastRequestTime = useRef<{[key: string]: number}>({});

  // Set the user from auth context
  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name,
        role: authUser.user_metadata?.role || 'user'
      });
    } else {
      // Try to get user from localStorage as fallback
      const storedUser = localStorage.getItem('shopify_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse stored user:', e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
  }, [authUser]);

  // Initialize connection state with enhanced verification and fail-safe reset
  useEffect(() => {
    const checkConnection = async () => {
      if (!shop) {
        setIsConnected(false);
        return;
      }

      try {
        console.log(`🔍 Checking connection for shop: ${shop}`);
        
        // Reset error states at the beginning of check
        setTokenError(false);
        setFailSafeMode(false);
        localStorage.removeItem('shopify_failsafe');
        
        // Try to get token via secure RPC
        const { data: token, error } = await (shopifySupabase as any)
          .rpc('get_store_access_token', { p_shop: shop });

        if (error) {
          console.error(`❌ Error fetching token for ${shop}:`, error);
          setIsConnected(false);
          setTokenError(true);
          return;
        }

        if (token) {
          console.log(`✅ Store ${shop} found in database`);
          setAccessToken(token as string);
          setIsConnected(true);
          setTokenError(false);
          setFailSafeMode(false);
          // إزالة أي fail-safe modes محفوظة
          localStorage.removeItem('shopify_failsafe');
          localStorage.removeItem('shopify_token_error');
          console.log(`🔑 Valid token set for ${shop}, error states cleared`);
          return;
        }

        console.warn(`⚠️ No active store found for ${shop}`);
        setIsConnected(false);
        setTokenError(true);
      } catch (error) {
        console.error(`❌ Error in checkConnection for ${shop}:`, error);
        setIsConnected(false);
        setTokenError(true);
      }
    };

    checkConnection();
  }, [shop]);

  // Cache للمنتجات لتجنب الاستدعاءات المتكررة
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

  // Enhanced loadProducts with better error handling and immediate loading
  const loadProducts = useCallback(async (forceRefresh = false) => {
    if (!shop) {
      console.warn('No shop provided to loadProducts');
      return [];
    }

    // Always load if we don't have products or force refresh
    if (!forceRefresh && products.length > 0) {
      const now = Date.now();
      if ((now - lastLoadTime) < CACHE_DURATION) {
        console.log(`📦 Using cached products for ${shop}`);
        return products;
      }
    }

    if (isLoading && !forceRefresh) {
      console.log(`⏳ Already loading products for ${shop}, returning current products`);
      return products;
    }

    setIsLoading(true);
    setTokenError(false); // Reset error state
    
    try {
      console.log(`🔄 Loading products for shop: ${shop}${forceRefresh ? ' (forced)' : ''}`);
      
      // Get token with enhanced error handling
      const { data: token, error: tokenError } = await (shopifySupabase as any)
        .rpc('get_store_access_token', { p_shop: shop });

      if (tokenError) {
        console.error(`❌ Token fetch error for ${shop}:`, tokenError);
        throw new Error(`Database error: ${tokenError.message}`);
      }

      if (!token || (typeof token === 'string' && token.length === 0)) {
        console.error(`❌ Access token missing or invalid for shop: ${shop}`);
        throw new Error(`TOKEN_MISSING:${shop}`);
      }

      const tokenValue = token as string;
      console.log(`📡 Fetching products for ${shop} with valid token`);
      
      // Fetch products using edge function with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000);
      });

      const fetchPromise = shopifySupabase.functions.invoke('shopify-products', {
        body: { 
          shop, 
          accessToken: token,
          refresh: forceRefresh,
          includeTestProducts: false,
          limit: 50
        }
      });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error(`❌ Products fetch error for ${shop}:`, error);
        throw error;
      }

      if (!data) {
        throw new Error('No response data received');
      }

      if (!data.success) {
        console.error(`❌ API error for ${shop}:`, data.error || data.message);
        throw new Error(data.error || data.message || 'API request failed');
      }

      const fetchedProducts = data?.products || [];
      
      if (Array.isArray(fetchedProducts)) {
        const now = Date.now();
        setAllProducts(fetchedProducts);
        setProducts(fetchedProducts);
        setLastLoadTime(now);
        setIsConnected(true);
        setTokenError(false);
        
        console.log(`✅ Successfully loaded ${fetchedProducts.length} products for ${shop}`);
        
        if (fetchedProducts.length === 0) {
          console.warn(`⚠️ No products returned for ${shop} - store might be empty`);
        }
        
        setIsLoading(false);
        return fetchedProducts;
      } else {
        console.error(`❌ Invalid product data structure for ${shop}:`, fetchedProducts);
        throw new Error('Invalid product data structure returned');
      }
      
    } catch (error) {
      console.error(`❌ Error loading products for ${shop}:`, error);
      setIsLoading(false);
      setTokenError(true);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('timeout')) {
        toast.error(`انتهت مهلة الاتصال بمتجر ${shop}. يرجى المحاولة مرة أخرى`, {
          duration: 5000
        });
      } else if (errorMessage.startsWith('STORE_NOT_FOUND:')) {
        const shopName = errorMessage.split(':')[1];
        toast.error(`المتجر ${shopName} غير موجود أو غير نشط في قاعدة البيانات`, {
          duration: 8000
        });
      } else if (errorMessage.startsWith('TOKEN_MISSING:')) {
        const shopName = errorMessage.split(':')[1];
        toast.error(`رمز الوصول مفقود للمتجر ${shopName}`, {
          duration: 8000
        });
      } else {
        toast.error(`فشل في تحميل المنتجات: ${errorMessage}`, {
          duration: 6000
        });
      }
      
      // Keep existing products if available and this wasn't a forced refresh
      if (!forceRefresh && products.length > 0) {
        console.log('🔄 Keeping existing products after error');
        return products;
      }
      
      return [];
    }
  }, [shop, products, lastLoadTime, isLoading]);

  // Test connection
  const testConnection = useCallback(async (withRetry = false) => {
    if (!shop) return false;
    
    if (withRetry) {
      setIsRetrying(true);
    }
    
    try {
      // Get token
      const { data: token, error: tokenError } = await (shopifySupabase as any)
        .rpc('get_store_access_token', { p_shop: shop });

      if (tokenError || !token) {
        throw new Error('Token not found');
      }

      // Test token with a simple API call
      const { data, error } = await shopifySupabase.functions.invoke('shopify-test-connection', {
        body: { shop, accessToken: token as string }
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

  // Sync a form with Shopify - updated to handle automatic form-product association
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
      return data;
    } catch (error) {
      console.error('Error syncing form with Shopify:', error);
      setIsSyncing(false);
      
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

  // Get default form for a shop with improved caching and cooldown
  const getDefaultForm = useCallback(async (shopDomain?: string) => {
    const targetShop = shopDomain || shop;
    if (!targetShop) {
      console.warn('No shop provided to getDefaultForm');
      return null;
    }

    // Add request tracking and cooldown
    const now = Date.now();
    const lastRequest = lastRequestTime.current[targetShop] || 0;
    const cooldownPeriod = 10000; // 10 seconds cooldown
    
    // Log detailed information about the request state for debugging
    console.log('Default form request state:', {
      targetShop,
      hasCache: !!defaultFormCache.current[targetShop],
      cacheAge: defaultFormCache.current[targetShop] 
        ? now - defaultFormCache.current[targetShop].timestamp 
        : 'no cache',
      timeSinceLastRequest: now - lastRequest,
      inProgress: requestInProgress.current,
      cooldownActive: (now - lastRequest < cooldownPeriod)
    });

    // Prevent excessive requests with cooldown
    if (now - lastRequest < cooldownPeriod) {
      console.log(`Cooldown active (${(now - lastRequest)/1000}s < ${cooldownPeriod/1000}s), using cached result`);
      return defaultFormCache.current[targetShop]?.data || null;
    }

    // Prevent concurrent requests
    if (requestInProgress.current) {
      console.log('Request already in progress, using cached result if available');
      return defaultFormCache.current[targetShop]?.data || null;
    }

    // Check if we have a valid cached result (less than 5 minutes old)
    const cachedResult = defaultFormCache.current[targetShop];
    if (cachedResult && (now - cachedResult.timestamp) < 300000) {
      console.log('Using cached default form result for', targetShop);
      return cachedResult.data;
    }

    try {
      // Update tracking before making request
      requestInProgress.current = true;
      lastRequestTime.current[targetShop] = now;
      
      console.log(`Fetching default form for shop ${targetShop}`);
      
      // Get the most recently updated form for this shop
      const { data, error } = await shopifySupabase
        .from('forms')
        .select('*')
        .eq('shop_id', targetShop)
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error getting default form:', error);
        return null;
      }

      const result = data && data.length > 0 ? data[0] : null;
      
      // Cache the result with a timestamp
      defaultFormCache.current[targetShop] = {
        data: result,
        timestamp: now
      };
      
      // Also store in localStorage for persistence across refreshes
      try {
        if (result) {
          localStorage.setItem(`default_form_${targetShop}`, JSON.stringify({
            ...result,
            cacheTime: now
          }));
        }
      } catch (e) {
        console.warn('Error storing form in localStorage:', e);
      }
      
      // Mark that we've checked for the default form
      defaultFormChecked.current = true;
      
      console.log('Default form found:', result?.id || 'none');
      return result;
    } catch (error) {
      console.error('Exception in getDefaultForm:', error);
      return null;
    } finally {
      // Reset the request flag after a short delay to prevent immediate retries
      setTimeout(() => {
        requestInProgress.current = false;
      }, 1000);
    }
  }, [shop]);

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
    
    // Clear form caches
    Object.keys(defaultFormCache.current).forEach(key => {
      localStorage.removeItem(`default_form_${key}`);
    });
    
    // Reset state
    setIsConnected(false);
    setTokenError(false);
    setTokenExpired(false);
    setFailSafeMode(false);
    setPendingSyncForms([]);
    defaultFormCache.current = {};
    lastRequestTime.current = {};
    
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
    allProducts,
    shop,
    user,
    error: tokenError,
    failSafeMode,
    pendingSyncForms,
    toggleFailSafeMode,
    loadProducts,
    testConnection,
    refreshConnection,
    syncForm,
    syncFormWithShopify,
    resyncPendingForms,
    emergencyReset,
    getDefaultForm,
  };
};
