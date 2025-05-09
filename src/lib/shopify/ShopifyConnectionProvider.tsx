
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { shopifyStores } from '@/lib/shopify/supabase-client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { connectionLogger } from '@/lib/shopify/debug-logger';

// Context interface
interface ShopifyConnectionContextType {
  isConnected: boolean;
  shopDomain: string | null;
  isLoading: boolean;
  isValidating: boolean; // Added this property to fix the error
  error: string | null;
  syncState: () => Promise<void>;
  forceSetConnected: (shop: string) => void;
  disconnect: () => Promise<void>;
  reload: () => Promise<void>;
}

// Create context with default values
const ShopifyConnectionContext = createContext<ShopifyConnectionContextType>({
  isConnected: false,
  shopDomain: null,
  isLoading: true,
  isValidating: false, // Added with default value of false
  error: null,
  syncState: async () => {},
  forceSetConnected: () => {},
  disconnect: async () => {},
  reload: async () => {},
});

// Provider component
export function ShopifyConnectionProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [shopDomain, setShopDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false); // Added this state variable
  const [error, setError] = useState<string | null>(null);
  const [syncAttempts, setSyncAttempts] = useState<number>(0);
  
  // Force set connected state
  const forceSetConnected = useCallback((shop: string) => {
    if (!shop) return;
    
    setShopDomain(shop);
    setIsConnected(true);
    setError(null);
    
    // Update local storage
    localStorage.setItem('shopify_store', shop);
    localStorage.setItem('shopify_connected', 'true');
    
    // Update connection manager
    shopifyConnectionManager.addOrUpdateStore(shop, true);
    
    connectionLogger.info(`Forced connection state to connected with shop: ${shop}`);
  }, []);
  
  // Sync state with all sources of truth
  const syncState = useCallback(async () => {
    try {
      setIsValidating(true); // Added to indicate validation in progress
      setSyncAttempts(prev => prev + 1);
      
      // Collect data from all sources
      const storedShop = localStorage.getItem('shopify_store');
      const isConnectedInStorage = localStorage.getItem('shopify_connected') === 'true';
      const activeStore = shopifyConnectionManager.getActiveStore();
      const inRecovery = syncAttempts >= 3;
      
      connectionLogger.info('Synchronizing connection state:', {
        localStorage: {
          storedShop,
          isConnected: isConnectedInStorage
        },
        connectionManager: {
          activeStore,
          storeCount: shopifyConnectionManager.getAllStores().length
        },
        currentState: {
          shop: shopDomain,
          shopifyConnected: isConnected
        },
        syncAttempts,
        inRecovery,
        timestamp: Date.now()
      });
      
      // Reset error state
      setError(null);
      
      // If we have any indication of connection, use that shop
      let shopToUse = shopDomain || storedShop || activeStore;
      
      // If no shop found anywhere, we're not connected
      if (!shopToUse) {
        setIsConnected(false);
        setShopDomain(null);
        setIsLoading(false);
        setIsValidating(false); // Added to indicate validation is complete
        return;
      }
      
      // Set shop domain 
      setShopDomain(shopToUse);
      
      // Check if we have a token for this shop in the database
      try {
        const { data, error } = await shopifyStores()
          .select('*')
          .eq('shop', shopToUse)
          .order('updated_at', { ascending: false })
          .limit(1);
        
        if (error) {
          connectionLogger.error('Error fetching store from database:', error);
          // If database query fails but we have other evidence of connection,
          // still consider connected
          if (isConnectedInStorage || activeStore) {
            setIsConnected(true);
          }
        } else if (data && data.length > 0) {
          // Store exists in database
          setIsConnected(true);
          
          // Test token if this isn't a recovery attempt
          if (!inRecovery && data[0].access_token) {
            try {
              await testToken(shopToUse, data[0].access_token);
            } catch (testError) {
              connectionLogger.error('Token test failed:', testError);
              // Even if token test fails, we still consider connected
              // but will show an error
            }
          }
        } else {
          // No store in database, but we might still be in a transition state
          // Trust local storage and connection manager as fallbacks
          setIsConnected(isConnectedInStorage || !!activeStore);
          
          if (isConnectedInStorage || activeStore) {
            // Try to create a store record if possible
            try {
              await shopifyStores().insert({
                shop: shopToUse,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              connectionLogger.info(`Created store record for ${shopToUse}`);
            } catch (insertError) {
              connectionLogger.error('Error creating store record:', insertError);
            }
          }
        }
      } catch (dbError) {
        connectionLogger.error('Database error during syncState:', dbError);
        // If database query fails but we have other evidence of connection,
        // still consider connected
        if (isConnectedInStorage || activeStore) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
          setError('Could not verify connection state');
        }
      }
      
      // Always update localStorage and connection manager with current state
      localStorage.setItem('shopify_store', shopToUse);
      localStorage.setItem('shopify_connected', isConnected ? 'true' : 'false');
      
      shopifyConnectionManager.addOrUpdateStore(shopToUse, isConnected);
      
      connectionLogger.info(`Connection state synchronized to ${isConnected ? 'connected' : 'disconnected'} with shop: ${shopToUse}`);
    } catch (error) {
      connectionLogger.error('Error during syncState:', error);
      setError('Error synchronizing connection state');
    } finally {
      setIsLoading(false);
      setIsValidating(false); // Added to ensure validation is complete
    }
  }, [shopDomain, isConnected, syncAttempts]);
  
  // Function to test a token
  const testToken = async (shop: string, token: string): Promise<boolean> => {
    if (!shop || !token) return false;
    
    try {
      // Just test if the shop is accessible
      const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
      const response = await fetch(`https://${shopDomain}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      return true;
    } catch (error) {
      connectionLogger.error('Token test error:', error);
      throw error;
    }
  };
  
  // Reload function - recheck connection state
  const reload = useCallback(async () => {
    setIsLoading(true);
    setIsValidating(true); // Added to indicate validation in progress
    await syncState();
  }, [syncState]);
  
  // Disconnect function
  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsValidating(true); // Added to indicate validation in progress
      
      // Clear local storage
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_last_url_shop');
      
      // Clear connection manager
      shopifyConnectionManager.clearAllStores();
      
      // Mark store as inactive in database if we have a shop
      if (shopDomain) {
        try {
          await shopifyStores()
            .update({ 
              is_active: false,
              access_token: null
            })
            .eq('shop', shopDomain);
          
          connectionLogger.info(`Marked ${shopDomain} as inactive in database`);
        } catch (dbError) {
          connectionLogger.error('Error updating database during disconnect:', dbError);
        }
      }
      
      // Update state
      setIsConnected(false);
      setShopDomain(null);
      setError(null);
      
      connectionLogger.info('Successfully disconnected from Shopify');
    } catch (error) {
      connectionLogger.error('Error during disconnect:', error);
      setError('Error disconnecting from Shopify');
    } finally {
      setIsLoading(false);
      setIsValidating(false); // Added to ensure validation is complete
    }
  }, [shopDomain]);
  
  // Check URL parameters on mount for shop parameter
  useEffect(() => {
    const checkUrlShop = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const shopParam = urlParams.get('shop');
        
        connectionLogger.info('Checking shop from URL:', { 
          shopDomain: shopParam,
          isShopifyRequest: !!shopParam
        });
        
        if (shopParam) {
          // Save for recovery
          localStorage.setItem('shopify_last_url_shop', shopParam);
          
          // Set active shop in connection manager
          shopifyConnectionManager.setActiveStore(shopParam);
          
          connectionLogger.info(`Setting active shop from URL: ${shopParam}`);
          
          // Allow state to be initialized by regular sync
        }
      } catch (error) {
        connectionLogger.error('Error checking URL parameters:', error);
      }
    };
    
    checkUrlShop();
  }, []);
  
  // Check connection manager on mount
  useEffect(() => {
    const checkConnectionManager = () => {
      try {
        const activeStore = shopifyConnectionManager.getActiveStore();
        
        if (activeStore) {
          connectionLogger.info(`Setting active shop from connection manager: ${activeStore}`);
          forceSetConnected(activeStore);
        }
      } catch (error) {
        connectionLogger.error('Error checking connection manager:', error);
      }
    };
    
    checkConnectionManager();
  }, [forceSetConnected]);
  
  // Initialize connection state on mount
  useEffect(() => {
    syncState();
  }, [syncState]);
  
  // Effect to check if connection state has stabilized
  useEffect(() => {
    if (syncAttempts > 0 && syncAttempts < 3) {
      // Check again in a moment to ensure state is stable
      const timeout = setTimeout(() => {
        syncState();
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
    
    if (syncAttempts >= 3 && syncAttempts < 10) {
      // Connection state seems unstable, retry with exponential backoff
      const timeout = setTimeout(() => {
        syncState();
      }, Math.min(1000 * Math.pow(2, syncAttempts - 3), 30000));
      
      return () => clearTimeout(timeout);
    }
    
    if (syncAttempts >= 10) {
      // After many attempts, state is still unstable - stop trying
      connectionLogger.info('Connection state stabilization attempts exhausted');
    }
    
    // When connection appears stable, reset attempts counter
    if (syncAttempts > 0 && isConnected === !!localStorage.getItem('shopify_connected')) {
      const timeout = setTimeout(() => {
        connectionLogger.info('Connection appears stable, reset sync attempts counter');
        setSyncAttempts(0);
      }, 60000);
      
      return () => clearTimeout(timeout);
    }
  }, [syncAttempts, isConnected, syncState]);
  
  // Context value
  const value: ShopifyConnectionContextType = {
    isConnected,
    shopDomain,
    isLoading,
    isValidating,  // Added to context value
    error,
    syncState,
    forceSetConnected,
    disconnect,
    reload
  };
  
  return (
    <ShopifyConnectionContext.Provider value={value}>
      {children}
    </ShopifyConnectionContext.Provider>
  );
}

// Hook for consumers
export function useShopifyConnection() {
  return useContext(ShopifyConnectionContext);
}
