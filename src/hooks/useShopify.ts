import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyProduct, ShopifyFormData } from '@/lib/shopify/types';
import { toast } from 'sonner';
import { 
  createRequestTracker, 
  createCacheManager, 
  DEFAULT_CACHE_TTL, 
  DEFAULT_THROTTLE_TIME
} from '@/utils/requestManager';

// Constants for better maintainability
const CONNECTION_CHECK_THROTTLE = 300000; // 5 minutes
const REQUEST_DEBOUNCE_TIME = 1000; // 1 second

export const useShopify = () => {
  const { shop, shopifyConnected, forceReconnect, refreshShopifyConnection } = useAuth();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastCheck, setLastCheck] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean>(false);
  
  // Use refs for state that doesn't trigger renders
  const initialCheckPerformed = useRef(false);
  const reconnectAttemptsRef = useRef<number>(0);
  
  // Request and cache management using utility functions
  const requestTracker = useRef(createRequestTracker()).current;
  const cache = useRef(createCacheManager<any>()).current;
  
  // Connection check timeout ref
  const connectionCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Improved products fetching with proper caching and throttling
  const refreshProducts = useCallback(async () => {
    // Skip if conditions aren't met
    if (!shopifyConnected || !shop) {
      const cachedProducts = cache.get('products', DEFAULT_CACHE_TTL);
      return cachedProducts.expired ? [] : (cachedProducts.data || []);
    }

    // Return cached data if a request is in progress
    if (requestTracker.isInProgress('refreshProducts')) {
      console.log('A products refresh is already in progress, using cached data');
      const cachedProducts = cache.get('products', DEFAULT_CACHE_TTL);
      return cachedProducts.expired ? [] : (cachedProducts.data || []);
    }
    
    // Return cached data if still valid
    const cachedProducts = cache.get('products', DEFAULT_CACHE_TTL);
    if (!cachedProducts.expired && cachedProducts.data) {
      console.log('Using cached products data');
      return cachedProducts.data;
    }
    
    requestTracker.trackRequest('refreshProducts', true);
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
      cache.set('products', mockProducts);
      
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
      requestTracker.trackRequest('refreshProducts', false);
    }
  }, [shop, shopifyConnected, cache, requestTracker]);

  // Improved connection verification with proper throttling
  const verifyShopifyConnection = useCallback(async (): Promise<boolean> => {
    if (!shop) return false;
    
    // Skip if we checked recently
    const now = Date.now();
    if (now - lastCheck < CONNECTION_CHECK_THROTTLE) {
      console.log("Throttling connection verification - checked recently");
      return connectionStatus;
    }
    
    // Skip if already checking
    if (requestTracker.isInProgress('verifyConnection')) {
      console.log('Connection verification already in progress');
      return connectionStatus;
    }
    
    requestTracker.trackRequest('verifyConnection', true);
    setLastCheck(now);
    
    try {
      console.log('Verifying Shopify connection for shop:', shop);
      
      // Check cached status first
      const cachedConnection = cache.get('connection', CONNECTION_CHECK_THROTTLE);
      if (!cachedConnection.expired) {
        return cachedConnection.data?.status || false;
      }
      
      // For demo purposes, use the current shopifyConnected state
      // This should be replaced with actual verification logic
      const isConnected = shopifyConnected && !!shop;
      
      // Update cache
      cache.set('connection', {
        status: isConnected,
        timestamp: now
      });
      
      // Update storage for persistence
      localStorage.setItem('shopify_connection_status', String(isConnected));
      localStorage.setItem('shopify_connection_check_time', String(now));
      
      setConnectionStatus(isConnected);
      return isConnected;
    } catch (error) {
      console.error('Database error checking connection:', error);
      setConnectionStatus(false);
      return false;
    } finally {
      requestTracker.trackRequest('verifyConnection', false);
    }
  }, [shop, shopifyConnected, connectionStatus, lastCheck, cache, requestTracker]);

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

    if (requestTracker.isInProgress('saveForm')) {
      toast.info('طلب حفظ آخر قيد التنفيذ، يرجى الانتظار...');
      return false;
    }

    requestTracker.trackRequest('saveForm', true);

    try {
      console.log('Saving form settings to product:', formData);
      
      const formSettings = {
        productId: formData.product_id || 'all',
        formId: formData.form_id,
        blockId: formData.settings?.blockId || 'codform-default',
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
          product_id: formData.product_id || 'all',
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
      requestTracker.trackRequest('saveForm', false);
    }
  }, [shop, shopifyConnected, requestTracker]);
  
  // Sync form with Shopify
  const syncFormWithShopify = useCallback(async (formData: ShopifyFormData): Promise<boolean> => {
    if (isSyncing || requestTracker.isInProgress('syncForm')) {
      toast.info('طلب مزامنة آخر قيد التنفيذ، يرجى الانتظار...');
      return false;
    }
    
    requestTracker.trackRequest('syncForm', true);
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
      requestTracker.trackRequest('syncForm', false);
    }
  }, [isSyncing, shopifyConnected, shop, saveFormToProduct, requestTracker]);
  
  // Try to sync offline data when connection is restored
  useEffect(() => {
    if (!shopifyConnected || !shop || requestTracker.isInProgress('offlineSync')) {
      return;
    }
    
    const attemptOfflineSync = async () => {
      requestTracker.trackRequest('offlineSync', true);
      
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
        requestTracker.trackRequest('offlineSync', false);
      }
    };
    
    // Delay sync to allow page to load first but don't trigger on every render
    const shouldSync = !initialCheckPerformed.current;
    if (shouldSync) {
      const syncTimeout = setTimeout(attemptOfflineSync, 5000);
      initialCheckPerformed.current = true;
      
      return () => {
        clearTimeout(syncTimeout);
      };
    }
  }, [shopifyConnected, shop, saveFormToProduct, requestTracker]);

  // Check connection once on component mount, but don't keep polling
  useEffect(() => {
    if (shopifyConnected && shop && !initialCheckPerformed.current && !requestTracker.isInProgress('initialConnectionCheck')) {
      requestTracker.trackRequest('initialConnectionCheck', true);
      
      // Do a single connection check when component mounts
      verifyShopifyConnection().finally(() => {
        requestTracker.trackRequest('initialConnectionCheck', false);
        initialCheckPerformed.current = true;
      });
    }
    
    return () => {
      if (connectionCheckTimeoutRef.current) {
        clearTimeout(connectionCheckTimeoutRef.current);
      }
    };
  }, [shopifyConnected, shop, verifyShopifyConnection, requestTracker]);

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
