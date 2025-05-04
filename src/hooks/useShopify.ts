
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { createShopifyAPI } from '@/lib/shopify/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';

/**
 * Enhanced useShopify hook with improved reliability and fail-safe mode
 */
export const useShopify = () => {
  const { shop, shopifyConnected, setShop } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [shopifyAPI, setShopifyAPI] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);
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
        retryCount.current = 0;
        
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
      return false;
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [shop, failSafeMode]);

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
    retryCount.current = 0;
    shopifyConnectionService.resetConnectionState();
  }, []);

  // Manually change active shop
  const changeShop = useCallback((newShop: string) => {
    if (newShop === shop) return;
    
    resetShopify();
    setShop(newShop);
  }, [shop, setShop, resetShopify]);

  // Sync form with Shopify with improved reliability
  const syncFormWithShopify = useCallback(async (formId: string): Promise<boolean> => {
    if (!shop) {
      toast.error('يجب تحديد متجر Shopify لمزامنة النموذج');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Use connection service for syncing
      const result = await shopifyConnectionService.syncFormWithShopify(formId, shop);
      
      if (result) {
        toast.success('تم مزامنة النموذج مع متجر Shopify بنجاح');
        
        // Refresh pending syncs list
        const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
        setPendingSyncForms(pendingSyncs.filter((id: string) => id !== formId));
        
        return true;
      } else {
        if (failSafeMode) {
          toast.info('تم حفظ النموذج، ولكن لم يتم مزامنته مع Shopify بسبب مشاكل الاتصال. سيتم مزامنته لاحقًا تلقائيًا.');
          
          // Add to pending syncs
          const pendingSyncs = JSON.parse(localStorage.getItem('pending_form_syncs') || '[]');
          if (!pendingSyncs.includes(formId)) {
            pendingSyncs.push(formId);
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
    isRetrying,
    isConnected,
    tokenError,
    accessToken,
    shopifyAPI,
    testConnection,
    resetShopify,
    syncFormWithShopify,
    changeShop,
    failSafeMode,
    toggleFailSafeMode,
    pendingSyncForms,
    resyncPendingForms
  };
};
