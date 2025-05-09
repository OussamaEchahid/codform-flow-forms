import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { shopifyStores } from './supabase-client';
import { shopifyConnectionManager } from './connection-manager';
import { connectionLogger } from './debug-logger';
import { toast } from 'sonner';

// DEV STORE CREDENTIALS - ONLY FOR DEVELOPMENT/TESTING
const DEV_TEST_STORE = 'astrem.myshopify.com';
const DEV_TEST_TOKEN = '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';
const ENABLE_DEV_MODE = true; // Can be toggled to enable/disable dev mode

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
  testConnection: (forceRefresh?: boolean) => Promise<boolean>;
  isDevMode: boolean; // Added to track dev mode status
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
  testConnection: async () => false,
  isDevMode: false,
});

// Manage token validation cache with timestamps to avoid excessive API calls
const tokenValidationCache = new Map<string, { valid: boolean; timestamp: number; token: string }>();

// Max validation attempts before backing off
const MAX_SYNC_ATTEMPTS = 3;
// Cache validation results for this many milliseconds (reduced to 2 minutes)
const VALIDATION_CACHE_MS = 2 * 60 * 1000; 
// Token refresh interval when token is valid
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000; // Reduced to 15 minutes

// Provider component
export function ShopifyConnectionProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [shopDomain, setShopDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncAttempts, setSyncAttempts] = useState<number>(0);
  const [isDevMode, setIsDevMode] = useState<boolean>(ENABLE_DEV_MODE);
  const validationInProgress = useRef<boolean>(false);
  const lastSyncTimestamp = useRef<number>(0);
  const tokenRefreshTimer = useRef<NodeJS.Timeout | null>(null);
  const autoRecoveryAttempts = useRef<number>(0);
  const maxAutoRecoveryAttempts = 3;
  
  // Initialize dev mode with test store if enabled
  useEffect(() => {
    if (isDevMode && ENABLE_DEV_MODE) {
      console.log("[DEV MODE] Using development test store:", DEV_TEST_STORE);
      setShopDomain(DEV_TEST_STORE);
      setIsConnected(true);
      
      // Pre-populate the validation cache for dev store
      const cacheKey = `connection:${DEV_TEST_STORE}`;
      tokenValidationCache.set(cacheKey, {
        valid: true,
        timestamp: Date.now(),
        token: DEV_TEST_TOKEN
      });
      
      // Add test store to connection manager
      shopifyConnectionManager.addOrUpdateStore(DEV_TEST_STORE, true);
      
      // Store in localStorage for persistence
      localStorage.setItem('shopify_store', DEV_TEST_STORE);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.setItem('shopify_dev_mode', 'true');
    }
  }, [isDevMode]);
  
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
    
    // Clear all validation cache to force fresh validation on next check
    tokenValidationCache.clear();
    
    connectionLogger.info(`Forced connection state to connected with shop: ${shop}`);
  }, []);
  
  // Clear all token validation cache
  const clearAllValidationCache = useCallback(() => {
    connectionLogger.debug('Clearing all token validation cache');
    tokenValidationCache.clear();
  }, []);
  
  // Test connection function - with proper typing for the optional parameter
  const testConnection = useCallback(async (forceRefresh?: boolean): Promise<boolean> => {
    // Development mode bypass for test store
    if (isDevMode && shopDomain === DEV_TEST_STORE) {
      console.log(`[DEV MODE] Bypassing connection test for test store: ${DEV_TEST_STORE}`);
      return true; // Always return connected in dev mode for test store
    }
    
    // No need to test if we don't have a shop
    if (!shopDomain) {
      connectionLogger.debug('Cannot test connection: no shop domain provided');
      return false;
    }

    // Generate a unique request ID for tracking this validation attempt
    const requestId = `conn_test_${Math.random().toString(36).substring(2, 8)}`;
    connectionLogger.debug(`[${requestId}] Testing connection for shop: ${shopDomain}, forceRefresh: ${forceRefresh}`);

    // Check if we need to force refresh or can use cached result
    if (!forceRefresh) {
      // Check if we have a recent valid cached result
      const cacheKey = `connection:${shopDomain}`;
      const cache = tokenValidationCache.get(cacheKey);
      const now = Date.now();
      
      if (cache && (now - cache.timestamp < VALIDATION_CACHE_MS)) {
        connectionLogger.debug(`[${requestId}] Using cached connection validation for ${shopDomain}: ${cache.valid}`);
        return cache.valid;
      }
    }
    
    // Check if request is already in progress and debounce
    if (validationInProgress.current) {
      connectionLogger.debug(`[${requestId}] Connection test already in progress, waiting...`);
      
      // Wait a bit and check again with exponential backoff
      let waitTime = 250; // Start with 250ms
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        waitTime *= 2; // Double the wait time
        
        // If no longer validating, proceed
        if (!validationInProgress.current) {
          break;
        }
      }
      
      // If still validating after waiting, use cached value if available or assume invalid
      if (validationInProgress.current) {
        const cacheKey = `connection:${shopDomain}`;
        const cache = tokenValidationCache.get(cacheKey);
        connectionLogger.debug(`[${requestId}] Still waiting after timeout, using cached value: ${cache?.valid || false}`);
        return cache?.valid || false;
      }
    }

    validationInProgress.current = true;
    connectionLogger.debug(`[${requestId}] Starting fresh connection test for ${shopDomain}`);
    
    // Start a new request and track it
    try {
      // Special handling for test store in development
      if (shopDomain === DEV_TEST_STORE) {
        console.log(`[${requestId}] Detected test store - using hardcoded token`);
        
        // Cache the validation as successful for the test store
        const cacheKey = `connection:${DEV_TEST_STORE}`;
        tokenValidationCache.set(cacheKey, { 
          valid: true, 
          timestamp: Date.now(),
          token: DEV_TEST_TOKEN 
        });
        
        validationInProgress.current = false;
        setError(null); // Clear any previous errors
        return true;
      }
      
      // Default flow for other stores
      // Get token for shop
      const { data, error } = await shopifyStores()
        .select('access_token')
        .eq('shop', shopDomain)
        .single();
      
      if (error || !data?.access_token) {
        connectionLogger.error(`[${requestId}] Error getting token for shop:`, error || 'No token found');
        validationInProgress.current = false;
        
        // Cache the negative result
        const cacheKey = `connection:${shopDomain}`;
        tokenValidationCache.set(cacheKey, { 
          valid: false, 
          timestamp: Date.now(),
          token: data?.access_token || '' 
        });
        
        return false;
      }
      
      // Check if token is placeholder
      if (data.access_token === 'placeholder_token') {
        connectionLogger.warn(`[${requestId}] Detected placeholder token for shop: ${shopDomain}`);
        setError('رمز الوصول غير صالح. يرجى تحديث رمز الوصول في الإعدادات.');
        validationInProgress.current = false;
        
        // Cache the negative result
        const cacheKey = `connection:${shopDomain}`;
        tokenValidationCache.set(cacheKey, { 
          valid: false, 
          timestamp: Date.now(),
          token: data.access_token 
        });
        
        return false;
      }
      
      // Test the token with Shopify
      connectionLogger.info(`[${requestId}] Testing token with API for ${shopDomain}`);
      
      // Try POST endpoint first, if available
      try {
        const response = await fetch(`/api/shopify-test-connection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shop: shopDomain,
            accessToken: data.access_token,
            timestamp: Date.now(),
            requestId: `test_conn_${requestId}`,
          }),
          cache: 'no-store',
        });
        
        if (!response.ok) {
          // Fall back to GET if POST fails
          throw new Error('POST request failed, falling back to GET');
        }
        
        const result = await response.json();
        const isValid = result.success === true;
        
        connectionLogger.info(`[${requestId}] POST Connection test result: ${isValid ? 'valid' : 'invalid'}`);
        
        // Cache the validation result
        const cacheKey = `connection:${shopDomain}`;
        tokenValidationCache.set(cacheKey, { 
          valid: isValid, 
          timestamp: Date.now(),
          token: data.access_token 
        });
        
        // Schedule token refresh if valid
        if (isValid) {
          scheduleTokenRefresh();
          // Reset error state if connection is valid
          setError(null);
          // Reset auto recovery attempts on successful connection
          autoRecoveryAttempts.current = 0;
        }
        
        validationInProgress.current = false;
        return isValid;
        
      } catch (postError) {
        console.warn(`[${requestId}] Error with POST request, falling back to GET:`, postError);
        
        // Fallback to GET request
        const response = await fetch(`/api/shopify-test-connection?shop=${encodeURIComponent(shopDomain)}&force=true`, {
          cache: 'no-store',
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          connectionLogger.error(`[${requestId}] API request error:`, errorText);
          
          // Cache the negative result
          const cacheKey = `connection:${shopDomain}`;
          tokenValidationCache.set(cacheKey, { 
            valid: false, 
            timestamp: Date.now(),
            token: data.access_token 
          });
          
          validationInProgress.current = false;
          return false;
        }
        
        const result = await response.json();
        const isValid = result.success === true;
        
        connectionLogger.info(`[${requestId}] GET Connection test result: ${isValid ? 'valid' : 'invalid'}`);
        
        // Cache the validation result
        const cacheKey = `connection:${shopDomain}`;
        tokenValidationCache.set(cacheKey, { 
          valid: isValid, 
          timestamp: Date.now(),
          token: data.access_token 
        });
        
        // Schedule token refresh if valid
        if (isValid) {
          scheduleTokenRefresh();
          // Reset error state if connection is valid
          setError(null);
          // Reset auto recovery attempts on successful connection
          autoRecoveryAttempts.current = 0;
        }
        
        validationInProgress.current = false;
        return isValid;
      }
    } catch (error) {
      connectionLogger.error(`[${requestId}] Error testing connection:`, error);
      validationInProgress.current = false;
      return false;
    }
  }, [shopDomain, isDevMode, scheduleTokenRefresh]);
  
  // ... keep existing code (testToken function and other unchanged methods)
  
  // Schedule periodic token validation to ensure it stays valid
  const scheduleTokenRefresh = useCallback(() => {
    if (tokenRefreshTimer.current) {
      clearTimeout(tokenRefreshTimer.current);
    }
    
    // Schedule token refresh
    tokenRefreshTimer.current = setTimeout(() => {
      if (shopDomain && isConnected) {
        connectionLogger.info('Performing scheduled token validation');
        testConnection(true).catch(() => {
          connectionLogger.error('Scheduled token validation failed');
        });
      }
    }, TOKEN_REFRESH_INTERVAL);
  }, [testConnection, shopDomain, isConnected]);
  
  // Auto-recovery mechanism
  const attemptAutoRecovery = useCallback(async () => {
    if (autoRecoveryAttempts.current >= maxAutoRecoveryAttempts || !shopDomain) {
      connectionLogger.warn('Max auto-recovery attempts reached or no shop domain available');
      return false;
    }
    
    autoRecoveryAttempts.current++;
    connectionLogger.info(`Attempting auto-recovery (${autoRecoveryAttempts.current}/${maxAutoRecoveryAttempts})`);
    
    try {
      // Clear cache to force fresh validation
      clearAllValidationCache();
      
      // Attempt to test connection
      const isValid = await testConnection(true);
      
      if (isValid) {
        connectionLogger.info('Auto-recovery successful!');
        return true;
      } else {
        connectionLogger.warn('Auto-recovery attempt failed');
        return false;
      }
    } catch (error) {
      connectionLogger.error('Error during auto-recovery:', error);
      return false;
    }
  }, [clearAllValidationCache, testConnection, shopDomain]);
  
  // Sync state with all sources of truth, with rate limiting
  const syncState = useCallback(async () => {
    // Development mode bypass for test store
    if (isDevMode && shopDomain === DEV_TEST_STORE) {
      console.log('[DEV MODE] Bypassing state sync for test store');
      setIsLoading(false);
      setIsValidating(false);
      return;
    }
    
    // Generate a unique sync ID
    const syncId = `sync_${Math.random().toString(36).substring(2, 8)}`;
    
    // Don't allow multiple syncs at the same time
    if (validationInProgress.current) {
      connectionLogger.debug(`[${syncId}] Sync already in progress, skipping`);
      return;
    }
    
    // Apply rate limiting - only sync once per second at most
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTimestamp.current;
    if (timeSinceLastSync < 1000 && syncAttempts > 0) {
      connectionLogger.debug(`[${syncId}] Rate limiting sync, last sync was ${timeSinceLastSync}ms ago`);
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
      
      connectionLogger.info(`[${syncId}] Synchronizing connection state:`, {
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
            connectionLogger.error(`[${syncId}] Error fetching store from database:`, error);
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
                  setError('رمز الوصول غير صالح. يرجى إعادة الاتصال أو تحديث رمز الوصول.');
                } else {
                  setError(null);
                }
              } catch (testError) {
                connectionLogger.error(`[${syncId}] Token test error:`, testError);
                setError('خطأ في اختبار صلاحية رمز الوصول');
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
                connectionLogger.info(`[${syncId}] Created store record for ${shopToUse}`);
              } catch (insertError) {
                connectionLogger.error(`[${syncId}] Error creating store record:`, insertError);
              }
            }
          }
        } else {
          // In recovery mode, trust local storage to reduce load
          setIsConnected(isConnectedInStorage || !!activeStore);
        }
      } catch (dbError) {
        connectionLogger.error(`[${syncId}] Database error during syncState:`, dbError);
        // If database query fails but we have other evidence of connection,
        // still consider connected
        if (isConnectedInStorage || activeStore) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
          setError('تعذر التحقق من حالة الاتصال');
        }
      }
      
      // Always update localStorage and connection manager with current state
      localStorage.setItem('shopify_store', shopToUse);
      localStorage.setItem('shopify_connected', isConnected ? 'true' : 'false');
      
      // Update connection manager
      shopifyConnectionManager.addOrUpdateStore(shopToUse, isConnected);
      
      connectionLogger.info(`[${syncId}] Connection state synchronized to ${isConnected ? 'connected' : 'disconnected'} with shop: ${shopToUse}`);
      
      // Schedule token refresh if connected
      if (isConnected) {
        scheduleTokenRefresh();
      } else if (syncAttempts > 1) {
        // If not connected and we've tried a few times, attempt auto recovery
        attemptAutoRecovery();
      }
    } catch (error) {
      connectionLogger.error(`[${syncId}] Error synchronizing connection state:`, error);
      setError('خطأ في مزامنة حالة الاتصال');
    } finally {
      setIsLoading(false);
      setIsValidating(false);
      validationInProgress.current = false;
      
      // Reset sync attempts counter after a while to allow future aggressive syncing if needed
      if (syncAttempts >= MAX_SYNC_ATTEMPTS) {
        setTimeout(() => {
          connectionLogger.info('Connection appears stable, reset sync attempts counter');
          setSyncAttempts(0);
        }, 60000); // Reset after 1 minute of stability
      }
    }
  }, [shopDomain, isConnected, syncAttempts, testToken, scheduleTokenRefresh, attemptAutoRecovery, isDevMode]);
  
  // Disconnect function
  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Clear any scheduled token refreshes
      if (tokenRefreshTimer.current) {
        clearTimeout(tokenRefreshTimer.current);
        tokenRefreshTimer.current = null;
      }
      
      if (shopDomain) {
        // Deactivate in database
        try {
          await shopifyStores()
            .update({ is_active: false })
            .eq('shop', shopDomain);
            
          connectionLogger.info(`Deactivated shop ${shopDomain} in database`);
          
          // Clear all token caches for this shop
          tokenValidationCache.clear();
        } catch (dbError) {
          connectionLogger.error('Error deactivating store in database:', dbError);
        }
      }
      
      // Clear connection state
      setIsConnected(false);
      setShopDomain(null);
      setError(null);
      
      // Clear localStorage
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_last_url_shop');
      localStorage.removeItem('shopify_temp_store');
      
      // Reset connection manager
      shopifyConnectionManager.clearAllStores();
      
      // Reset auto recovery attempts
      autoRecoveryAttempts.current = 0;
      
      // Show toast
      toast.success('تم قطع الاتصال بالمتجر بنجاح');
      
      connectionLogger.info('Disconnected from Shopify');
    } catch (error) {
      connectionLogger.error('Error disconnecting:', error);
      setError('خطأ في قطع الاتصال مع Shopify');
      toast.error('حدث خطأ أثناء قطع الاتصال');
    } finally {
      setIsLoading(false);
    }
  }, [shopDomain]);
  
  // Reload function - clears cache and re-syncs state
  const reload = useCallback(async (): Promise<void> => {
    const reloadId = `reload_${Math.random().toString(36).substring(2, 8)}`;
    connectionLogger.info(`[${reloadId}] Reloading connection state`);
    
    // Clear token validation cache
    tokenValidationCache.clear();
    
    // Reset sync attempts counter to allow aggressive syncing
    setSyncAttempts(0);
    
    // Reset auto recovery attempts
    autoRecoveryAttempts.current = 0;
    
    // Re-sync state
    await syncState();
    
    // Test connection - explicitly passing true to force refresh
    const isValid = await testConnection(true);
    
    if (isValid) {
      toast.success('تم تحديث الاتصال بنجاح');
    } else {
      toast.error('فشل تجديد الاتصال، الرجاء تحديث رمز الوصول');
    }
    
    connectionLogger.info(`[${reloadId}] Connection reloaded, validation result:`, isValid);
  }, [syncState, testConnection]);
  
  // Cleanup function for token refresh timer
  useEffect(() => {
    return () => {
      if (tokenRefreshTimer.current) {
        clearTimeout(tokenRefreshTimer.current);
      }
    };
  }, []);
  
  // Initialize once on mount
  useEffect(() => {
    const initializeConnection = async () => {
      // Check if dev mode is enabled
      const devModeEnabled = localStorage.getItem('shopify_dev_mode') === 'true';
      setIsDevMode(devModeEnabled || ENABLE_DEV_MODE);
      
      // If dev mode is enabled and test store is configured, set it up
      if ((devModeEnabled || ENABLE_DEV_MODE) && DEV_TEST_STORE) {
        console.log("[DEV MODE] Initializing with test store:", DEV_TEST_STORE);
        setShopDomain(DEV_TEST_STORE);
        setIsConnected(true);
        setIsLoading(false);
        
        // Pre-populate the validation cache for dev store
        const cacheKey = `connection:${DEV_TEST_STORE}`;
        tokenValidationCache.set(cacheKey, {
          valid: true,
          timestamp: Date.now(),
          token: DEV_TEST_TOKEN
        });
        
        // Store in localStorage
        localStorage.setItem('shopify_store', DEV_TEST_STORE);
        localStorage.setItem('shopify_connected', 'true');
        localStorage.setItem('shopify_dev_mode', 'true');
        
        // Add to connection manager
        shopifyConnectionManager.addOrUpdateStore(DEV_TEST_STORE, true);
        
        return; // Skip normal initialization in dev mode
      }
      
      // Check if there's a shop in the URL
      const url = new URL(window.location.href);
      const shopParam = url.searchParams.get('shop');
      const shopifyConnected = url.searchParams.get('shopify_connected') === 'true';
      
      connectionLogger.info(`[${initId}] Checking shop from URL:`, { shopDomain: shopParam, isShopifyRequest: !!shopParam });
      
      if (shopParam && shopifyConnected) {
        // This is likely a redirect back from Shopify OAuth
        setShopDomain(shopParam);
        setIsConnected(true);
        localStorage.setItem('shopify_store', shopParam);
        localStorage.setItem('shopify_connected', 'true');
        shopifyConnectionManager.addOrUpdateStore(shopParam, true);
        connectionLogger.info(`[${initId}] Setting connected from URL params: ${shopParam}`);
        
        // Clear any existing token validation cache
        tokenValidationCache.clear();
      }
      
      // Try to get connection from existing sources
      const storedShop = localStorage.getItem('shopify_store');
      const managerStore = shopifyConnectionManager.getActiveStore();
      
      if (managerStore) {
        connectionLogger.info(`[${initId}] Setting active shop from connection manager: ${managerStore}`);
        setShopDomain(managerStore);
        setIsConnected(true);
      } else if (storedShop) {
        connectionLogger.info(`[${initId}] Setting active shop from localStorage: ${storedShop}`);
        setShopDomain(storedShop);
        setIsConnected(localStorage.getItem('shopify_connected') === 'true');
        shopifyConnectionManager.addOrUpdateStore(storedShop, localStorage.getItem('shopify_connected') === 'true');
      }
      
      try {
        // Check which shops are active in the database
        const { data, error } = await shopifyStores()
          .select('shop, is_active, updated_at')
          .order('is_active', { ascending: false })
          .order('updated_at', { ascending: false });
          
        if (error) {
          connectionLogger.error(`[${initId}] Error loading shops:`, error);
        } else {
          connectionLogger.info(`[${initId}] Loaded shops from database:`, data);
          
          // If we find an active store and don't already have one set
          if (data && data.length > 0) {
            const activeShop = data.find(s => s.is_active);
            
            if (activeShop && !shopDomain) {
              connectionLogger.info(`[${initId}] Setting active shop from database: ${activeShop.shop}`);
              setShopDomain(activeShop.shop);
              setIsConnected(true);
              localStorage.setItem('shopify_store', activeShop.shop);
              localStorage.setItem('shopify_connected', 'true');
              shopifyConnectionManager.addOrUpdateStore(activeShop.shop, true);
            }
            
            // Import all shops to the connection manager
            data.forEach(store => {
              shopifyConnectionManager.addOrUpdateStore(store.shop, store.is_active);
            });
          }
        }
      } catch (dbError) {
        connectionLogger.error(`[${initId}] Error checking database for active shops:`, dbError);
      }
      
      // Run the sync state function to consolidate all sources of truth
      await syncState();
      
      // Schedule token refresh if connected
      if (isConnected && shopDomain) {
        scheduleTokenRefresh();
      }
      
      connectionLogger.info(`[${initId}] Connection initialization complete`);
    };
    
    initializeConnection();
    
    // Add event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shopify_connected' || e.key === 'shopify_store') {
        syncState();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncState, scheduleTokenRefresh, isConnected]);
  
  // Export context value
  const contextValue: ShopifyConnectionContextType = {
    isConnected,
    shopDomain,
    isLoading,
    isValidating,
    error,
    syncState,
    forceSetConnected,
    disconnect,
    reload,
    testConnection,
    isDevMode,
  };
  
  return (
    <ShopifyConnectionContext.Provider value={contextValue}>
      {children}
    </ShopifyConnectionContext.Provider>
  );
}

// Hook for consuming the context
export function useShopifyConnection() {
  return useContext(ShopifyConnectionContext);
}

// Export token validation cache for use in other modules
export { tokenValidationCache };
