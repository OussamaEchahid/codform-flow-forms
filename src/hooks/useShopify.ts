
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { createShopifyAPI } from '@/lib/shopify/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';
import { ShopifyProduct } from '@/lib/shopify/types';

/**
 * Enhanced useShopify hook with improved reliability and fail-safe mode
 */
export const useShopify = () => {
  const { shop, shopifyConnected, setShop } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<boolean>(false);
  const [tokenExpired, setTokenExpired] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [shopifyAPI, setShopifyAPI] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [failSafeMode, setFailSafeMode] = useState(() => {
    return localStorage.getItem('shopify_failsafe') === 'true';
  });
  
  const [pendingSyncForms, setPendingSyncForms] = useState<string[]>([]);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Check and load pending forms
  useEffect(() => {
    const loadPendingSyncs = () => {
      try {
        const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
        setPendingSyncForms(pendingSyncs);
      } catch (e) {
        setPendingSyncForms([]);
      }
    };
    
    loadPendingSyncs();
    
    // Set up interval to check for pending syncs
    const interval = setInterval(() => {
      loadPendingSyncs();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Function to test connection and get token
  const fetchAccessToken = useCallback(async (shopDomain: string) => {
    if (!shopDomain) return null;
    
    console.log("Fetching access token for shop:", shopDomain);
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.rpc(
        'get_shopify_store_data',
        { store_domain: shopDomain }
      );
      
      if (error) {
        console.error("Error fetching store data:", error);
        return null;
      }
      
      if (!data || !data.access_token) {
        console.error("No access token found for shop:", shopDomain);
        return null;
      }
      
      return data.access_token;
    } catch (error) {
      console.error("Error in fetchAccessToken:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize Shopify API client when shop or token changes
  const initializeShopifyAPI = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      if (!shop || !shopifyConnected) {
        setIsConnected(false);
        setShopifyAPI(null);
        return;
      }
      
      console.log("Initializing Shopify API client for shop:", shop);
      
      // Get access token
      const token = await fetchAccessToken(shop);
      
      if (!token) {
        setTokenError(true);
        setIsConnected(false);
        setFailSafeMode(true);
        localStorage.setItem('shopify_failsafe', 'true');
        return;
      }
      
      setAccessToken(token);
      
      try {
        // Create API client
        const api = createShopifyAPI(token, shop);
        setShopifyAPI(api);
        
        // Test connection
        const connected = await api.verifyConnection();
        setIsConnected(connected);
        
        if (connected) {
          setTokenError(false);
          setTokenExpired(false);
          
          // Check if we should disable fail-safe mode
          if (failSafeMode) {
            setFailSafeMode(false);
            localStorage.removeItem('shopify_failsafe');
          }
          
          console.log("Successfully connected to Shopify API");
          return api;
        } else {
          setTokenError(true);
          setFailSafeMode(true);
          localStorage.setItem('shopify_failsafe', 'true');
          console.error("Failed to connect to Shopify API");
        }
      } catch (error) {
        console.error("Error verifying connection:", error);
        setTokenError(true);
        setIsConnected(false);
        setFailSafeMode(true);
        localStorage.setItem('shopify_failsafe', 'true');
        
        if (error instanceof Error && error.message.includes('expired')) {
          setTokenExpired(true);
        }
      }
    } catch (error) {
      console.error("Error in initializeShopifyAPI:", error);
      setTokenError(true);
      setIsConnected(false);
      setFailSafeMode(true);
      localStorage.setItem('shopify_failsafe', 'true');
    } finally {
      setIsLoading(false);
    }
  }, [shop, shopifyConnected, isLoading, fetchAccessToken, failSafeMode]);

  // Test connection explicitly with reattempts
  const testConnection = useCallback(async (forceRefresh = false): Promise<boolean> => {
    if (!shop) {
      console.log("No shop provided for connection test");
      return false;
    }
    
    try {
      setIsLoading(true);
      setIsRetrying(true);
      
      // Use service for verification
      const connected = await shopifyConnectionService.verifyConnection(shop, forceRefresh);
      
      if (connected) {
        setIsConnected(true);
        setTokenError(false);
        setTokenExpired(false);
        retryCount.current = 0;
        setError(null);
        
        if (failSafeMode) {
          setFailSafeMode(false);
          localStorage.removeItem('shopify_failsafe');
        }
        
        if (forceRefresh) {
          toast.success(`تم الاتصال بمتجر: ${shop}`);
        }
        
        return true;
      } else if (retryCount.current < maxRetries) {
        // Retry with backoff
        retryCount.current++;
        const backoffTime = Math.min(1000 * (retryCount.current), 5000);
        
        console.log(`Connection test failed, retrying in ${backoffTime}ms (${retryCount.current}/${maxRetries})...`);
        
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return testConnection(true);
      } else {
        // All retries failed
        console.error("Connection test failed after max retries");
        setTokenError(true);
        setIsConnected(false);
        setFailSafeMode(true);
        localStorage.setItem('shopify_failsafe', 'true');
        
        toast.error('لا يمكن الاتصال بمتجر Shopify. تم تفعيل وضع الدعم الاحتياطي.');
        return false;
      }
    } catch (error) {
      console.error("Error in testConnection:", error);
      setTokenError(true);
      setIsConnected(false);
      setFailSafeMode(true);
      localStorage.setItem('shopify_failsafe', 'true');
      
      if (error instanceof Error) {
        setError(error.message);
        if (error.message.includes('expired')) {
          setTokenExpired(true);
        }
      }
      
      return false;
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [shop, failSafeMode]);

  // Fetch products from Shopify API
  const fetchProducts = useCallback(async (): Promise<ShopifyProduct[]> => {
    if (!shop || !shopifyAPI) {
      setError("No shop or API client available");
      return [];
    }
    
    try {
      setIsLoading(true);
      const fetchedProducts = await shopifyAPI.getProducts();
      setProducts(fetchedProducts);
      setError(null);
      return fetchedProducts;
    } catch (error) {
      console.error("Error fetching products:", error);
      if (error instanceof Error) {
        setError(error.message);
        if (error.message.includes('expired')) {
          setTokenExpired(true);
        }
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [shop, shopifyAPI]);

  // Initialize on load and when shop changes
  useEffect(() => {
    if (shop && shopifyConnected) {
      initializeShopifyAPI();
    }
  }, [shop, shopifyConnected, initializeShopifyAPI]);

  // Reset state when shop changes
  const resetShopify = useCallback(() => {
    setAccessToken(null);
    setShopifyAPI(null);
    setIsConnected(null);
    setTokenError(false);
    setTokenExpired(false);
    setError(null);
    retryCount.current = 0;
    shopifyConnectionService.resetConnectionState();
  }, []);

  // Manually change active shop
  const changeShop = useCallback((newShop: string) => {
    if (newShop === shop) return;
    
    resetShopify();
    setShop(newShop);
  }, [shop, setShop, resetShopify]);

  // Refresh the connection with Shopify
  const refreshConnection = useCallback(async (): Promise<boolean> => {
    if (!shop) {
      setError("No shop to refresh connection with");
      return false;
    }
    
    try {
      setIsLoading(true);
      setIsRetrying(true);
      
      // TODO: Add actual reconnection logic here...
      // For now, just test the connection with force refresh
      const result = await testConnection(true);
      
      if (result) {
        setTokenExpired(false);
        setTokenError(false);
        setError(null);
      }
      
      return result;
    } catch (error) {
      console.error("Error refreshing connection:", error);
      if (error instanceof Error) {
        setError(error.message);
      }
      return false;
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [shop, testConnection]);

  // Sync form with Shopify with improved reliability
  const syncFormWithShopify = useCallback(async (formData: any): Promise<boolean> => {
    if (!shop) {
      toast.error('يجب تحديد متجر Shopify لمزامنة النموذج');
      return false;
    }
    
    try {
      setIsSyncing(true);
      setIsLoading(true);
      
      // Use connection service for syncing
      const result = await shopifyConnectionService.syncFormWithShopify(formData.formId, shop);
      
      if (result) {
        toast.success('تم مزامنة النموذج مع متجر Shopify بنجاح');
        
        // Refresh pending syncs list
        const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
        setPendingSyncForms(pendingSyncs.filter((id: string) => id !== formData.formId));
        
        return true;
      } else {
        if (failSafeMode) {
          toast.info('تم حفظ النموذج، ولكن لم يتم مزامنته مع Shopify بسبب مشاكل الاتصال. سيتم مزامنته لاحقًا تلقائيًا.');
          
          // Add to pending syncs
          const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
          if (!pendingSyncs.includes(formData.formId)) {
            pendingSyncs.push(formData.formId);
            localStorage.setItem('pending_form_syncs', JSON.stringify(pendingSyncs));
            setPendingSyncForms(pendingSyncs);
          }
          
          return true; // Return true to allow saving to continue
        } else {
          toast.error('فشل مزامنة النموذج مع متجر Shopify');
          return false;
        }
      }
    } catch (error) {
      console.error("Error in syncFormWithShopify:", error);
      toast.error('حدث خطأ أثناء مزامنة النموذج');
      return false;
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, [shop, failSafeMode]);

  // Re-sync all pending forms
  const resyncPendingForms = useCallback(async () => {
    if (!shop) {
      toast.error('يجب تحديد متجر Shopify لمزامنة النماذج');
      return;
    }
    
    await shopifyConnectionService.resyncPendingForms(shop);
    
    // Refresh list
    const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
    setPendingSyncForms(pendingSyncs);
  }, [shop]);

  // Add ability to manually toggle fail-safe mode
  const toggleFailSafeMode = useCallback((enabled: boolean) => {
    setFailSafeMode(enabled);
    if (enabled) {
      localStorage.setItem('shopify_failsafe', 'true');
      console.log('Fail-safe mode manually enabled');
      
      // Ensure bypass is enabled
      localStorage.setItem('bypass_auth', 'true');
    } else {
      localStorage.removeItem('shopify_failsafe');
      console.log('Fail-safe mode manually disabled');
    }
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
    error,
    testConnection,
    resetShopify,
    syncFormWithShopify,
    changeShop,
    failSafeMode,
    toggleFailSafeMode,
    pendingSyncForms,
    resyncPendingForms,
    refreshConnection,
    fetchProducts
  };
};
