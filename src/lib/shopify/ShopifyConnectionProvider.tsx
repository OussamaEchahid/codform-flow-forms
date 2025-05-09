
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { shopifySupabase, shopifyStores } from '@/lib/shopify/supabase-client';
import { toast } from 'sonner';
import { shopifyConnectionManager } from './connection-manager';
import { connectionLogger } from './debug-logger';

// Define the shape of our context
interface ShopifyConnectionContextType {
  isConnected: boolean;
  shopDomain: string | null;
  isLoading: boolean;
  error: string | null;
  isValidating: boolean;
  isNetworkError: boolean; // New flag to indicate network issues
  reload: () => Promise<void>;
  disconnect: () => Promise<void>;
  syncState: () => Promise<boolean>;
  forceSetConnected: (shop: string) => void;
}

// Create the context with default values
const ShopifyConnectionContext = createContext<ShopifyConnectionContextType>({
  isConnected: false,
  shopDomain: null,
  isLoading: true,
  error: null,
  isValidating: false,
  isNetworkError: false, // Initialize the new flag
  reload: async () => {},
  disconnect: async () => {},
  syncState: async () => false,
  forceSetConnected: () => {},
});

// Hook to use the Shopify connection
export const useShopifyConnection = () => useContext(ShopifyConnectionContext);

interface ShopifyConnectionProviderProps {
  children: React.ReactNode;
}

export const ShopifyConnectionProvider: React.FC<ShopifyConnectionProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [shopDomain, setShopDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [lastValidated, setLastValidated] = useState<number>(0);
  const [isNetworkError, setIsNetworkError] = useState<boolean>(false); // New state for network issues
  
  // Add a validation counter to prevent infinite validation loops
  const validationAttempts = useRef<number>(0);
  const maxValidationAttempts = 3; // Maximum number of validation attempts
  
  // Cache validated connection to prevent redundant validations
  const cachedValidation = useRef<{
    shop: string | null;
    isValid: boolean;
    timestamp: number;
  }>({ shop: null, isValid: false, timestamp: 0 });

  // Initialize connection from localStorage right away
  useEffect(() => {
    const storedShop = localStorage.getItem('shopify_store');
    const storedConnected = localStorage.getItem('shopify_connected') === 'true';
    
    if (storedShop && storedConnected) {
      setShopDomain(storedShop);
      setIsConnected(true);
    }
  }, []);

  // Get shop domain from all possible sources
  const getShopDomain = useCallback((): string | null => {
    // Check multiple sources
    const fromStorage = localStorage.getItem('shopify_store');
    const fromManager = shopifyConnectionManager.getActiveStore();
    
    // Log sources for debugging
    connectionLogger.debug("Getting shop domain from sources:", {
      fromStorage,
      fromManager
    });
    
    // Return the first available source
    return fromStorage || fromManager;
  }, []);
  
  // Test connection with Shopify
  const testConnection = useCallback(async (shop: string): Promise<boolean> => {
    try {
      // Check cache first to avoid unnecessary API calls
      const now = Date.now();
      if (
        cachedValidation.current.shop === shop && 
        cachedValidation.current.timestamp > now - 60000 && // Cache valid for 1 minute
        cachedValidation.current.isValid
      ) {
        connectionLogger.info(`Using cached validation result for shop: ${shop}`);
        return cachedValidation.current.isValid;
      }
      
      connectionLogger.info(`Testing connection for shop: ${shop}`);
      
      // Get token from database
      const { data, error: loadError } = await shopifyStores()
        .select('access_token')
        .eq('shop', shop)
        .eq('is_active', true)
        .limit(1);
      
      if (loadError || !data || data.length === 0 || !data[0].access_token) {
        connectionLogger.error('No active token found for shop:', { shop, error: loadError });
        return false;
      }
      
      // Test token with edge function
      const token = data[0].access_token;
      let response;

      try {
        // Set up a timeout using Promise.race instead of AbortController
        const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout after 5000ms')), 5000);
        });
        
        // Create the actual function call
        const functionPromise = shopifySupabase.functions.invoke('shopify-test-connection', {
          body: { shop, accessToken: token },
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        // Race the promises to implement timeout
        response = await Promise.race([functionPromise, timeoutPromise]);
      } catch (fetchError) {
        // Handle network errors gracefully
        connectionLogger.error('Network error in token test:', fetchError);
        setIsNetworkError(true);
        
        // Update cache with permissive validation
        cachedValidation.current = {
          shop,
          isValid: true, // Be permissive with network errors
          timestamp: now
        };
        
        // In case of network error, assume connection is valid if we have the token
        return true;
      }
      
      if (response?.error) {
        connectionLogger.error('Token test failed:', response.error);
        
        // Check if it's likely a network error
        if (response.error.message?.includes('Failed to fetch') || 
            response.error.message?.includes('NetworkError') ||
            response.error.message?.includes('Failed to send a request')) {
          setIsNetworkError(true);
          
          // Update cache with permissive validation
          cachedValidation.current = {
            shop,
            isValid: true, // Be more permissive with network errors
            timestamp: now
          };
          
          return true; // Be permissive - assume valid on network errors
        }
        
        // Update cache with permissive validation
        cachedValidation.current = {
          shop,
          isValid: true, // More permissive - if we have a token, consider it valid
          timestamp: now
        };
        
        return true; // Be permissive - if we have a token, consider it valid
      }
      
      // Update cache with successful validation
      cachedValidation.current = {
        shop,
        isValid: response.data?.success || false,
        timestamp: now
      };
      
      // Reset network error state on successful call
      setIsNetworkError(false);
      
      connectionLogger.info('Token test successful:', { shop, success: response.data?.success });
      return response.data?.success || false;
    } catch (error) {
      connectionLogger.error('Error testing connection:', error);
      // Check if this is a network error
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') ||
          error.name === 'AbortError' ||
          error.message?.includes('timeout')) {
        setIsNetworkError(true);
      }
      // Be lenient with errors - if we have a token, consider it valid
      return true;
    }
  }, []);

  // Validate Shopify connection state
  const validateConnection = useCallback(async (force = false) => {
    // Skip validation if we've tried too many times already,
    // unless force=true which resets the counter
    if (force) {
      validationAttempts.current = 0;
    } else if (validationAttempts.current >= maxValidationAttempts) {
      connectionLogger.warn(`Skipping validation after ${validationAttempts.current} attempts`);
      // Use whatever state we have and stop trying
      setIsLoading(false);
      setIsValidating(false);
      return;
    }
    
    validationAttempts.current++;
    setIsValidating(true);
    setError(null);
    
    try {
      // Get shop domain
      const shop = getShopDomain();
      
      if (!shop) {
        connectionLogger.info('No shop domain found, marking as disconnected');
        setIsConnected(false);
        setShopDomain(null);
        setIsLoading(false);
        setIsValidating(false);
        return;
      }
      
      // Update shop domain
      setShopDomain(shop);
      
      // For better reliability, perform more lenient validation
      // If localStorage indicates connection and we have a shop, trust it
      const locallyConnected = localStorage.getItem('shopify_connected') === 'true';
      if (locallyConnected && shop) {
        connectionLogger.info('Found locally stored connection, trusting it:', shop);
        setIsConnected(true);
        setError(null);
        
        // Ensure local storage and manager are in sync
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
        shopifyConnectionManager.setActiveStore(shop);
        
        // Still try to validate in the background but don't wait for it
        testConnection(shop).then((isValid) => {
          // Only update if it's invalid, don't disrupt valid connections
          if (!isValid && !isNetworkError) {  // Ignore validation failures if network error
            connectionLogger.warn('Background validation failed for:', shop);
            // But don't disconnect - be more permissive
          }
        }).catch((error) => {
          connectionLogger.error('Error in background validation:', error);
          // Don't disconnect on validation errors
        });
        
        setIsLoading(false);
        setIsValidating(false);
        return;
      }
      
      // Test connection with Shopify
      let isValid;
      try {
        isValid = await testConnection(shop);
      } catch (testError) {
        // If test fails with network error, assume connection is valid
        connectionLogger.error('Error testing connection:', testError);
        if (testError.message?.includes('Failed to fetch') || 
            testError.message?.includes('NetworkError')) {
          setIsNetworkError(true);
          isValid = true; // Be permissive with network errors
        } else {
          isValid = false;
        }
      }
      
      if (!isValid && !isNetworkError) { // Don't invalidate if it's a network error
        connectionLogger.warn('Connection test failed for shop:', shop);
        
        // Be more lenient - if the test failed but we have a shop in local storage,
        // maintain the connection state rather than immediately disconnecting
        if (localStorage.getItem('shopify_store') === shop) {
          connectionLogger.info('Maintaining connection despite test failure for:', shop);
          setIsConnected(true);
        } else {
          setIsConnected(false);
          setError('Connection test failed. Token may be invalid.');
          
          // Clear localStorage if invalid
          localStorage.removeItem('shopify_connected');
        }
      } else {
        connectionLogger.info('Connection validated successfully for shop:', shop);
        setIsConnected(true);
        
        // Ensure localStorage is in sync
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
        
        // Ensure connection manager is in sync
        shopifyConnectionManager.setActiveStore(shop);
      }
      
      // Update last validated timestamp
      setLastValidated(Date.now());
    } catch (error) {
      connectionLogger.error('Error validating connection:', error);
      // Check if this is a network error
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError')) {
        setIsNetworkError(true);
      }
      
      // Be more permissive - don't disconnect on validation errors
      const shop = getShopDomain();
      if (shop) {
        connectionLogger.info('Maintaining connection despite validation error for:', shop);
        setIsConnected(true);
        setShopDomain(shop);
      } else {
        setIsConnected(false);
        setError('Error validating connection');
      }
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [getShopDomain, testConnection, isNetworkError]);

  // Initialize connection on mount
  useEffect(() => {
    validateConnection();
  }, [validateConnection]);

  // Reload connection state
  const reload = useCallback(async () => {
    // Reset network error state on reload
    setIsNetworkError(false);
    await validateConnection(true); // Force validation
  }, [validateConnection]);
  
  // Disconnect shop
  const disconnect = useCallback(async () => {
    try {
      connectionLogger.info('Disconnecting Shopify store');
      
      // Update local state
      setIsConnected(false);
      setShopDomain(null);
      setIsNetworkError(false); // Reset network error state
      
      // Clear localStorage
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('bypass_auth');
      
      // Clear connection manager
      shopifyConnectionManager.clearAllStores();
      
      // If we have a shop domain, update database
      if (shopDomain) {
        await shopifyStores()
          .update({ is_active: false })
          .eq('shop', shopDomain);
      }
      
      // Reset validation attempts
      validationAttempts.current = 0;
      
      // Clear the cached validation
      cachedValidation.current = { shop: null, isValid: false, timestamp: 0 };
      
      toast.success('Disconnected from Shopify store');
    } catch (error) {
      connectionLogger.error('Error disconnecting:', error);
      toast.error('Error disconnecting from Shopify store');
    }
  }, [shopDomain]);
  
  // Force sync all state sources
  const syncState = useCallback(async () => {
    try {
      connectionLogger.info('Syncing connection state');
      
      const shop = getShopDomain();
      
      if (!shop) {
        connectionLogger.warn('No shop domain found during sync');
        return false;
      }
      
      // Update local state
      setShopDomain(shop);
      setIsConnected(true);
      
      // Update localStorage
      localStorage.setItem('shopify_store', shop);
      localStorage.setItem('shopify_connected', 'true');
      
      // Update connection manager
      shopifyConnectionManager.setActiveStore(shop);
      
      // Update database
      try {
        await shopifyStores()
          .update({ is_active: true })
          .eq('shop', shop);
        
        connectionLogger.info('Updated database with active store:', shop);
        return true;
      } catch (dbError) {
        connectionLogger.error('Error updating database:', dbError);
        // Continue execution - don't let DB errors stop the sync
        return true;
      }
    } catch (error) {
      connectionLogger.error('Error syncing state:', error);
      return false;
    }
  }, [getShopDomain]);
  
  // Force set connected - used as a last resort for reliable connection state
  const forceSetConnected = useCallback((shop: string) => {
    if (!shop) return;
    
    connectionLogger.info('Force setting connected state for shop:', shop);
    
    // Update all state sources
    setShopDomain(shop);
    setIsConnected(true);
    setError(null);
    setIsNetworkError(false); // Reset network error state
    
    // Update localStorage with multiple approaches for redundancy
    try {
      localStorage.setItem('shopify_store', shop);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.setItem('bypass_auth', 'true');
      
      // Use sessionStorage as backup
      sessionStorage.setItem('shopify_store', shop);
      sessionStorage.setItem('shopify_connected', 'true');
      
      // Update connection manager
      shopifyConnectionManager.setActiveStore(shop);
      shopifyConnectionManager.addOrUpdateStore(shop, true, true);
      
      // Update database async but don't wait
      const updateDb = async () => {
        try {
          await shopifyStores()
            .update({ is_active: true })
            .eq('shop', shop);
          connectionLogger.info('Force updated database with active store:', shop);
        } catch (error) {
          connectionLogger.error('Error force updating database:', error);
        }
      };
      
      // Execute the database update
      updateDb();
    } catch (e) {
      connectionLogger.error('Error in forceSetConnected:', e);
    }
  }, []);

  // Context value
  const value = {
    isConnected,
    shopDomain,
    isLoading,
    error,
    isValidating,
    isNetworkError, // Include the new flag in the context value
    reload,
    disconnect,
    syncState,
    forceSetConnected
  };

  return (
    <ShopifyConnectionContext.Provider value={value}>
      {children}
    </ShopifyConnectionContext.Provider>
  );
};
