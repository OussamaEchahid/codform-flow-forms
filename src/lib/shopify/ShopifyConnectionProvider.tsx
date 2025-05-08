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
  reload: () => Promise<void>;
  disconnect: () => Promise<void>;
  syncState: () => Promise<boolean>;
}

// Create the context with default values
const ShopifyConnectionContext = createContext<ShopifyConnectionContextType>({
  isConnected: false,
  shopDomain: null,
  isLoading: true,
  error: null,
  isValidating: false,
  reload: async () => {},
  disconnect: async () => {},
  syncState: async () => false,
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
  
  // Add a validation counter to prevent infinite validation loops
  const validationAttempts = useRef<number>(0);
  const maxValidationAttempts = 3; // Maximum number of validation attempts
  
  // Cache validated connection to prevent redundant validations
  const cachedValidation = useRef<{
    shop: string | null;
    isValid: boolean;
    timestamp: number;
  }>({ shop: null, isValid: false, timestamp: 0 });

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
      const { data, error } = await shopifyStores()
        .select('access_token')
        .eq('shop', shop)
        .eq('is_active', true)
        .limit(1);
      
      if (error || !data || data.length === 0 || !data[0].access_token) {
        connectionLogger.error('No active token found for shop:', { shop, error });
        return false;
      }
      
      // Test token with edge function
      const token = data[0].access_token;
      const response = await shopifySupabase.functions.invoke('shopify-test-connection', {
        body: { shop, accessToken: token },
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.error) {
        connectionLogger.error('Token test failed:', response.error);
        return false;
      }
      
      // Update cache with successful validation
      cachedValidation.current = {
        shop,
        isValid: response.data?.success || false,
        timestamp: now
      };
      
      connectionLogger.info('Token test successful:', { shop, success: response.data?.success });
      return response.data?.success || false;
    } catch (error) {
      connectionLogger.error('Error testing connection:', error);
      return false;
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
      
      // Test connection with Shopify
      const isValid = await testConnection(shop);
      
      if (!isValid) {
        connectionLogger.warn('Connection test failed for shop:', shop);
        setIsConnected(false);
        setError('Connection test failed. Token may be invalid.');
        
        // Clear localStorage if invalid
        localStorage.removeItem('shopify_connected');
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
      setIsConnected(false);
      setError('Error validating connection');
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [getShopDomain, testConnection]);

  // Initialize connection on mount
  useEffect(() => {
    validateConnection();
  }, [validateConnection]);

  // Reload connection state
  const reload = useCallback(async () => {
    await validateConnection(true); // Force validation
  }, [validateConnection]);
  
  // Disconnect shop
  const disconnect = useCallback(async () => {
    try {
      connectionLogger.info('Disconnecting Shopify store');
      
      // Update local state
      setIsConnected(false);
      setShopDomain(null);
      
      // Clear localStorage
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      
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
      
      // Update localStorage
      localStorage.setItem('shopify_store', shop);
      localStorage.setItem('shopify_connected', 'true');
      
      // Update connection manager
      shopifyConnectionManager.setActiveStore(shop);
      
      // Update database using async/await pattern to avoid Promise issues
      try {
        await shopifyStores()
          .update({ is_active: true })
          .eq('shop', shop);
        
        connectionLogger.info('Updated database with active store:', shop);
      } catch (dbError) {
        connectionLogger.error('Error updating database:', dbError);
        // Continue execution - don't let DB errors stop the sync
      }
      
      return true;
    } catch (error) {
      connectionLogger.error('Error syncing state:', error);
      return false;
    }
  }, [getShopDomain]);

  // Context value
  const value = {
    isConnected,
    shopDomain,
    isLoading,
    error,
    isValidating,
    reload,
    disconnect,
    syncState
  };

  return (
    <ShopifyConnectionContext.Provider value={value}>
      {children}
    </ShopifyConnectionContext.Provider>
  );
};
