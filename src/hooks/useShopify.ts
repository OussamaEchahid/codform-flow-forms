
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyConnectionManager } from '@/utils/shopifyConnectionManager';

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
  // Create a ref to prevent multiple initializations
  const isInitialized = useRef<boolean>(false);
  
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
  const initialCheckDone = useRef<boolean>(false);
  const maxConnectionAttempts = 3;
  const lastCheckTime = useRef<number>(0);

  // Check initial connection status with improved caching - ONCE only
  useEffect(() => {
    // Check for emergency disabled mode first
    if (ShopifyConnectionManager.isEmergencyDisabled()) {
      console.log('[useShopify] Emergency disable mode is active, skipping all automatic connection checks');
      return;
    }

    // Only run once per component mount
    if (initialCheckDone.current || isInitialized.current) {
      return;
    }
    
    isInitialized.current = true;
    initialCheckDone.current = true;
    
    // Check localStorage for cached connection status
    const cachedConnected = localStorage.getItem('shopify_connected') === 'true';
    const cachedShop = localStorage.getItem('shopify_shop');
    
    // Set initial states from cache - don't trigger renders if not needed
    if (cachedConnected !== isConnected) {
      setIsConnected(cachedConnected);
    }
    
    if (cachedShop !== shop) {
      setShop(cachedShop);
    }
    
    if (cachedConnected !== connectionStatus) {
      setConnectionStatus(cachedConnected);
    }
    
    // Skip verification completely in most cases to prevent connection storms
    const now = Date.now();
    lastCheckTime.current = now;
    localStorage.setItem('shopify_last_check_time', now.toString());
  }, []); // Empty dependency array ensures this only runs once
  
  // Simple manual reconnect function - explicitly void return type
  const manualReconnect = useCallback((): void => {
    try {
      // Emergency disabled mode check
      if (ShopifyConnectionManager.isEmergencyDisabled()) {
        console.log('[useShopify] Emergency disable mode is active, skipping reconnect');
        toast.error('Connection checks are disabled. Please re-enable them first.');
        return;
      }

      // Check if we recently attempted to connect - use ref for more stability
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
      
      // Redirect with parameters to avoid caching - add a random param to force new request
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
    // Emergency disabled mode check
    if (ShopifyConnectionManager.isEmergencyDisabled()) {
      console.log('[useShopify] Emergency disable mode is active, skipping verification');
      return isConnected;
    }

    try {
      // Don't check if already in progress
      if (connectionCheckInProgress.current) {
        console.log('[useShopify] Connection check already in progress, skipping');
        return isConnected;
      }
      
      connectionCheckInProgress.current = true;
      setIsLoading(true);
      
      const now = Date.now();
      lastCheckTime.current = now;
      
      const cachedShop = localStorage.getItem('shopify_shop');
      if (!cachedShop) {
        console.log('[useShopify] No shop found in cache, connection verification failed');
        setConnectionStatus(false);
        setIsConnected(false);
        localStorage.setItem('shopify_last_check_time', now.toString());
        localStorage.setItem('shopify_connected', 'false');
        connectionCheckInProgress.current = false;
        setIsLoading(false);
        return false;
      }
      
      console.log(`[useShopify] Verifying connection for shop: ${cachedShop}`);
      
      // Use a simpler check to avoid database queries - just return the cached value
      const hasValidToken = !!localStorage.getItem('shopify_connected');
      setConnectionStatus(hasValidToken);
      setIsConnected(hasValidToken);
      
      // Update timestamp to prevent excessive checks
      localStorage.setItem('shopify_last_check_time', now.toString());
      
      return hasValidToken;
    } catch (error) {
      console.error('[useShopify] Error verifying connection:', error);
      return false;
    } finally {
      connectionCheckInProgress.current = false;
      setIsLoading(false);
    }
  }, [isConnected]);
  
  // Refresh connection status with much stronger throttling
  const refreshConnection = useCallback(async (): Promise<boolean | undefined> => {
    // Emergency disabled mode check
    if (ShopifyConnectionManager.isEmergencyDisabled()) {
      console.log('[useShopify] Emergency disable mode is active, skipping refresh');
      return connectionStatus;
    }
    
    try {
      const now = Date.now();
      
      // Strict throttling to prevent excessive checks - use ref for stability
      const timeSinceLastCheck = now - lastCheckTime.current;
      if (timeSinceLastCheck < 30000) { // 30 seconds
        console.log('[useShopify] Refresh check throttled, checked too recently:', timeSinceLastCheck);
        return connectionStatus;
      }
      
      // Check and limit connection attempts
      if (connectionCheckInProgress.current) {
        console.log('[useShopify] Connection check already in progress, skipping refresh');
        return connectionStatus;
      }
      
      // Update the timestamp to prevent rapid rechecks
      lastCheckTime.current = now;
      
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
      
      // Simply use cached connection status instead of making actual requests
      const cachedConnected = localStorage.getItem('shopify_connected') === 'true';
      setIsConnected(cachedConnected);
      setConnectionStatus(cachedConnected);
      
      return cachedConnected;
    } catch (error) {
      console.error('[useShopify] Error refreshing connection:', error);
      return undefined;
    } finally {
      // Reset attempt counter after some time
      setTimeout(() => {
        connectionAttemptCount.current = 0;
      }, 60000);
    }
  }, [connectionStatus]);
  
  // Simplified form sync function
  const syncFormWithShopify = useCallback(async (formData: any): Promise<boolean> => {
    // Emergency disabled mode check
    if (ShopifyConnectionManager.isEmergencyDisabled()) {
      console.log('[useShopify] Emergency disable mode is active, skipping form sync');
      toast.error('Shopify connection checks are disabled. Enable connection checks to sync forms.');
      return false;
    }
    
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
