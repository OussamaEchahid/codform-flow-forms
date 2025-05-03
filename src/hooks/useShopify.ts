
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  manualReconnect: () => void; // explicitly void return type
  verifyShopifyConnection: () => Promise<boolean>;
  refreshConnection: () => Promise<boolean | undefined>;
  syncFormWithShopify: (formData: any) => Promise<boolean>;
  lastConnectionAttempt: number;
}

/**
 * Improved Shopify hook with connection stability
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
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState<number>(0);
  
  // Use refs to prevent excessive connection checks
  const connectionCheckInProgress = useRef<boolean>(false);
  const connectionAttemptCount = useRef<number>(0);
  const maxConnectionAttempts = 3;

  // Check initial connection status with improved caching
  useEffect(() => {
    // Check localStorage for cached connection status
    const cachedConnected = localStorage.getItem('shopify_connected') === 'true';
    const cachedShop = localStorage.getItem('shopify_shop');
    const lastCheckTime = parseInt(localStorage.getItem('shopify_last_check_time') || '0', 10);
    const now = Date.now();
    
    // Set initial states from cache
    setIsConnected(cachedConnected);
    setShop(cachedShop);
    setConnectionStatus(cachedConnected);
    
    // Only verify if it's been more than 5 minutes since last check
    const checkInterval = 5 * 60 * 1000; // 5 minutes
    
    if ((now - lastCheckTime) > checkInterval && cachedShop) {
      // Delay the check to prevent issues during component mounting
      const timer = setTimeout(() => {
        verifyShopifyConnection().catch(err => {
          console.error('[useShopify] Initial connection check failed:', err);
        });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    // Log status for debugging
    console.log('[useShopify] Initial state from cache:', { 
      cachedConnected, 
      cachedShop,
      lastCheckTime: new Date(lastCheckTime).toISOString(),
      checkNeeded: (now - lastCheckTime) > checkInterval
    });
  }, []);
  
  // Simple manual reconnect function - explicitly void return type
  const manualReconnect = useCallback((): void => {
    try {
      // Check if we recently attempted to connect
      const now = Date.now();
      const lastAttemptTime = lastConnectionAttempt || 0;
      
      if ((now - lastAttemptTime) < 10000) { // 10 seconds threshold
        console.log('[useShopify] Reconnect throttled, attempted too recently');
        toast.info('Please wait a moment before trying to reconnect again.');
        return;
      }
      
      // Update last connection attempt time
      setLastConnectionAttempt(now);
      setIsRedirecting(true);
      
      // Clear any cached connection state
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_shop');
      
      // Record connection attempt time
      localStorage.setItem('shopify_last_connect_time', now.toString());
      localStorage.setItem('shopify_connection_attempts', 
        (parseInt(localStorage.getItem('shopify_connection_attempts') || '0', 10) + 1).toString());
      
      console.log('[useShopify] Redirecting to Shopify auth page');
      
      // Redirect with parameters to avoid caching
      const clientUrl = window.location.origin;
      const redirectUrl = `/shopify?force=true&ts=${now}&client=${encodeURIComponent(clientUrl)}&r=${Math.random().toString(36).substring(7)}`;
      
      // Use timeout to ensure UI updates before redirect
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 500);
    } catch (error) {
      console.error('[useShopify] Error during reconnect redirect:', error);
      setIsRedirecting(false);
    }
  }, [lastConnectionAttempt]);
  
  // Verify connection status with improved stability
  const verifyShopifyConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Don't check if already in progress
      if (connectionCheckInProgress.current) {
        console.log('[useShopify] Connection check already in progress, skipping');
        return isConnected;
      }
      
      connectionCheckInProgress.current = true;
      setIsLoading(true);
      
      const cachedShop = localStorage.getItem('shopify_shop');
      if (!cachedShop) {
        console.log('[useShopify] No shop found in cache, connection verification failed');
        setConnectionStatus(false);
        setIsConnected(false);
        localStorage.setItem('shopify_last_check_time', Date.now().toString());
        localStorage.setItem('shopify_connected', 'false');
        connectionCheckInProgress.current = false;
        setIsLoading(false);
        return false;
      }
      
      console.log(`[useShopify] Verifying connection for shop: ${cachedShop}`);
      
      // Check for an access token in database
      try {
        const { data: storeData, error: storeError } = await supabase
          .from('shopify_stores')
          .select('access_token, updated_at')
          .eq('shop', cachedShop)
          .maybeSingle();
        
        if (storeError) {
          console.error('[useShopify] Error checking database for token:', storeError);
          setError('Database error checking Shopify connection');
          connectionCheckInProgress.current = false;
          setIsLoading(false);
          return false;
        }
        
        // If we have a token in the database, we're connected
        const hasValidToken = !!(storeData?.access_token);
        
        // Update local cache and state
        localStorage.setItem('shopify_connected', hasValidToken ? 'true' : 'false');
        localStorage.setItem('shopify_last_check_time', Date.now().toString());
        
        console.log('[useShopify] Connection verification result:', { hasValidToken });
        setConnectionStatus(hasValidToken);
        setIsConnected(hasValidToken);
        
        return hasValidToken;
      } catch (dbError) {
        console.error('[useShopify] Database error during verification:', dbError);
        setError('Error verifying Shopify connection');
        return false;
      }
    } catch (error) {
      console.error('[useShopify] Error verifying connection:', error);
      return false;
    } finally {
      connectionCheckInProgress.current = false;
      setIsLoading(false);
    }
  }, [isConnected]);
  
  // Refresh connection status
  const refreshConnection = useCallback(async (): Promise<boolean | undefined> => {
    try {
      const now = Date.now();
      const lastCheckTime = parseInt(localStorage.getItem('shopify_last_check_time') || '0', 10);
      
      // Throttle checks to prevent too many requests
      if ((now - lastCheckTime) < 30000) { // 30 seconds
        console.log('[useShopify] Refresh check throttled, checked too recently');
        return connectionStatus;
      }
      
      // Increment the attempt counter
      connectionAttemptCount.current += 1;
      
      if (connectionAttemptCount.current > maxConnectionAttempts) {
        console.log('[useShopify] Too many refresh attempts, using cached status');
        // Reset counter after a delay
        setTimeout(() => {
          connectionAttemptCount.current = 0;
        }, 60000);
        return connectionStatus;
      }
      
      // Update timestamp in localStorage to prevent unnecessary rechecks
      localStorage.setItem('shopify_last_check_time', now.toString());
      
      // Simply check connection status
      return await verifyShopifyConnection();
    } catch (error) {
      console.error('[useShopify] Error refreshing connection:', error);
      return undefined;
    } finally {
      // Reset attempt counter after some time
      setTimeout(() => {
        connectionAttemptCount.current = 0;
      }, 60000);
    }
  }, [verifyShopifyConnection, connectionStatus]);
  
  // Simplified form sync function
  const syncFormWithShopify = useCallback(async (formData: any): Promise<boolean> => {
    try {
      // Don't sync if not connected
      if (!isConnected || !shop) {
        console.log('[useShopify] Cannot sync - not connected to Shopify');
        return false;
      }
      
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
  }, [isConnected, shop]);
  
  return {
    isConnected,
    shop,
    isLoading,
    isSyncing,
    connectionStatus,
    products,
    error,
    isRedirecting,
    manualReconnect,
    verifyShopifyConnection,
    refreshConnection,
    syncFormWithShopify,
    lastConnectionAttempt
  };
};
