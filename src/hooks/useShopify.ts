import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyProduct, ShopifyFormData } from '@/lib/shopify/types';
import { toast } from 'sonner';

// Constants for better maintainability
const CACHE_TTL = 60000; // 1 minute cache
const CONNECTION_CHECK_THROTTLE = 30000; // 30 seconds
const REQUEST_DEBOUNCE_TIME = 500; // 500ms

export const useShopify = () => {
  const { shop, shopifyConnected, forceReconnect, refreshShopifyConnection } = useAuth();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastCheck, setLastCheck] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean>(false);
  
  // Request state management
  const activeRequestsRef = useRef<{[key: string]: boolean}>({});
  const requestTimeoutsRef = useRef<{[key: string]: ReturnType<typeof setTimeout>}>({});
  const connectionCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  
  // Cache management
  const cachedDataRef = useRef<{
    products: { data: ShopifyProduct[] | null, timestamp: number },
    connection: { status: boolean, timestamp: number }
  }>({
    products: { data: null, timestamp: 0 },
    connection: { status: false, timestamp: 0 }
  });

  // Helper to check if a request is already in progress
  const isRequestInProgress = (key: string): boolean => {
    return !!activeRequestsRef.current[key];
  };

  // Helper to track request status and cleanup
  const trackRequest = useCallback((key: string, inProgress: boolean) => {
    if (inProgress) {
      activeRequestsRef.current[key] = true;
    } else {
      // Clean up after a small delay to prevent rapid successive calls
      if (requestTimeoutsRef.current[key]) {
        clearTimeout(requestTimeoutsRef.current[key]);
      }
      
      requestTimeoutsRef.current[key] = setTimeout(() => {
        activeRequestsRef.current[key] = false;
        delete requestTimeoutsRef.current[key];
      }, REQUEST_DEBOUNCE_TIME);
    }
  }, []);
  
  // Clear all request timeouts when unmounting
  useEffect(() => {
    return () => {
      Object.values(requestTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      
      if (connectionCheckTimeoutRef.current) {
        clearTimeout(connectionCheckTimeoutRef.current);
      }
    };
  }, []);

  // Improved products fetching with proper caching and throttling
  const refreshProducts = useCallback(async () => {
    // Skip if conditions aren't met
    if (!shopifyConnected || !shop) {
      return cachedDataRef.current.products.data || [];
    }

    // Return cached data if a request is in progress
    if (isRequestInProgress('refreshProducts')) {
      console.log('A products refresh is already in progress, using cached data');
      return cachedDataRef.current.products.data || [];
    }
    
    // Return cached data if still valid
    if (
      cachedDataRef.current.products.data &&
      Date.now() - cachedDataRef.current.products.timestamp < CACHE_TTL
    ) {
      console.log('Using cached products data');
      return cachedDataRef.current.products.data;
    }
    
    trackRequest('refreshProducts', true);
    setIsLoading(true);
    
    try {
      console.log('Refreshing Shopify products for shop:', shop);
      
      // For now, return mock products to prevent continuous API calls
      // This should be replaced with actual API call when ready
      const mockProducts: ShopifyProduct[] = [
        {
          id: "mock1",
          title: "Sample Product",
          handle: "sample-product",
          description: "This is a sample product",
          price: "19.99",
          image: ""
        },
        {
          id: "mock2",
          title: "Another Product",
          handle: "another-product",
          description: "This is another sample product",
          price: "29.99",
          image: ""
        }
      ];
      
      // Cache the data
      cachedDataRef.current.products = {
        data: mockProducts,
        timestamp: Date.now()
      };
      
      setProducts(mockProducts);
      return mockProducts;
    } catch (error) {
      console.error('Error fetching Shopify products:', error);
      
      // Use offline products if available or create fallback
      const offlineProducts: ShopifyProduct[] = [
        {
          id: "offline1",
          title: "Offline Product",
          handle: "offline-product",
          description: "This product is available while offline",
          price: "9.99",
          image: ""
        }
      ];
      
      setProducts(offlineProducts);
      setError('Failed to fetch products');
      return offlineProducts;
    } finally {
      setIsLoading(false);
      trackRequest('refreshProducts', false);
    }
  }, [shop, shopifyConnected, trackRequest]);

  // Improved connection verification with proper throttling
  const verifyShopifyConnection = useCallback(async (): Promise<boolean> => {
    if (!shop) return false;
    
    // Skip if we checked recently
    if (Date.now() - lastCheck < CONNECTION_CHECK_THROTTLE) {
      console.log("Throttling connection verification - checked recently");
      return connectionStatus;
    }
    
    // Skip if already checking
    if (isRequestInProgress('verifyConnection')) {
      console.log('Connection verification already in progress');
      return connectionStatus;
    }
    
    trackRequest('verifyConnection', true);
    setLastCheck(Date.now());
    
    try {
      console.log('Verifying Shopify connection for shop:', shop);
      
      // Check cached status first
      const cachedTime = cachedDataRef.current.connection.timestamp;
      if (Date.now() - cachedTime < CONNECTION_CHECK_THROTTLE) {
        return cachedDataRef.current.connection.status;
      }
      
      // For demo purposes, use the current shopifyConnected state
      // This should be replaced with actual verification logic
      const isConnected = shopifyConnected && !!shop;
      
      // Update cache
      cachedDataRef.current.connection = {
        status: isConnected,
        timestamp: Date.now()
      };
      
      // Update storage for persistence
      localStorage.setItem('shopify_connection_status', String(isConnected));
      localStorage.setItem('shopify_connection_check_time', String(Date.now()));
      
      setConnectionStatus(isConnected);
      return isConnected;
    } catch (error) {
      console.error('Database error checking connection:', error);
      setConnectionStatus(false);
      return false;
    } finally {
      trackRequest('verifyConnection', false);
    }
  }, [shop, shopifyConnected, connectionStatus, lastCheck]);

  // Manual reconnect with improved error handling
  const manualReconnect = useCallback(() => {
    if (isRedirecting) return false;
    
    reconnectAttemptsRef.current += 1;
    if (reconnectAttemptsRef.current > 3) {
      toast.warning('Too many reconnection attempts. Please try again later.');
      
      // Reset after a minute
      setTimeout(() => {
        reconnectAttemptsRef.current = 0;
      }, 60000);
      
      return false;
    }
    
    setIsRedirecting(true);
    
    if (typeof forceReconnect === 'function') {
      console.log('Using direct reconnect function');
      return forceReconnect();
    }
    
    console.log('Using URL redirect for reconnection');
    toast.info('Redirecting to reconnect to Shopify...');
    
    setTimeout(() => {
      const redirectUrl = `/shopify?force=true&ts=${Date.now()}&random=${Math.random().toString(36).substring(7)}`;
      window.location.href = redirectUrl;
    }, 1000);
    
    return true;
  }, [isRedirecting, forceReconnect]);

  // Save form settings to product with retry mechanism
  const saveFormToProduct = useCallback(async (formData: ShopifyFormData) => {
    if (!shopifyConnected || !shop) {
      toast.error('يجب الاتصال بـ Shopify أولاً');
      return false;
    }

    if (isRequestInProgress('saveForm')) {
      toast.info('طلب حفظ آخر قيد التنفيذ، يرجى الانتظار...');
      return false;
    }

    trackRequest('saveForm', true);

    try {
      console.log('Saving form settings to product:', formData);
      
      const formSettings = {
        productId: formData.product_id,
        formId: formData.form_id,
        blockId: formData.settings?.blockId,
        enabled: formData.settings?.enabled || true,
        shopId: shop,
      };
      
      const { data, error } = await supabase
        .from('shopify_product_settings')
        .upsert({
          product_id: formSettings.productId,
          form_id: formSettings.formId,
          shop_id: formSettings.shopId,
          block_id: formSettings.blockId,
          enabled: formSettings.enabled,
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      console.log('Form settings saved successfully:', data);
      return true;
    } catch (error) {
      console.error('Error saving form to product:', error);
      
      // Store offline for later sync
      try {
        const offlineSettings = JSON.parse(localStorage.getItem('offline_shopify_settings') || '[]');
        offlineSettings.push({
          product_id: formData.product_id,
          form_id: formData.form_id,
          settings: formData.settings,
          shop_id: shop,
          timestamp: Date.now()
        });
        localStorage.setItem('offline_shopify_settings', JSON.stringify(offlineSettings));
        
        toast.warning('تم تخزين الإعدادات محليًا. ستتم المزامنة عند استعادة الاتصال.');
        return true;
      } catch (storageError) {
        console.error('Error saving to local storage:', storageError);
      }
      
      return false;
    } finally {
      trackRequest('saveForm', false);
    }
  }, [shop, shopifyConnected, trackRequest]);
  
  // Sync form with Shopify
  const syncFormWithShopify = useCallback(async (formData: ShopifyFormData): Promise<boolean> => {
    if (isSyncing || isRequestInProgress('syncForm')) {
      toast.info('طلب مزامنة آخر قيد التنفيذ، يرجى الانتظار...');
      return false;
    }
    
    trackRequest('syncForm', true);
    setIsSyncing(true);
    
    try {
      console.log('Syncing form with Shopify:', formData);
      
      if (!shopifyConnected || !shop) {
        toast.error('يجب الاتصال بـ Shopify أولاً');
        return false;
      }

      const saved = await saveFormToProduct(formData);
      
      if (!saved) {
        throw new Error('Failed to sync form with Shopify');
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing form with Shopify:', error);
      setError('Failed to sync form');
      return false;
    } finally {
      setIsSyncing(false);
      trackRequest('syncForm', false);
    }
  }, [isSyncing, shopifyConnected, shop, saveFormToProduct, trackRequest]);
  
  // Try to sync offline data when connection is restored
  useEffect(() => {
    if (!shopifyConnected || !shop || isRequestInProgress('offlineSync')) {
      return;
    }
    
    const attemptOfflineSync = async () => {
      trackRequest('offlineSync', true);
      
      try {
        const offlineSettings = JSON.parse(localStorage.getItem('offline_shopify_settings') || '[]');
        
        if (offlineSettings.length > 0) {
          console.log('Found offline settings to sync:', offlineSettings.length);
          toast.info('جاري مزامنة الإعدادات المخزنة محليًا...');
          
          let successful = 0;
          
          for (const setting of offlineSettings) {
            try {
              await saveFormToProduct(setting);
              successful++;
            } catch (err) {
              console.error('Error syncing individual setting:', err);
            }
          }
          
          // Clear successfully synced items
          if (successful > 0) {
            localStorage.removeItem('offline_shopify_settings');
            toast.success(`تمت مزامنة ${successful} من الإعدادات بنجاح`);
          }
        }
      } catch (error) {
        console.error('Error syncing offline settings:', error);
      } finally {
        trackRequest('offlineSync', false);
      }
    };
    
    // Delay sync to allow page to load first
    const syncTimeout = setTimeout(attemptOfflineSync, 5000);
    
    return () => {
      clearTimeout(syncTimeout);
    };
  }, [shopifyConnected, shop, saveFormToProduct, trackRequest]);

  // Check connection once on component mount, but don't keep polling
  useEffect(() => {
    if (shopifyConnected && shop && !isRequestInProgress('initialConnectionCheck')) {
      trackRequest('initialConnectionCheck', true);
      
      // Do a single connection check when component mounts
      verifyShopifyConnection().finally(() => {
        trackRequest('initialConnectionCheck', false);
      });
      
      // Do a single product refresh when component mounts
      if (!cachedDataRef.current.products.data) {
        refreshProducts();
      }
    }
  }, [shopifyConnected, shop, verifyShopifyConnection, refreshProducts, trackRequest]);

  return {
    products,
    isLoading,
    shop,
    isConnected: shopifyConnected,
    refreshProducts,
    manualReconnect,
    saveFormToProduct,
    verifyShopifyConnection,
    refreshConnection: refreshShopifyConnection,
    error,
    isRedirecting,
    isSyncing,
    connectionStatus,
    syncFormWithShopify
  };
};

export default useShopify;
