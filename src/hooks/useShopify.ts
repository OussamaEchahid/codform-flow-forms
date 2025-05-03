
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyProduct, ShopifyFormData, ShopifyOrder } from '@/lib/shopify/types';
import { toast } from 'sonner';
import { 
  createRequestTracker, 
  createCacheManager, 
  createStorageHelper,
  DEFAULT_CACHE_TTL
} from '@/utils/requestManager';

// Constants for better maintainability
const CONNECTION_CHECK_THROTTLE = 300000; // 5 minutes
const REQUEST_DEBOUNCE_TIME = 1000; // 1 second

export const useShopify = () => {
  const { shop, shopifyConnected, forceReconnect, refreshShopifyConnection } = useAuth();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | undefined>(undefined);
  
  // Use refs for state that doesn't trigger renders
  const initialCheckPerformed = useRef(false);
  const reconnectAttemptsRef = useRef<number>(0);
  const lastCheckRef = useRef<number>(0);
  const checkingRef = useRef<boolean>(false);
  
  // Request and cache management using utility functions
  const requestTracker = useRef(createRequestTracker()).current;
  const cache = useRef(createCacheManager<any>()).current;
  const storage = useRef(createStorageHelper('shopify_')).current;
  
  // Connection check timeout ref
  const connectionCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enhanced products fetching with proper caching
  const refreshProducts = useCallback(async (force = false): Promise<ShopifyProduct[]> => {
    // Skip if conditions aren't met
    if (!shopifyConnected || !shop) {
      const cachedProducts = cache.get('products', DEFAULT_CACHE_TTL);
      return cachedProducts.expired ? [] : (cachedProducts.data || []);
    }

    // Return cached data if a request is in progress
    if (requestTracker.isInProgress('refreshProducts')) {
      const cachedProducts = cache.get('products', DEFAULT_CACHE_TTL);
      return cachedProducts.expired ? [] : (cachedProducts.data || []);
    }
    
    // Return cached data if still valid and not forced
    if (!force) {
      const cachedProducts = cache.get('products', DEFAULT_CACHE_TTL);
      if (!cachedProducts.expired && cachedProducts.data) {
        return cachedProducts.data;
      }
    }
    
    // Proceed with fetching
    requestTracker.trackRequest('refreshProducts', true);
    setIsLoading(true);
    
    try {
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
      
      // Use offline products if available
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

  // Connection verification with proper throttling
  const verifyShopifyConnection = useCallback(async (): Promise<boolean | undefined> => {
    if (!shop) return false;
    
    // Skip if already checking
    if (checkingRef.current) {
      return connectionStatus;
    }
    
    // Skip if we checked recently
    const now = Date.now();
    if (now - lastCheckRef.current < CONNECTION_CHECK_THROTTLE) {
      // Return from cache if available
      const cachedConnection = cache.get('connection', CONNECTION_CHECK_THROTTLE);
      if (!cachedConnection.expired && cachedConnection.data !== undefined) {
        return cachedConnection.data?.status;
      }
      
      // Return from storage if cache unavailable
      const storedStatus = storage.get('connection_status', undefined);
      return storedStatus !== undefined ? storedStatus : connectionStatus;
    }
    
    // Prevent concurrent checks
    if (requestTracker.isInProgress('verifyConnection')) {
      return connectionStatus;
    }
    
    requestTracker.trackRequest('verifyConnection', true);
    checkingRef.current = true;
    
    try {
      // For demo purposes, use the current shopifyConnected state
      // This should be replaced with actual verification logic
      const isConnected = shopifyConnected && !!shop;
      
      // Update cache
      cache.set('connection', {
        status: isConnected,
        timestamp: now
      });
      
      // Update storage for persistence
      storage.set('connection_status', isConnected);
      storage.set('connection_check_time', now);
      
      lastCheckRef.current = now;
      setConnectionStatus(isConnected);
      return isConnected;
    } catch (error) {
      console.error('Error checking connection:', error);
      setConnectionStatus(false);
      return false;
    } finally {
      checkingRef.current = false;
      requestTracker.trackRequest('verifyConnection', false);
    }
  }, [shop, shopifyConnected, connectionStatus, cache, storage, requestTracker]);

  // Manual reconnect with error handling
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
      try {
        forceReconnect();
        return true;
      } catch (error) {
        console.error('Error during reconnect:', error);
        setIsRedirecting(false);
        return false;
      }
    }
    
    // Fallback to URL redirect
    try {
      const redirectUrl = `/shopify?force=true&ts=${Date.now()}&r=${Math.random().toString(36).substring(7)}`;
      window.location.href = redirectUrl;
      return true;
    } catch (error) {
      console.error('Error redirecting:', error);
      setIsRedirecting(false);
      return false;
    }
  }, [isRedirecting, forceReconnect]);

  // Form to product with reduced API calls
  const saveFormToProduct = useCallback(async (formData: ShopifyFormData) => {
    if (!shopifyConnected || !shop) {
      const offlineSettings = JSON.parse(localStorage.getItem('offline_shopify_settings') || '[]');
      offlineSettings.push({
        product_id: formData.product_id || 'all',
        form_id: formData.form_id,
        settings: formData.settings,
        shop_id: shop || 'unknown',
        timestamp: Date.now()
      });
      localStorage.setItem('offline_shopify_settings', JSON.stringify(offlineSettings));
      return false;
    }

    if (requestTracker.isInProgress('saveForm')) {
      return false;
    }

    requestTracker.trackRequest('saveForm', true);

    try {
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
      } catch (storageError) {
        console.error('Error saving to local storage:', storageError);
      }
      
      return false;
    } finally {
      requestTracker.trackRequest('saveForm', false);
    }
  }, [shop, shopifyConnected, requestTracker]);
  
  // Sync form with less frequent API calls
  const syncFormWithShopify = useCallback(async (formData: ShopifyFormData): Promise<boolean> => {
    if (isSyncing || requestTracker.isInProgress('syncForm')) {
      return false;
    }
    
    requestTracker.trackRequest('syncForm', true);
    setIsSyncing(true);
    
    try {
      if (!shopifyConnected || !shop) {
        // Store for offline sync
        const offlineSettings = JSON.parse(localStorage.getItem('offline_shopify_settings') || '[]');
        offlineSettings.push({
          product_id: formData.product_id || 'all',
          form_id: formData.form_id,
          settings: formData.settings,
          shop_id: 'pending',
          timestamp: Date.now()
        });
        localStorage.setItem('offline_shopify_settings', JSON.stringify(offlineSettings));
        return false;
      }

      const saved = await saveFormToProduct(formData);
      return saved;
    } catch (error) {
      console.error('Error syncing form with Shopify:', error);
      setError('Failed to sync form');
      return false;
    } finally {
      setIsSyncing(false);
      requestTracker.trackRequest('syncForm', false);
    }
  }, [isSyncing, shopifyConnected, shop, saveFormToProduct, requestTracker]);
  
  // Single connection check on mount
  useEffect(() => {
    if (!initialCheckPerformed.current && shop && shopifyConnected) {
      initialCheckPerformed.current = true;
      
      // Delay initial check to avoid performance issues during page load
      const initialTimeout = setTimeout(() => {
        verifyShopifyConnection().catch(err => {
          console.error("Initial connection check failed:", err);
        });
      }, 5000);
      
      return () => clearTimeout(initialTimeout);
    }
  }, [shop, shopifyConnected, verifyShopifyConnection]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (connectionCheckTimeoutRef.current) {
        clearTimeout(connectionCheckTimeoutRef.current);
      }
      requestTracker.clearAllTimeouts();
    };
  }, [requestTracker]);

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

