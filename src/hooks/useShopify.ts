
import { useState, useEffect, useCallback } from 'react';

// Define proper return type for the hook
export interface UseShopifyReturn {
  isConnected: boolean;
  shop: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  connectionStatus: boolean | undefined;
  products: any[];
  error: string | null;
  isRedirecting: boolean;
  manualReconnect: () => void;
  verifyShopifyConnection: () => Promise<boolean>;
  refreshConnection: () => Promise<boolean | undefined>;
  syncFormWithShopify: (formData: any) => Promise<boolean>;
}

/**
 * Simplified Shopify hook that handles connection status and actions
 */
export const useShopify = (): UseShopifyReturn => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | undefined>(undefined);
  const [shop, setShop] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  
  // Check initial connection status
  useEffect(() => {
    // Check localStorage for cached connection status
    const cachedConnected = localStorage.getItem('shopify_connected') === 'true';
    const cachedShop = localStorage.getItem('shopify_shop');
    
    setIsConnected(cachedConnected);
    setShop(cachedShop);
    setConnectionStatus(cachedConnected);
    
    // Log status for debugging
    console.log('[useShopify] Initial state:', { 
      cachedConnected, 
      cachedShop 
    });
  }, []);
  
  // Simple manual reconnect function
  const manualReconnect = useCallback((): void => {
    try {
      // Mark redirect in progress
      setIsRedirecting(true);
      
      // Clear any cached connection state
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_shop');
      
      // Record connection attempt time
      localStorage.setItem('shopify_last_connect_time', Date.now().toString());
      
      console.log('[useShopify] Redirecting to Shopify auth page');
      
      // Redirect with parameters to avoid caching
      const redirectUrl = `/shopify?force=true&ts=${Date.now()}&r=${Math.random().toString(36).substring(7)}`;
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('[useShopify] Error during reconnect redirect:', error);
      setIsRedirecting(false);
    }
  }, []);
  
  // Verify connection status
  const verifyShopifyConnection = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const cachedShop = localStorage.getItem('shopify_shop');
      if (!cachedShop) {
        console.log('[useShopify] No shop found, connection verification failed');
        return false;
      }
      
      // Simple connection check - in a real app this would call the API
      // For now, just return the status from localStorage to avoid infinite loops
      const isConnected = localStorage.getItem('shopify_connected') === 'true';
      
      console.log('[useShopify] Connection verified:', isConnected);
      setConnectionStatus(isConnected);
      setIsConnected(isConnected);
      
      return isConnected;
    } catch (error) {
      console.error('[useShopify] Error verifying connection:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Refresh connection status
  const refreshConnection = useCallback(async (): Promise<boolean | undefined> => {
    try {
      // Update timestamp in localStorage to prevent unnecessary rechecks
      localStorage.setItem('shopify_last_check', Date.now().toString());
      
      // Simply check connection status
      return await verifyShopifyConnection();
    } catch (error) {
      console.error('[useShopify] Error refreshing connection:', error);
      return undefined;
    }
  }, [verifyShopifyConnection]);
  
  // Simplified form sync function
  const syncFormWithShopify = useCallback(async (formData: any): Promise<boolean> => {
    try {
      setIsSyncing(true);
      
      // Simulate API call - in a real app, this would call your backend
      console.log('[useShopify] Syncing form:', formData);
      
      // Simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('[useShopify] Error syncing form:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, []);
  
  return {
    isConnected,
    shop,
    isLoading,
    isSyncing,
    connectionStatus,
    products: [], // Empty array for now
    error,
    isRedirecting,
    manualReconnect,
    verifyShopifyConnection,
    refreshConnection,
    syncFormWithShopify
  };
};
