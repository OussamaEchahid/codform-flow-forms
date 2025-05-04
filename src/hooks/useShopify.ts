import { useState, useEffect, useCallback } from 'react';
import { createShopifyAPI } from '@/lib/shopify/api';
import { ShopifyProduct, ShopifyFormData, ProductSettingsRequest } from '@/lib/shopify/types';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { saveProductSettings } from '@/pages/api/shopify/product-settings';

export const useShopify = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tokenError, setTokenError] = useState<boolean>(false);
  const [tokenExpired, setTokenExpired] = useState<boolean>(false);
  const [lastTokenCheck, setLastTokenCheck] = useState<number>(0);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [failSafeMode, setFailSafeMode] = useState(false);
  const { shop, shopifyConnected, setShop } = useAuth();

  // Reset error states when shop changes
  useEffect(() => {
    if (shopifyConnected && shop) {
      setTokenError(false);
      setTokenExpired(false);
      setError(null);
      setFailSafeMode(false);
      setAutoRetryCount(0);
      
      // After connection, test if the token works
      setTimeout(() => {
        testConnection();
      }, 500);
    }
  }, [shopifyConnected, shop]);

  // Fetch products when shop changes
  useEffect(() => {
    if (shopifyConnected && shop) {
      fetchProducts();
    } else {
      // Reset products when disconnected
      setProducts([]);
    }
  }, [shopifyConnected, shop]);

  // Enhanced testConnection with more detailed logging and diagnostics
  const testConnection = useCallback(async () => {
    if (!shopifyConnected && !shop) {
      console.log("Cannot test connection: No shop connected in context");
      
      // Try to use localStorage as fallback
      const localShop = localStorage.getItem('shopify_store');
      const localConnected = localStorage.getItem('shopify_connected') === 'true';
      
      if (!localShop || !localConnected) {
        console.log("No shop found in localStorage either");
        return false;
      }
      
      console.log("Using localStorage shop for connection test:", localShop);
      // Continue with local shop
    }

    try {
      console.log(`Testing connection for shop: ${shop || localStorage.getItem('shopify_store')}`);
      
      const actualShop = shop || localStorage.getItem('shopify_store');
      if (!actualShop) {
        console.log("No shop identified for connection test");
        return false;
      }
      
      // Get the store access token with detailed logging
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at, token_type')
        .eq('shop', actualShop)
        .single();
      
      if (storeError) {
        console.error('Store access token error:', storeError);
        console.log("Testing if shop exists but is not active...");
        
        // Try to find shop regardless of active status
        const { data: inactiveStores, error: inactiveError } = await supabase
          .from('shopify_stores')
          .select('access_token, updated_at, is_active')
          .eq('shop', actualShop);
          
        if (inactiveError) {
          console.error("Failed to check for inactive stores:", inactiveError);
          return false;
        }
        
        if (inactiveStores && inactiveStores.length > 0) {
          console.log(`Found ${inactiveStores.length} records for shop ${actualShop}, but none active`);
          
          // Try to reactivate the most recent store
          const mostRecent = inactiveStores.sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )[0];
          
          if (mostRecent && mostRecent.access_token) {
            console.log("Attempting to reactivate most recent store record");
            
            // Update the store to be active
            await supabase
              .from('shopify_stores')
              .update({ is_active: true })
              .eq('access_token', mostRecent.access_token);
              
            // Try using this token
            const reactivatedApi = createShopifyAPI(mostRecent.access_token, actualShop);
            
            try {
              await reactivatedApi.verifyConnection();
              console.log("Reactivated store connection successfully");
              return true;
            } catch (reactiveError) {
              console.error("Reactivation failed:", reactiveError);
            }
          }
        }
        
        return false;
      }
      
      if (!storeData || !storeData.access_token) {
        console.error('Store access token not found');
        return false;
      }
      
      console.log('Access token found, testing API connection...');
      
      // Create API instance and test connection with retry logic
      const api = createShopifyAPI(storeData.access_token, actualShop);
      
      try {
        await api.verifyConnection();
        console.log("Connection verified successfully on first attempt");
        return true;
      } catch (verificationError) {
        console.error('First connection attempt failed, retrying...', verificationError);
        
        // Try again after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          // Second attempt
          await api.verifyConnection();
          console.log("Connection verified successfully on second attempt");
          return true;
        } catch (retryError) {
          console.error('Second connection attempt also failed:', retryError);
          
          // Try one last desperate measure - check if form function exists
          try {
            const { data: functionCheck } = await supabase.rpc(
              'function_exists',
              { function_name: 'create_form_with_shop' }
            );
            
            if (!functionCheck) {
              console.log("Form creation function doesn't exist, trying to create it...");
              
              // Try to update schema through function call
              await supabase.functions.invoke('update-schema', {
                body: { force_update: true }
              });
              
              console.log("Schema update attempted");
            }
          } catch (functionCheckError) {
            console.error("Function check failed:", functionCheckError);
          }
          
          return false;
        }
      }
    } catch (err) {
      console.error('Connection test failed:', err);
      return false;
    }
  }, [shop, shopifyConnected]);

  // Enhanced fetchProducts with better error handling and fail-safe mode
  const fetchProducts = useCallback(async () => {
    if (!shopifyConnected && !shop) {
      setError('Shopify connection not established');
      return;
    }

    // Use cached products if in fail-safe mode to prevent repeated errors
    if (failSafeMode && products.length > 0) {
      console.log('Using cached products in fail-safe mode');
      return;
    }

    // Avoid repeated attempts in a short timeframe
    const now = Date.now();
    if (tokenError && (now - lastTokenCheck < 60000)) {
      console.log('Skipping fetch due to recent token error:', 
        (now - lastTokenCheck) / 1000, 'seconds since last check');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastTokenCheck(Date.now());
    
    try {
      console.log(`Fetching products for shop: ${shop || 'unknown shop'}`);
      
      const actualShop = shop || localStorage.getItem('shopify_store');
      if (!actualShop) {
        throw new Error('No shop identified for product fetch');
      }
      
      // Get the store access token
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at, token_type')
        .eq('shop', actualShop)
        .single();
      
      if (storeError) {
        console.error('Store access token error:', storeError);
        
        // Enter fail-safe mode instead of throwing error
        setTokenError(true);
        setFailSafeMode(true);
        console.log('Entering fail-safe mode due to token retrieval error');
        return;
      }

      if (!storeData || !storeData.access_token) {
        console.error('Store access token not found');
        
        // Enter fail-safe mode
        setTokenError(true);
        setFailSafeMode(true);
        console.log('Entering fail-safe mode due to missing token');
        return;
      }
      
      // Check token age
      const tokenUpdatedAt = new Date(storeData.updated_at);
      const currentDate = new Date();
      const daysSinceUpdate = Math.floor((currentDate.getTime() - tokenUpdatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get token type with default fallback to 'offline'
      const tokenType = storeData.token_type || 'offline';
      console.log(`Token is ${daysSinceUpdate} days old. Type: ${tokenType}`);
      
      // For online tokens, they expire much faster
      if (tokenType !== 'offline' && daysSinceUpdate > 1) {
        console.warn('Online token is older than 1 day, likely expired');
        
        // Enter fail-safe mode for UI
        setTokenExpired(true);
        setFailSafeMode(true);
        console.log('Entering fail-safe mode due to expired token');
        
        if (!isAutoRefreshing && autoRetryCount < 2) {
          // Try auto-refreshing the token
          setIsAutoRefreshing(true);
          setAutoRetryCount(prev => prev + 1);
          
          try {
            await refreshConnection();
            // Wait for reconnection to complete
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Try fetching again with new token
            await fetchProducts();
            return;
          } catch (refreshError) {
            console.error('Auto-refresh failed:', refreshError);
          } finally {
            setIsAutoRefreshing(false);
          }
        }
        
        return;
      }
      
      // For offline tokens, they should last much longer but we still check
      if (tokenType === 'offline' && daysSinceUpdate > 14) {
        console.warn('Offline token is older than 14 days, may need refresh');
      }
      
      console.log('Access token retrieved successfully, last updated:', storeData.updated_at);

      // Create API instance with token and shop domain
      const api = createShopifyAPI(storeData.access_token, actualShop);
      
      // Try to fetch products with retry logic
      try {
        // Verify connection before fetching products
        await api.verifyConnection();
        
        const fetchedProducts = await api.getProducts();
        console.log(`Retrieved ${fetchedProducts.length} products`);
        setProducts(fetchedProducts);
        
        // Clear errors on successful fetch
        setTokenError(false);
        setTokenExpired(false);
        setError(null);
        setFailSafeMode(false);
      } catch (apiError) {
        console.error('API call failed, retrying...', apiError);
        
        // Try again after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          // Second attempt to verify connection
          await api.verifyConnection();
          
          // If verification succeeds, try products again
          const fetchedProducts = await api.getProducts();
          console.log(`Retrieved ${fetchedProducts.length} products on retry`);
          setProducts(fetchedProducts);
          
          // Clear errors on successful fetch
          setTokenError(false);
          setTokenExpired(false);
          setError(null);
          setFailSafeMode(false);
        } catch (retryError) {
          console.error('Second API attempt also failed:', retryError);
          
          // Enter fail-safe mode and preserve any cached products
          setFailSafeMode(true);
          setTokenError(true);
          
          const errorMessage = retryError instanceof Error ? retryError.message : 'Failed to fetch products after retry';
          setError(errorMessage);
          
          // Don't update the UI with an error toast in fail-safe mode
          console.log('Entering fail-safe mode to allow continued operation');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      console.error('Error fetching products:', err);
      
      // Enter fail-safe mode
      setFailSafeMode(true);
      console.log('Entering fail-safe mode due to fetch error');
      
      // Determine if error is token-related
      if (errorMessage.includes('Authentication error') || 
          errorMessage.includes('access token') ||
          errorMessage.includes('Received HTML') ||
          errorMessage.includes('401') ||
          errorMessage.includes('403')) {
        
        setTokenError(true);
        setTokenExpired(true);
        
        // Try automatic refresh if not already trying
        if (!isAutoRefreshing && autoRetryCount < 2) {
          setIsAutoRefreshing(true);
          setAutoRetryCount(prev => prev + 1);
          
          try {
            console.log('Attempting automatic token refresh...');
            await refreshConnection();
            
            // Wait for refresh to complete
            toast.info('جاري تحديث الاتصال تلقائيًا...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Try again with new token
            await fetchProducts();
          } catch (refreshError) {
            console.error('Auto-refresh failed:', refreshError);
          } finally {
            setIsAutoRefreshing(false);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [shop, shopifyConnected, tokenError, lastTokenCheck, autoRetryCount, isAutoRefreshing, products, failSafeMode]);

  // Improved refreshConnection with better error handling
  const refreshConnection = useCallback(async () => {
    if (!shop) {
      const localStorageShop = localStorage.getItem('shopify_store');
      if (!localStorageShop) {
        throw new Error('No shop identified for connection refresh');
      }
      // Use shop from localStorage if context is empty
      setShop(localStorageShop);
    }
    
    const actualShop = shop || localStorage.getItem('shopify_store');
    
    setIsLoading(true);
    try {
      console.log(`Refreshing connection for shop: ${actualShop}`);
      
      // Clear any cached data related to the connection
      localStorage.removeItem('shopify_force_refresh');
      localStorage.removeItem('shopify_last_token_check');
      
      // Update local state to force reconnection
      localStorage.setItem('shopify_force_refresh', 'true');
      
      // Generate a timestamp to prevent caching
      const timestamp = Date.now();
      const randomValue = Math.random().toString(36).substring(2, 15);
      
      // Force a new authentication flow by clearing session first
      await supabase
        .from('shopify_stores')
        .update({ is_active: false })
        .eq('shop', actualShop);
      
      // Request new token through shopify-auth function
      const { data: authData, error: authError } = await supabase.functions.invoke('shopify-auth', {
        body: { 
          shop: actualShop,
          forceUpdate: true,
          timestamp,
          nonce: randomValue
        },
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Timestamp': `${timestamp}`,
          'X-Nonce': randomValue
        }
      });
      
      if (authError) {
        console.error('Shopify auth function error:', authError);
        throw new Error(`فشل تحديث الاتصال: ${authError.message}`);
      }
      
      if (authData?.redirect) {
        // Navigate to auth page to get new token
        window.location.href = `${authData.redirect}&t=${timestamp}&force=true&nonce=${randomValue}`;
      } else {
        throw new Error('لم يتم استلام عنوان المصادقة من الخادم');
      }
    } catch (error) {
      console.error('Error refreshing connection:', error);
      
      // Fallback method - direct redirect
      window.location.href = `/shopify-redirect?shop=${encodeURIComponent(actualShop)}&force_update=true&t=${Date.now()}&nonce=${Math.random().toString(36).substring(2, 15)}`;
      
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      throw new Error(`فشل تحديث الاتصال: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [shop, setShop]);

  // Add ability to manually toggle fail-safe mode
  const toggleFailSafeMode = useCallback((enable: boolean) => {
    setFailSafeMode(enable);
    console.log(`${enable ? 'Enabled' : 'Disabled'} fail-safe mode manually`);
  }, []);

  // Add ability to manually toggle fail-safe mode
  const toggleFailSafeMode = useCallback((enabled: boolean) => {
    setFailSafeMode(enabled);
    if (enabled) {
      localStorage.setItem('fail_safe_mode', 'true');
    } else {
      localStorage.removeItem('fail_safe_mode');
    }
  }, []);

  // Initialize fail-safe mode from localStorage
  useEffect(() => {
    const savedFailSafeMode = localStorage.getItem('fail_safe_mode') === 'true';
    if (savedFailSafeMode) {
      setFailSafeMode(true);
    }
  }, []);

  // Improved syncFormWithShopify with fail-safe mode for form operations
  const syncFormWithShopify = useCallback(async (formData: ShopifyFormData) => {
    if (!shop) {
      const localStorageShop = localStorage.getItem('shopify_store');
      if (!localStorageShop && !failSafeMode) {
        toast.error('لم يتم العثور على متجر مرتبط');
        throw new Error('No shop identified for form sync');
      }
    }
    
    const actualShop = shop || localStorage.getItem('shopify_store');

    setIsSyncing(true);
    setError(null);
    
    try {
      console.log('Starting Shopify sync with data:', formData);
      console.log('Using shop domain:', actualShop);
      
      // Save product settings to database first (always try this regardless of token state)
      try {
        // Use product ID from settings or default
        const productId = formData.settings.products?.[0] || 'default-product';
        
        // Validate form ID
        if (!formData.formId) {
          throw new Error('Form ID is missing or invalid');
        }
        
        // Setup request data
        const requestData: ProductSettingsRequest = {
          productId: productId,
          formId: formData.formId,
          enabled: true,
          blockId: formData.settings.blockId
        };
        
        console.log('Saving product settings data:', requestData);
        
        // Call product settings save function
        const result = await saveProductSettings(actualShop, requestData);
        
        console.log('Product settings result:', result);
        
        if (result.error) {
          throw new Error(result.error);
        }
      } catch (apiError) {
        console.error('Product settings save error:', apiError);
        
        if (failSafeMode) {
          // In fail-safe mode, don't throw errors for settings save
          console.log('Continuing in fail-safe mode despite settings error');
        } else {
          throw apiError instanceof Error ? apiError : new Error('حدث خطأ أثناء حفظ إعدادات المنتج');
        }
      }
      
      // Skip the actual Shopify sync if in fail-safe mode
      if (failSafeMode) {
        console.log('Skipping Shopify API calls in fail-safe mode');
        toast.success('تم حفظ إعدادات النموذج بنجاح (وضع الدعم الاحتياطي)');
        return true;
      }

      // If not in fail-safe mode, proceed with normal token logic
      // Get the store access token
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at, token_type')
        .eq('shop', actualShop)
        .single();
      
      if (storeError) {
        console.error('Store access token error:', storeError);
        setTokenError(true);
        setTokenExpired(true);
        
        // Enter fail-safe mode instead of throwing
        setFailSafeMode(true);
        toast.warning('لم يتم العثور على رمز الوصول للمتجر، تم تفعيل وضع الدعم الاحتياطي');
        return true;
      }

      if (!storeData || !storeData.access_token) {
        console.error('Store access token not found');
        setTokenError(true);
        setTokenExpired(true);
        
        // Enter fail-safe mode instead of throwing
        setFailSafeMode(true);
        toast.warning('لم يتم العثور على رمز الوصول للمتجر، تم تفعيل وضع الدعم الاحتياطي');
        return true;
      }

      // Create API instance and sync with Shopify
      try {
        console.log(`Creating API instance for shop: ${actualShop}`);
        const api = createShopifyAPI(storeData.access_token, actualShop);
        
        // Verify connection before sync
        console.log('Verifying connection to Shopify API before sync...');
        await api.verifyConnection();
        console.log('Connection verification successful');
        
        // Sync form with Shopify
        console.log('Setting up auto sync with Shopify');
        await api.setupAutoSync(formData);
        console.log('Auto-sync completed successfully');
        
        // Clear token error states on successful operation
        setTokenError(false);
        setTokenExpired(false);
        setError(null);
        setFailSafeMode(false);
        
        toast.success('تم مزامنة النموذج مع Shopify بنجاح');
        return true;
      } catch (apiError) {
        console.error('API call error:', apiError);
        
        // Check for token related errors and attempt refresh
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
        
        if (errorMessage.includes('Authentication error') || 
            errorMessage.includes('401') || 
            errorMessage.includes('403')) {
            
          setTokenError(true);
          setTokenExpired(true);
          
          // Enter fail-safe mode
          setFailSafeMode(true);
          toast.warning('تم اكتشاف مشكلة في الاتصال بـ Shopify، تم تفعيل وضع الدعم الاحتياطي');
          return true;
        }
        
        throw apiError;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      toast.error(`فشل مزامنة النموذج: ${errorMessage}`);
      setError(errorMessage);
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [shop, failSafeMode]);

  return {
    products,
    isLoading,
    isSyncing,
    error,
    tokenError,
    tokenExpired,
    failSafeMode,
    refreshConnection,
    fetchProducts,
    syncFormWithShopify,
    testConnection,
    toggleFailSafeMode
  };
};
