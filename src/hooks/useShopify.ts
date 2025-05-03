
import { useState, useEffect, useCallback, useRef } from 'react';
import { createRequestTracker } from '@/utils/requestManager';

// Define proper interface for products
interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description?: string;
  price?: string;
  image?: string;
}

export const useShopify = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | undefined>(undefined);
  const [shop, setShop] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  
  // Track connection state with refs
  const connectionStatusRef = useRef(connectionStatus);
  const lastConnectTimeRef = useRef<number>(0);
  const lastCheckTimeRef = useRef<number>(0);
  const requestTrackerRef = useRef(createRequestTracker());
  
  // Throttle times
  const CONNECTION_CHECK_THROTTLE = 300000; // 5 minutes
  const CONNECTION_ACTION_THROTTLE = 10000; // 10 seconds
  
  // Update ref when state changes
  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);
  
  // Function to check if Shopify is connected - drastically simplified
  const checkShopifyConnection = useCallback(async () => {
    // Skip if a check is already in progress
    if (requestTrackerRef.current.isInProgress('check_connection')) {
      console.log('Connection check already in progress, skipping');
      return connectionStatusRef.current;
    }
    
    // Throttle connection checks to avoid excessive API calls
    const now = Date.now();
    if (now - lastCheckTimeRef.current < CONNECTION_CHECK_THROTTLE) {
      console.log('Connection check throttled, using cached status');
      return connectionStatusRef.current;
    }
    
    try {
      // Track this request
      requestTrackerRef.current.trackRequest('check_connection', true);
      
      // Get connection info from localStorage first
      const cachedConnected = localStorage.getItem('shopify_connected');
      const cachedShop = localStorage.getItem('shopify_shop');
      
      // Update states if we have valid data in cache
      if (cachedConnected === 'true' && cachedShop) {
        console.log('Using cached Shopify connection data');
        setIsConnected(true);
        setShop(cachedShop);
      }
      
      // Don't make actual HTTP request if we're in offline mode or the page just loaded
      // Instead rely on cached data only for page load time
      if (navigator.onLine === false) {
        console.log('Offline mode detected, skipping API check');
        return connectionStatusRef.current;
      }
      
      // Make a lightweight request to check connection status
      try {
        const response = await fetch('/dashboard?check_connection=true', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          // Short timeout to avoid hanging
          signal: AbortSignal.timeout(5000)
        });
      
        // Update last check time
        lastCheckTimeRef.current = Date.now();
      
        if (response.ok) {
          const data = await response.json();
          const isNowConnected = data?.shopifyConnected === true;
        
          // Only update state if different to avoid unnecessary re-renders
          if (isConnected !== isNowConnected) {
            setIsConnected(isNowConnected);
          }
        
          if (data?.shop) {
            setShop(data.shop);
            localStorage.setItem('shopify_shop', data.shop);
          }
        
          // Store connection state
          const newConnectionStatus = isNowConnected;
          setConnectionStatus(newConnectionStatus);
          localStorage.setItem('shopify_connected', String(isNowConnected));
          localStorage.setItem('shopify_last_check', String(now));
        
          return newConnectionStatus;
        }
      } catch (fetchError) {
        console.log('Fetch error during connection check, using cached status');
        // Continue with cached status in case of network error
      }
      
      return connectionStatusRef.current;
    } catch (error) {
      console.error('Error checking Shopify connection:', error);
      return connectionStatusRef.current;
    } finally {
      requestTrackerRef.current.trackRequest('check_connection', false);
    }
  }, [isConnected]);
  
  // Initial connection check - throttled and only runs once
  useEffect(() => {
    // Skip if we've already done the check recently
    const lastCheckTime = Number(localStorage.getItem('shopify_last_check') || '0');
    const now = Date.now();
    
    if (now - lastCheckTime < CONNECTION_CHECK_THROTTLE) {
      // Use cached value
      const cachedConnected = localStorage.getItem('shopify_connected') === 'true';
      const cachedShop = localStorage.getItem('shopify_shop');
      
      setIsConnected(cachedConnected);
      setShop(cachedShop);
      setConnectionStatus(cachedConnected);
      
      // Log what we're using
      console.info('Using cached Shopify connection status:', {
        cachedConnected, 
        cachedShop,
        timeSinceLastCheck: now - lastCheckTime
      });
      
      return;
    }
    
    // Only run this once on mount, and with a significant delay
    const initialCheck = async () => {
      try {
        await checkShopifyConnection();
      } catch (error) {
        console.error('Error during initial Shopify connection check:', error);
      }
    };
    
    // Much longer delay of 10 seconds to avoid startup bottlenecks
    const timer = setTimeout(() => {
      initialCheck();
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [checkShopifyConnection]);
  
  // Reconnect to Shopify
  const manualReconnect = useCallback(() => {
    // Throttle reconnection attempts
    const now = Date.now();
    if (now - lastConnectTimeRef.current < CONNECTION_ACTION_THROTTLE) {
      console.log('Reconnect throttled, please wait');
      return false;
    }
    
    // Mark redirect in progress
    setIsRedirecting(true);
    
    // Record connection attempt time
    lastConnectTimeRef.current = now;
    
    try {
      // Redirect to auth flow
      window.location.href = '/auth/?shop=admin';
      return true;
    } catch (error) {
      console.error('Error during reconnect redirect:', error);
      setIsRedirecting(false);
      return false;
    }
  }, []);
  
  // Verify connection by making API request - simplified
  const verifyShopifyConnection = useCallback(async () => {
    // Skip if already checking
    if (requestTrackerRef.current.isInProgress('verify_connection')) {
      return connectionStatusRef.current;
    }
    
    try {
      requestTrackerRef.current.trackRequest('verify_connection', true);
      setIsLoading(true);
      
      // Return cached status if checked recently
      const now = Date.now();
      if (now - lastCheckTimeRef.current < CONNECTION_CHECK_THROTTLE) {
        return connectionStatusRef.current;
      }
      
      // Check connection status
      const newStatus = await checkShopifyConnection();
      return newStatus;
    } catch (error) {
      console.error('Error verifying Shopify connection:', error);
      return false;
    } finally {
      setIsLoading(false);
      requestTrackerRef.current.trackRequest('verify_connection', false);
    }
  }, [checkShopifyConnection]);
  
  // Simplified connection handler
  const refreshConnection = useCallback(async () => {
    // Skip if already refreshing
    if (requestTrackerRef.current.isInProgress('refresh_connection')) {
      return connectionStatusRef.current;
    }
    
    try {
      requestTrackerRef.current.trackRequest('refresh_connection', true);
      
      // Simply check connection without forcing re-auth
      return await verifyShopifyConnection();
    } catch (error) {
      console.error('Error refreshing connection:', error);
      return undefined;
    } finally {
      requestTrackerRef.current.trackRequest('refresh_connection', false);
    }
  }, [verifyShopifyConnection]);
  
  // Sync form with Shopify - minimal implementation
  const syncFormWithShopify = useCallback(async (formData: any) => {
    if (!isConnected) {
      throw new Error('Not connected to Shopify');
    }
    
    if (requestTrackerRef.current.isInProgress('sync_form')) {
      throw new Error('Sync already in progress');
    }
    
    try {
      requestTrackerRef.current.trackRequest('sync_form', true);
      setIsSyncing(true);
      
      // We'll implement a simple simulation for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would call your API endpoint to sync the form
      console.log('Would sync form with data:', formData);
      return true;
    } catch (error) {
      console.error('Error syncing form with Shopify:', error);
      throw error;
    } finally {
      setIsSyncing(false);
      requestTrackerRef.current.trackRequest('sync_form', false);
    }
  }, [isConnected]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      requestTrackerRef.current.clearAllTimeouts();
    };
  }, []);
  
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
    syncFormWithShopify
  };
};
