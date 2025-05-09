
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { shopifyStores } from '@/lib/shopify/supabase-client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { connectionLogger } from '@/lib/shopify/debug-logger';

// Context interface
interface ShopifyConnectionContextType {
  isConnected: boolean;
  shopDomain: string | null;
  isLoading: boolean;
  isValidating: boolean;
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
  isValidating: false,
  error: null,
  syncState: async () => {},
  forceSetConnected: () => {},
  disconnect: async () => {},
  reload: async () => {},
});

// Manage token validation cache with timestamps to avoid excessive API calls
const tokenValidationCache = new Map<string, { valid: boolean; timestamp: number }>()

// Max validation attempts before backing off
const MAX_SYNC_ATTEMPTS = 3;
// Cache validation results for this many milliseconds
const VALIDATION_CACHE_MS = 5 * 60 * 1000; // 5 minutes

// Provider component
export function ShopifyConnectionProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [shopDomain, setShopDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncAttempts, setSyncAttempts] = useState<number>(0);
  const validationInProgress = useRef<boolean>(false);
  const lastSyncTimestamp = useRef<number>(0);
  
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
  
  // Function to test a token with caching to avoid excessive API calls
  const testToken = useCallback(async (shop: string, token: string): Promise<boolean> => {
    if (!shop || !token) return false;
    
    // Check cache first to avoid excessive API calls
    const cacheKey = `${shop}:${token.substring(0, 8)}`;
    const cachedValidation = tokenValidationCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedValidation && (now - cachedValidation.timestamp) < VALIDATION_CACHE_MS) {
      connectionLogger.debug(`Using cached token validation for ${shop}: ${cachedValidation.valid}`);
      return cachedValidation.valid;
    }
    
    try {
      // Just test if the shop is accessible
      const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
      connectionLogger.debug(`Testing token for shop: ${shopDomain}`);
      
      const response = await fetch(`https://${shopDomain}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json'
        }
      });
      
      const isValid = response.ok;
      
      // Cache the validation result
      tokenValidationCache.set(cacheKey, { 
        valid: isValid, 
        timestamp: now 
      });
      
      if (!isValid) {
        connectionLogger.warn(`Token validation failed for ${shop} with status ${response.status}`);
      } else {
        connectionLogger.info(`Token validation successful for ${shop}`);
      }
      
      return isValid;
    } catch (error) {
      connectionLogger.error('Token test error:', error);
      // Cache the negative result to avoid hammering the API with failed requests
      tokenValidationCache.set(cacheKey, { 
        valid: false, 
        timestamp: now 
      });
      return false;
    }
  }, []);
  
  // Sync state with all sources of truth, with rate limiting
  const syncState = useCallback(async () => {
    // Don't allow multiple syncs at the same time
    if (validationInProgress.current) {
      connectionLogger.debug('Sync already in progress, skipping');
      return;
    }
    
    // Apply rate limiting - only sync once per second at most
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTimestamp.current;
    if (timeSinceLastSync < 1000 && syncAttempts > 0) {
      connectionLogger.debug(`Rate limiting sync, last sync was ${timeSinceLastSync}ms ago`);
      return;
    }
    
    validationInProgress.current = true;
    setIsValidating(true);
    lastSyncTimestamp.current = now;
    
    try {
      setSyncAttempts(prev => prev + 1);
      
      // Collect data from all sources
      const storedShop = localStorage.getItem('shopify_store');
      const isConnectedInStorage = localStorage.getItem('shopify_connected') === 'true';
      const activeStore = shopifyConnectionManager.getActiveStore();
      const inRecovery = syncAttempts >= MAX_SYNC_ATTEMPTS;
      
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
        timestamp: now
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
        setIsValidating(false);
        validationInProgress.current = false;
        return;
      }
      
      // Set shop domain 
      setShopDomain(shopToUse);
      
      // Check if we have a token for this shop in the database
      try {
        // Only verify with the database if recovery mode isn't active
        // to reduce database load
        if (!inRecovery) {
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
            
            // Test token only once per session and only if not in recovery mode
            // to prevent excessive API calls
            if (!inRecovery && data[0].access_token && syncAttempts <= 1) {
              try {
                const isValid = await testToken(shopToUse, data[0].access_token);
                if (!isValid) {
                  connectionLogger.warn(`Token test failed for ${shopToUse}, but keeping connection active`);
                }
              } catch (testError) {
                connectionLogger.error('Token test error:', testError);
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
        } else {
          // In recovery mode, trust local storage to reduce load
          setIsConnected(isConnectedInStorage || !!activeStore);
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
      setIsValidating(false);
      validationInProgress.current = false;
    }
  }, [shopDomain, isConnected, syncAttempts, testToken]);
  
  // Reload function - recheck connection state
  const reload = useCallback(async () => {
    // Skip if we've already validated too many times
    if (syncAttempts >= MAX_SYNC_ATTEMPTS) {
      connectionLogger.warn('Too many sync attempts, skipping reload');
      return;
    }
    
    setIsLoading(true);
    setIsValidating(true);
    await syncState();
  }, [syncState, syncAttempts]);
  
  // Disconnect function
  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsValidating(true);
      
      // Clear local storage
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_last_url_shop');
      
      // Clear connection manager
      shopifyConnectionManager.clearAllStores();
      
      // Reset validation cache
      tokenValidationCache.clear();
      
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
      setSyncAttempts(0);
      
      connectionLogger.info('Successfully disconnected from Shopify');
    } catch (error) {
      connectionLogger.error('Error during disconnect:', error);
      setError('Error disconnecting from Shopify');
    } finally {
      setIsLoading(false);
      setIsValidating(false);
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
  
  // Initialize connection state on mount - only once
  useEffect(() => {
    syncState();
    // This effect should only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Effect to check if connection state has stabilized
  useEffect(() => {
    if (syncAttempts > 0 && syncAttempts < MAX_SYNC_ATTEMPTS) {
      // Check again in a moment to ensure state is stable
      const timeout = setTimeout(() => {
        syncState();
      }, 1000 * syncAttempts); // Increasing delay between attempts
      
      return () => clearTimeout(timeout);
    }
    
    if (syncAttempts >= MAX_SYNC_ATTEMPTS) {
      // Connection state seems unstable, stop trying to avoid infinite loops
      connectionLogger.info('Connection state stabilization attempts exhausted, entering recovery mode');
      
      // Reset attempts counter after a long timeout
      const timeout = setTimeout(() => {
        setSyncAttempts(0);
        connectionLogger.info('Reset sync attempts counter after timeout');
      }, 60000); // 1 minute timeout
      
      return () => clearTimeout(timeout);
    }
  }, [syncAttempts, syncState]);
  
  // Context value
  const value: ShopifyConnectionContextType = {
    isConnected,
    shopDomain,
    isLoading,
    isValidating,
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
