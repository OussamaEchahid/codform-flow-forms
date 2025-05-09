
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { shopifyStores, shopifySupabase } from './supabase-client';
import { shopifyConnectionManager } from './connection-manager';
import { connectionCache, CONNECTION_STATE_KEY } from './utils/connection-cache';
import { connectionLogger } from './utils/connection-logger';

// Define the context interface
interface ShopifyConnectionContextType {
  isConnected: boolean;
  shopDomain: string | null;
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  syncState: () => void;
  forceSetConnected: (shop: string) => void;
  disconnect: () => Promise<void>;
  reload: () => Promise<void>;
  testConnection: (forceRefresh?: boolean) => Promise<boolean>;
}

// Create context with default values
const ShopifyConnectionContext = createContext<ShopifyConnectionContextType>({
  isConnected: false,
  shopDomain: null,
  isLoading: true,
  isValidating: false,
  error: null,
  syncState: () => {},
  forceSetConnected: () => {},
  disconnect: async () => {},
  reload: async () => {},
  testConnection: async () => false,
});

export const ShopifyConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [shopDomain, setShopDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const lastConnectionAttempt = useRef<number>(0);

  // Force set connected state
  const forceSetConnected = useCallback((shop: string) => {
    setIsConnected(true);
    setShopDomain(shop);
    setError(null);
    
    // Update local storage and connection manager
    localStorage.setItem('shopify_store', shop);
    localStorage.setItem('shopify_connected', 'true');
    shopifyConnectionManager.addOrUpdateStore(shop, true);
    
    // Store timestamped connection state
    const state = {
      isConnected: true,
      shopDomain: shop,
      timestamp: Date.now()
    };
    localStorage.setItem(CONNECTION_STATE_KEY, JSON.stringify(state));
    
    connectionLogger.info(`Forced connection state to connected with shop: ${shop}`);
  }, []);
  
  // Test connection function with improved token validation and error handling
  // IMPORTANT: This function takes a SINGLE boolean parameter:
  // @param forceRefresh - Whether to force a fresh test ignoring cache (default: false)
  // @returns Promise<boolean> - Whether the connection is valid
  const testConnection = useCallback(async (forceRefresh: boolean = false): Promise<boolean> => {
    // No need to test if we don't have a shop
    if (!shopDomain) {
      connectionLogger.warn('Cannot test connection: no shop domain available');
      return false;
    }
    
    // Skip test if we tested recently, unless forceRefresh is true
    const now = Date.now();
    if (!forceRefresh && connectionCache.isValidationResultFresh(shopDomain)) {
      const cached = connectionCache.getValidationResult(shopDomain);
      if (cached) {
        connectionLogger.debug(`Using cached validation result for ${shopDomain}: ${cached.isValid}`);
        return cached.isValid;
      }
    }
    
    setIsValidating(true);
    
    try {
      connectionLogger.debug(`Testing connection for shop: ${shopDomain}${forceRefresh ? ' (forced)' : ''}`);
      
      // Get access token for current shop
      const { data, error } = await shopifyStores()
        .select('access_token')
        .eq('shop', shopDomain)
        .single();
        
      if (error || !data?.access_token) {
        throw new Error('لا يمكن العثور على رمز الوصول للمتجر');
      }
      
      if (data.access_token === 'placeholder_token') {
        throw new Error('رمز الوصول الحالي هو قيمة مؤقتة (placeholder). يرجى تحديثه برمز وصول حقيقي.');
      }
      
      // Call test-connection function
      const response = await fetch(`/api/shopify-token?shop=${encodeURIComponent(shopDomain)}&debug=true`);
      
      if (!response.ok) {
        throw new Error(`فشل استرداد رمز الوصول: ${response.statusText}`);
      }
      
      const tokenData = await response.json();
      
      if (tokenData.error) {
        throw new Error(tokenData.error);
      }
      
      // Get the token age in hours
      const tokenAge = tokenData.tokenAge || 0;
      
      // Test the token with Shopify API
      const testResult = await shopifySupabase.functions.invoke('shopify-test-connection', {
        body: {
          shop: shopDomain,
          accessToken: data.access_token,
          tokenAge
        }
      });
      
      if (testResult.error || !testResult.data?.success) {
        // Clear cached validation result
        connectionCache.clearValidationResult(shopDomain);
        
        const errorMessage = testResult.error?.message || testResult.data?.message || 'فشل اختبار الاتصال';
        connectionLogger.error(`Connection test failed: ${errorMessage}`);
        
        throw new Error(errorMessage);
      }
      
      // Cache the validation result
      connectionCache.setValidationResult(shopDomain, true);
      
      // Update connection state in localStorage and provider
      const state = {
        isConnected: true,
        shopDomain,
        timestamp: now,
        validationSuccess: true
      };
      localStorage.setItem(CONNECTION_STATE_KEY, JSON.stringify(state));
      setIsConnected(true);
      setError(null);
      
      // Additional cache invalidation for the useShopify hook
      if (forceRefresh) {
        try {
          // Clear any product cache in localStorage
          const productCacheKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('products:') || key.startsWith('shopify_products:')
          );
          
          for (const key of productCacheKeys) {
            localStorage.removeItem(key);
          }
          
          connectionLogger.debug(`Cleared ${productCacheKeys.length} product cache entries`);
        } catch (cacheError) {
          connectionLogger.warn('Error clearing product cache:', cacheError);
        }
      }
      
      connectionLogger.debug(`Connection test successful for ${shopDomain}`);
      return true;
    } catch (error) {
      connectionLogger.error('Connection test error:', error);
      
      // Clear cached validation result
      connectionCache.clearValidationResult(shopDomain);
      
      // Update state to reflect error
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف أثناء اختبار الاتصال';
      setError(errorMessage);
      
      // Update connection state in localStorage
      const state = {
        isConnected: false,
        shopDomain,
        timestamp: now,
        error: errorMessage,
        validationSuccess: false
      };
      localStorage.setItem(CONNECTION_STATE_KEY, JSON.stringify(state));
      
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [shopDomain]);

  // Sync the state from localStorage and connection manager
  const syncState = useCallback(() => {
    try {
      connectionLogger.debug('Syncing connection state');
      
      // First try to get shop from connection manager
      const activeShop = shopifyConnectionManager.getActiveStore();
      
      // Then try localStorage as fallback
      const storedShop = localStorage.getItem('shopify_store');
      const isConnectedInStorage = localStorage.getItem('shopify_connected') === 'true';
      
      // Get the most reliable shop value (manager has precedence)
      const shop = activeShop || storedShop;
      
      if (shop && (activeShop || isConnectedInStorage)) {
        connectionLogger.debug(`Found connected shop: ${shop}`);
        setIsConnected(true);
        setShopDomain(shop);
      } else {
        connectionLogger.debug('No connected shop found');
        setIsConnected(false);
        setShopDomain(null);
      }
      
      // Store the current state
      const state = {
        isConnected: shop && (activeShop || isConnectedInStorage),
        shopDomain: shop,
        timestamp: Date.now(),
        source: 'syncState'
      };
      localStorage.setItem(CONNECTION_STATE_KEY, JSON.stringify(state));
      
    } catch (error) {
      connectionLogger.error('Error syncing state:', error);
      setError('حدث خطأ أثناء مزامنة حالة الاتصال');
    }
  }, []);

  // Reload connection state and validate
  const reload = useCallback(async () => {
    const now = Date.now();
    
    // Prevent rapid reloads (throttle to once per second)
    if (now - lastConnectionAttempt.current < 1000) {
      connectionLogger.debug('Reload throttled, skipping');
      return;
    }
    
    lastConnectionAttempt.current = now;
    
    setIsLoading(true);
    setError(null);
    
    try {
      syncState();
      
      // If we have a shop, test the connection
      // IMPORTANT: Only pass a single boolean parameter to testConnection
      if (shopDomain) {
        await testConnection(true); // Pass only one argument - forceRefresh
      }
      
      connectionLogger.debug('Reload completed');
    } catch (error) {
      connectionLogger.error('Reload error:', error);
      setError(error instanceof Error ? error.message : 'فشل في إعادة تحميل حالة الاتصال');
    } finally {
      setIsLoading(false);
    }
  }, [syncState, testConnection, shopDomain]);

  // Disconnect from Shopify
  const disconnect = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Clear all shopify related data
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_failsafe');
      localStorage.removeItem('pending_form_syncs');
      localStorage.removeItem('shopify_recovery_mode');
      localStorage.removeItem('shopify_last_url_shop');
      localStorage.removeItem(CONNECTION_STATE_KEY);
      
      // Update connection manager
      shopifyConnectionManager.clearAllStores();
      
      // Clear token validation cache
      connectionCache.clearAllValidationResults();
      
      // Update state
      setIsConnected(false);
      setShopDomain(null);
      setError(null);
      
      connectionLogger.info('Successfully disconnected from Shopify');
    } catch (error) {
      connectionLogger.error('Error during disconnect:', error);
      setError('حدث خطأ أثناء قطع الاتصال');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize state on component mount
  useEffect(() => {
    // Load state from localStorage
    syncState();
    
    // Fetch shop data and test connection
    const checkConnection = async () => {
      if (shopDomain) {
        // FIXED: Pass a boolean parameter to testConnection
        await testConnection(false);
      }
      setIsLoading(false);
    };
    
    checkConnection();
  }, [syncState, testConnection, shopDomain]);

  const value = {
    isConnected,
    shopDomain,
    isLoading,
    isValidating,
    error,
    syncState,
    forceSetConnected,
    disconnect,
    reload,
    testConnection
  };

  return (
    <ShopifyConnectionContext.Provider value={value}>
      {children}
    </ShopifyConnectionContext.Provider>
  );
};

export const useShopifyConnection = () => useContext(ShopifyConnectionContext);
