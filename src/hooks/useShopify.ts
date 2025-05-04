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
  
  // New circuit breaker state
  const dailyRetryCounter = useRef(0);
  const lastRetryReset = useRef(Date.now());
  const retryDelayMs = useRef(1000);
  const maxDailyRetries = 50;
  const currentRetryTimeout = useRef<NodeJS.Timeout | null>(null);
  const connectionTestInProgress = useRef(false);

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

  // Reset the daily retry counter
  useEffect(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Reset daily counter if it's been a day since last reset
    if (now - lastRetryReset.current > oneDayMs) {
      dailyRetryCounter.current = 0;
      lastRetryReset.current = now;
      console.log("Daily retry counter reset");
    }
    
    return () => {
      // Clear any pending retry timeout on unmount
      if (currentRetryTimeout.current) {
        clearTimeout(currentRetryTimeout.current);
      }
    };
  }, []);

  // Function to test connection and get token
  const fetchAccessToken = useCallback(async (shopDomain: string) => {
    if (!shopDomain) return null;
    
    // Circuit breaker: don't make too many requests
    if (dailyRetryCounter.current >= maxDailyRetries) {
      console.log(`Daily retry limit (${maxDailyRetries}) reached, forcing failsafe mode`);
      setFailSafeMode(true);
      localStorage.setItem('shopify_failsafe', 'true');
      localStorage.setItem('bypass_auth', 'true');
      return null;
    }
    
    dailyRetryCounter.current += 1;
    console.log(`Fetching access token for shop (attempt ${dailyRetryCounter.current}/${maxDailyRetries}):`, shopDomain);
    
    try {
      setIsLoading(true);
      
      // Use the improved RPC function with better error handling
      const { data, error } = await supabase.rpc(
        'get_shopify_store_data',
        { store_domain: shopDomain }
      );
      
      if (error) {
        console.error("Error fetching store data:", error);
        
        // Try direct query as fallback
        const { data: directData, error: directError } = await supabase
          .from('shopify_stores')
          .select('access_token')
          .eq('shop', shopDomain)
          .single();
          
        if (directError || !directData) {
          console.error("Direct query failed:", directError);
          return null;
        }
        
        return directData.access_token;
      }
      
      if (!data || !data.access_token) {
        console.error("No access token found for shop:", shopDomain);
        return null;
      }
      
      // On success, reset retry delay
      retryDelayMs.current = 1000;
      
      return data.access_token;
    } catch (error) {
      console.error("Error in fetchAccessToken:", error);
      
      // Increase retry delay on failure (exponential backoff)
      retryDelayMs.current = Math.min(retryDelayMs.current * 2, 60000);
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize Shopify API client when shop or token changes
  const initializeShopifyAPI = useCallback(async () => {
    if (isLoading || connectionTestInProgress.current) return;
    
    try {
      setIsLoading(true);
      connectionTestInProgress.current = true;
      
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
        localStorage.setItem('bypass_auth', 'true');
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
          
          // On success, reset retry counters
          retryCount.current = 0;
          
          console.log("Successfully connected to Shopify API");
          return api;
        } else {
          setTokenError(true);
          setFailSafeMode(true);
          localStorage.setItem('shopify_failsafe', 'true');
          localStorage.setItem('bypass_auth', 'true');
          console.error("Failed to connect to Shopify API");
        }
      } catch (error) {
        console.error("Error verifying connection:", error);
        setTokenError(true);
        setIsConnected(false);
        setFailSafeMode(true);
        localStorage.setItem('shopify_failsafe', 'true');
        localStorage.setItem('bypass_auth', 'true');
        
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
      localStorage.setItem('bypass_auth', 'true');
    } finally {
      setIsLoading(false);
      connectionTestInProgress.current = false;
    }
  }, [shop, shopifyConnected, isLoading, fetchAccessToken]);

  // Test connection explicitly with better backoff strategy
  const testConnection = useCallback(async (forceRefresh = false): Promise<boolean> => {
    // Don't run multiple tests in parallel
    if (connectionTestInProgress.current) {
      console.log("Connection test already in progress, skipping");
      return false;
    }
    
    if (!shop) {
      console.log("No shop provided for connection test");
      return false;
    }
    
    // Circuit breaker: don't make too many requests
    if (dailyRetryCounter.current >= maxDailyRetries) {
      console.log(`Daily retry limit (${maxDailyRetries}) reached, forcing failsafe mode`);
      setFailSafeMode(true);
      localStorage.setItem('shopify_failsafe', 'true');
      localStorage.setItem('bypass_auth', 'true');
      return false;
    }
    
    try {
      setIsLoading(true);
      setIsRetrying(true);
      connectionTestInProgress.current = true;
      dailyRetryCounter.current += 1;
      
      console.log(`Testing connection for shop ${shop} (attempt ${dailyRetryCounter.current}/${maxDailyRetries})`);
      
      // Use improved connection service for verification
      const connected = await shopifyConnectionService.verifyConnection(shop, forceRefresh);
      
      if (connected) {
        setIsConnected(true);
        setTokenError(false);
        setTokenExpired(false);
        retryCount.current = 0;
        setError(null);
        retryDelayMs.current = 1000; // Reset backoff
        
        localStorage.setItem('last_successful_connection', Date.now().toString());
        localStorage.setItem('last_connected_shop', shop);
        
        if (failSafeMode) {
          setFailSafeMode(false);
          localStorage.removeItem('shopify_failsafe');
        }
        
        if (forceRefresh) {
          toast.success(`تم الاتصال بمتجر: ${shop}`);
        }
        
        // Also ensure store is active in database
        await shopifyConnectionService.forceActivateStore(shop);
        
        return true;
      } else if (retryCount.current < maxRetries && forceRefresh) {
        // Only retry automatically if it was a manual refresh
        // Otherwise we'll end up in an endless loop
        retryCount.current++;
        const backoffTime = retryDelayMs.current;
        
        console.log(`Connection test failed, retrying in ${backoffTime}ms (${retryCount.current}/${maxRetries})...`);
        
        // Clear any existing timeout
        if (currentRetryTimeout.current) {
          clearTimeout(currentRetryTimeout.current);
        }
        
        // Use promise with timeout for retrying
        return new Promise((resolve) => {
          currentRetryTimeout.current = setTimeout(async () => {
            const result = await testConnection(true);
            resolve(result);
          }, backoffTime);
        });
      } else {
        // All retries failed or not a manual refresh
        console.error("Connection test failed");
        setTokenError(true);
        setIsConnected(false);
        setFailSafeMode(true);
        localStorage.setItem('shopify_failsafe', 'true');
        localStorage.setItem('bypass_auth', 'true');
        
        // Double the backoff time for next attempt
        retryDelayMs.current = Math.min(retryDelayMs.current * 2, 60000);
        
        if (forceRefresh) {
          toast.error('لا يمكن الاتصال بمتجر Shopify. تم تفعيل وضع الدعم الاحتياطي.');
        }
        return false;
      }
    } catch (error) {
      console.error("Error in testConnection:", error);
      setTokenError(true);
      setIsConnected(false);
      setFailSafeMode(true);
      localStorage.setItem('shopify_failsafe', 'true');
      localStorage.setItem('bypass_auth', 'true');
      
      if (error instanceof Error) {
        setError(error.message);
        if (error.message.includes('expired')) {
          setTokenExpired(true);
        }
      }
      
      // Double the backoff time for next attempt
      retryDelayMs.current = Math.min(retryDelayMs.current * 2, 60000);
      
      return false;
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
      connectionTestInProgress.current = false;
    }
  }, [shop, failSafeMode]);

  // Initialize on load, but only once and be careful not to create loops
  useEffect(() => {
    let hasInitialized = false;
    
    const initializeOnLoad = async () => {
      // Skip if already initialized
      if (hasInitialized || !shop || !shopifyConnected) return;
      
      // Skip initialization if in failsafe mode to prevent cyclic requests
      if (failSafeMode) {
        console.log("In failsafe mode, skipping API initialization");
        return;
      }
      
      hasInitialized = true;
      
      // Check for recent successful connection to avoid hammering the API
      const lastConnectionTime = parseInt(localStorage.getItem('last_successful_connection') || '0', 10);
      const lastConnectedShop = localStorage.getItem('last_connected_shop');
      const now = Date.now();
      const connectionAge = now - lastConnectionTime;
      
      // If we've successfully connected to this shop recently, skip testing
      if (lastConnectionTime > 0 && lastConnectedShop === shop && connectionAge < 3600000) {
        console.log(`Skipping connection test, last successful connection was ${connectionAge / 1000} seconds ago`);
        return;
      }
      
      await initializeShopifyAPI();
    };

    initializeOnLoad();
  }, [shop, shopifyConnected, initializeShopifyAPI, failSafeMode]);

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
  const changeShop = useCallback(async (newShop: string) => {
    if (newShop === shop) return;
    
    resetShopify();
    setShop(newShop);
    
    // Also ensure this shop is active in the database
    await shopifyConnectionService.forceActivateStore(newShop);
    
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
      
      // Force refresh token in database to ensure is_active=true
      await shopifyConnectionService.forceActivateStore(shop);
      
      // Test connection with force refresh
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

  // Emergency reset function
  const emergencyReset = useCallback(async () => {
    console.log("Performing emergency reset of Shopify connection state");
    
    // Clear all state
    resetShopify();
    setFailSafeMode(true);
    localStorage.setItem('shopify_failsafe', 'true');
    localStorage.setItem('bypass_auth', 'true');
    
    // Reset circuit breakers
    retryCount.current = 0;
    dailyRetryCounter.current = 0;
    retryDelayMs.current = 1000;
    
    // Clear any existing timeouts
    if (currentRetryTimeout.current) {
      clearTimeout(currentRetryTimeout.current);
      currentRetryTimeout.current = null;
    }
    
    // Also reset the connection manager state
    shopifyConnectionManager.resetLoopDetection();
    
    // Use the global emergency reset if available
    if (typeof (window as any).resetShopifyConnection === 'function') {
      await (window as any).resetShopifyConnection();
    }
    
    toast.success('تم إعادة ضبط حالة الاتصال بنجاح. يرجى تحديث الصفحة.');
  }, [resetShopify]);

  // Expose reset function globally for emergency situations
  useEffect(() => {
    (window as any).resetShopifyConnection = emergencyReset;
  }, [emergencyReset]);

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
    emergencyReset
  };
};
