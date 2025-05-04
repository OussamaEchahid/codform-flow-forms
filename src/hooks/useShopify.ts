
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
  const { shop, shopifyConnected, setShop } = useAuth();

  // Test connection and clear errors on shop changes
  useEffect(() => {
    if (shopifyConnected && shop) {
      setTokenError(false);
      setTokenExpired(false);
      setError(null);
      
      // Reset retry count when shop changes
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

  // Test if the connection is valid
  const testConnection = useCallback(async () => {
    if (!shopifyConnected || !shop) {
      return false;
    }

    try {
      console.log(`Testing connection for shop: ${shop}`);
      
      // Get the store access token
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shop)
        .single();
      
      if (storeError || !storeData || !storeData.access_token) {
        console.error('Store access token error:', storeError || 'No access token found');
        return false;
      }
      
      // Create API instance and test connection
      const api = createShopifyAPI(storeData.access_token, shop);
      await api.verifyConnection();
      
      // If successful, clear error states
      setTokenError(false);
      setTokenExpired(false);
      setError(null);
      return true;
    } catch (err) {
      console.error('Connection test failed:', err);
      
      // Don't show UI error on silent tests
      return false;
    }
  }, [shop, shopifyConnected]);

  const fetchProducts = useCallback(async () => {
    if (!shopifyConnected || !shop) {
      setError('Shopify connection not established');
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
      console.log(`Fetching products for shop: ${shop}`);
      // Get the store access token
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at, token_type')
        .eq('shop', shop)
        .single();
      
      if (storeError) {
        console.error('Store access token error:', storeError);
        setTokenError(true);
        setTokenExpired(true);
        throw new Error('لم يتم العثور على رمز الوصول للمتجر، يرجى إعادة الاتصال بالمتجر');
      }

      if (!storeData || !storeData.access_token) {
        console.error('Store access token not found');
        setTokenError(true);
        setTokenExpired(true);
        throw new Error('لم يتم العثور على رمز الوصول للمتجر، يرجى إعادة الاتصال بالمتجر');
      }
      
      // Check token age
      const tokenUpdatedAt = new Date(storeData.updated_at);
      const currentDate = new Date();
      const daysSinceUpdate = Math.floor((currentDate.getTime() - tokenUpdatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`Token is ${daysSinceUpdate} days old. Type: ${storeData.token_type || 'unknown'}`);
      
      // For online tokens, they expire much faster
      if (storeData.token_type !== 'offline' && daysSinceUpdate > 1) {
        console.warn('Online token is older than 1 day, likely expired');
        
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
        
        setTokenExpired(true);
        throw new Error('رمز الوصول للمتجر منتهي الصلاحية. يرجى إعادة الاتصال بالمتجر للحصول على رمز جديد.');
      }
      
      // For offline tokens, they should last much longer but we still check
      if (storeData.token_type === 'offline' && daysSinceUpdate > 14) {
        console.warn('Offline token is older than 14 days, may need refresh');
      }
      
      console.log('Access token retrieved successfully, last updated:', storeData.updated_at);

      // Create API instance with token and shop domain
      const api = createShopifyAPI(storeData.access_token, shop);
      
      // Verify connection before fetching products
      await api.verifyConnection();
      
      const fetchedProducts = await api.getProducts();
      console.log(`Retrieved ${fetchedProducts.length} products`);
      setProducts(fetchedProducts);
      
      // Clear errors on successful fetch
      setTokenError(false);
      setTokenExpired(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      console.error('Error fetching products:', err);
      
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
            toast.error('فشل التحديث التلقائي للاتصال. يرجى إعادة الاتصال يدويًا.');
          } finally {
            setIsAutoRefreshing(false);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [shop, shopifyConnected, tokenError, lastTokenCheck, autoRetryCount, isAutoRefreshing]);

  const refreshConnection = useCallback(async () => {
    if (!shop) return;
    
    setIsLoading(true);
    try {
      console.log(`Refreshing connection for shop: ${shop}`);
      
      // Clear any cached data related to the connection
      localStorage.removeItem('shopify_force_refresh');
      localStorage.removeItem('shopify_last_token_check');
      
      // Update local state to force reconnection
      localStorage.setItem('shopify_force_refresh', 'true');
      
      // Generate a timestamp to prevent caching
      const timestamp = Date.now();
      
      // Force a new authentication flow by clearing session first
      await supabase
        .from('shopify_stores')
        .update({ is_active: false })
        .eq('shop', shop);
      
      // Request new token through shopify-auth function
      const { data: authData, error: authError } = await supabase.functions.invoke('shopify-auth', {
        body: { 
          shop: shop,
          forceUpdate: true,
          timestamp
        },
      });
      
      if (authError) {
        throw new Error(`فشل تحديث الاتصال: ${authError.message}`);
      }
      
      if (authData?.redirect) {
        // Navigate to auth page to get new token
        window.location.href = `${authData.redirect}&t=${timestamp}&force=true`;
      } else {
        throw new Error('لم يتم استلام عنوان المصادقة من الخادم');
      }
    } catch (error) {
      console.error('Error refreshing connection:', error);
      
      // Fallback method - direct redirect
      window.location.href = `/shopify-redirect?shop=${encodeURIComponent(shop)}&force_update=true&t=${Date.now()}`;
      
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      throw new Error(`فشل تحديث الاتصال: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [shop]);

  const syncFormWithShopify = useCallback(async (formData: ShopifyFormData) => {
    if (!shopifyConnected || !shop) {
      toast.error('Shopify connection not established');
      throw new Error('Shopify connection not established');
    }

    // Prevent sync if token is expired
    if (tokenError || tokenExpired) {
      toast.error('يرجى تحديث اتصال متجر Shopify أولاً');
      throw new Error('Token error or expired. Please refresh connection first.');
    }

    setIsSyncing(true);
    setError(null);
    
    try {
      console.log('Starting Shopify sync with data:', formData);
      console.log('Using shop domain:', shop);
      
      // Validate shop format
      if (!shop.includes('myshopify.com')) {
        console.warn('Shop domain might not be properly formatted:', shop);
        console.log('Will attempt to normalize in the API client');
      }
      
      // Get the store access token
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at, token_type')
        .eq('shop', shop)
        .single();
      
      if (storeError) {
        console.error('Store access token error:', storeError);
        setTokenError(true);
        setTokenExpired(true);
        throw new Error('لم يتم العثور على رمز الوصول للمتجر، يرجى إعادة الاتصال بالمتجر');
      }

      if (!storeData || !storeData.access_token) {
        console.error('Store access token not found');
        setTokenError(true);
        setTokenExpired(true);
        throw new Error('لم يتم العثور على رمز الوصول للمتجر، يرجى إعادة الاتصال بالمتجر');
      }
      
      console.log('Retrieved store access token successfully, token length:', storeData.access_token.length);
      console.log('Token last updated:', storeData.updated_at, 'Type:', storeData.token_type || 'unknown');
      
      // Check token age based on type
      const tokenUpdatedAt = new Date(storeData.updated_at);
      const currentDate = new Date();
      const daysSinceUpdate = Math.floor((currentDate.getTime() - tokenUpdatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // For online tokens, they expire much faster
      if (storeData.token_type !== 'offline' && daysSinceUpdate > 1) {
        console.warn('Token might be expired, it was updated', daysSinceUpdate, 'days ago');
        
        if (!isAutoRefreshing && autoRetryCount < 2) {
          // Try auto-refreshing the token
          setIsAutoRefreshing(true);
          setAutoRetryCount(prev => prev + 1);
          
          try {
            toast.info('جاري تحديث الاتصال تلقائيًا...');
            await refreshConnection();
            
            // Wait for reconnection to complete
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Try syncing again with new token
            return syncFormWithShopify(formData);
          } catch (refreshError) {
            console.error('Auto-refresh failed:', refreshError);
          } finally {
            setIsAutoRefreshing(false);
          }
        }
        
        setTokenExpired(true);
        throw new Error('رمز الوصول للمتجر منتهي الصلاحية. يرجى إعادة الاتصال بالمتجر للحصول على رمز جديد.');
      }

      // Save product settings to database first
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
        const result = await saveProductSettings(shop, requestData);
        
        console.log('Product settings result:', result);
        
        if (result.error) {
          throw new Error(result.error);
        }
      } catch (apiError) {
        console.error('Product settings save error:', apiError);
        throw apiError instanceof Error ? apiError : new Error('Unknown error saving product settings');
      }

      // Create API instance and sync with Shopify
      try {
        console.log(`Creating API instance for shop: ${shop}`);
        const api = createShopifyAPI(storeData.access_token, shop);
        
        // Verify connection before sync
        console.log('Verifying connection to Shopify API before sync...');
        await api.verifyConnection();
        console.log('Connection verification successful');
        
        // Sync form with Shopify
        console.log('Setting up auto sync with Shopify');
        await api.setupAutoSync(formData);
        console.log('Auto-sync completed successfully');
        
        // Clear token error states on success
        setTokenError(false);
        setTokenExpired(false);
      } catch (syncError) {
        console.error('Auto-sync error:', syncError);
        
        // Check for token-related errors
        const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown error';
        if (errorMessage.includes('Authentication error') || 
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
              toast.info('جاري تحديث الاتصال تلقائيًا...');
              await refreshConnection();
              
              // Wait for reconnection to complete
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Try syncing again with new token
              return syncFormWithShopify(formData);
            } catch (refreshError) {
              console.error('Auto-refresh failed:', refreshError);
            } finally {
              setIsAutoRefreshing(false);
            }
          }
          
          throw new Error('رمز الوصول للمتجر غير صالح أو منتهي الصلاحية، يرجى إعادة الاتصال بالمتجر');
        }
        
        throw new Error(errorMessage);
      }
      
      // Save form-shop association in database
      console.log('Updating form-shop association in database');
      const { error: formUpdateError } = await supabase
        .from('forms')
        .update({ shop_id: shop })
        .eq('id', formData.formId);
        
      if (formUpdateError) {
        console.error('Form update error:', formUpdateError);
        // Continue despite this error as it's not critical
        console.log('Continuing despite form update error');
      }

      toast.success('تم مزامنة النموذج مع Shopify بنجاح');
      
      // Reset auto-retry count on success
      setAutoRetryCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في مزامنة بيانات النموذج';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [shop, shopifyConnected, tokenError, tokenExpired, autoRetryCount, isAutoRefreshing, refreshConnection]);

  // Force check connection on mount and periodically
  useEffect(() => {
    // Initial connection test
    if (shopifyConnected && shop) {
      testConnection();
    }
    
    // Periodic connection test (every 5 minutes)
    const intervalId = setInterval(() => {
      if (shopifyConnected && shop) {
        testConnection();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [shopifyConnected, shop, testConnection]);

  return {
    products,
    isLoading,
    error,
    syncFormWithShopify,
    fetchProducts,
    refreshConnection,
    isConnected: !!shopifyConnected,
    isSyncing,
    tokenError,
    tokenExpired,
    isAutoRefreshing
  };
};
