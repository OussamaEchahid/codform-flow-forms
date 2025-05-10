
import React, { 
  createContext, 
  useState, 
  useEffect, 
  useCallback, 
  useContext 
} from 'react';
import { toast } from 'sonner';
import { shopifyConnectionManager } from './connection-manager';
import { connectionLogger } from './debug-logger';
import { shopifySupabase } from './supabase-client';
import { isDevelopmentMode, isTestStore } from './constants';
import { testShopifyConnection } from './api';

// Simple cache for validation results
export const tokenValidationCache = new Map<string, { isValid: boolean, timestamp: number }>();

// Connection check limiting
const MAX_CONNECTION_CHECKS = 3;
let connectionCheckCount = 0;

interface ShopifyConnectionContextType {
  isConnected: boolean;
  shopDomain: string;
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  syncState: () => Promise<void>;
  reload: () => Promise<void>;
  testConnection: (forceRefresh?: boolean) => Promise<boolean>;
  isDevMode: boolean;
  disconnect: () => Promise<void>;
  forceSetConnected: (shopDomain: string) => void;
}

export const ShopifyConnectionContext = createContext<ShopifyConnectionContextType>({
  isConnected: false,
  shopDomain: '',
  isLoading: true,
  isValidating: false,
  error: null,
  syncState: async () => {},
  reload: async () => {},
  testConnection: async () => false,
  isDevMode: false,
  disconnect: async () => {},
  forceSetConnected: () => {}
});

export const useShopifyConnection = () => useContext(ShopifyConnectionContext);

export const ShopifyConnectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [shopDomain, setShopDomain] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if the app is running in development mode
  const isDevMode = isDevelopmentMode();
  
  // Load initial state from localStorage with retry
  useEffect(() => {
    const loadInitialState = (attempt = 0) => {
      try {
        // Check for dev mode special handling
        if (isDevMode) {
          connectionLogger.log('Development mode detected, using test store');
          const testStore = shopifyConnectionManager.getDevModeStore();
          setIsConnected(true);
          setShopDomain(testStore);
          localStorage.setItem('shopify_store', testStore);
          localStorage.setItem('shopify_connected', 'true');
          setIsLoading(false);
          return;
        }
        
        // For production, get values from localStorage
        const storedShop = localStorage.getItem('shopify_store');
        const storedConnected = localStorage.getItem('shopify_connected') === 'true';
        
        connectionLogger.log('Loading stored connection state:', {
          storedShop,
          storedConnected,
          attempt
        });
        
        if (storedShop) {
          setShopDomain(storedShop);
          setIsConnected(storedConnected);
        } else {
          // Try to recover from last URL shop if available
          const lastUrlShop = localStorage.getItem('shopify_last_url_shop');
          if (lastUrlShop) {
            connectionLogger.log('Recovering from last URL shop:', lastUrlShop);
            setShopDomain(lastUrlShop);
            localStorage.setItem('shopify_store', lastUrlShop);
            localStorage.setItem('shopify_connected', 'true');
            setIsConnected(true);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        connectionLogger.error('Error loading connection state:', error);
        
        // Retry up to 3 times with exponential backoff
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 500;
          connectionLogger.log(`Retrying in ${delay}ms (attempt ${attempt + 1})`);
          setTimeout(() => loadInitialState(attempt + 1), delay);
        } else {
          setIsLoading(false);
          setError('Failed to load connection state');
        }
      }
    };
    
    loadInitialState();
  }, [isDevMode]);
  
  // Force set connected state
  const forceSetConnected = useCallback((shop: string) => {
    setShopDomain(shop);
    setIsConnected(true);
    localStorage.setItem('shopify_store', shop);
    localStorage.setItem('shopify_connected', 'true');
    shopifyConnectionManager.setActiveStore(shop);
    connectionLogger.log(`Force set connection for shop: ${shop}`);
  }, []);
  
  // Disconnect from Shopify store
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear all localStorage items
      shopifyConnectionManager.clearAllStores();
      tokenValidationCache.clear();
      
      // Reset connection check count
      connectionCheckCount = 0;
      
      // Update state
      setIsConnected(false);
      setShopDomain('');
      setError(null);
      
      toast.success('تم قطع الاتصال بمتجر Shopify بنجاح');
    } catch (error) {
      connectionLogger.error('Error disconnecting store:', error);
      toast.error('حدث خطأ أثناء محاولة قطع الاتصال');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Test connection function
  const testConnection = useCallback(async (forceRefresh: boolean = false): Promise<boolean> => {
    // Skip real test for dev mode
    if (isDevMode) {
      connectionLogger.log('Dev mode detected, skipping real connection test');
      setIsConnected(true);
      const testStore = shopifyConnectionManager.getDevModeStore();
      setShopDomain(testStore);
      localStorage.setItem('shopify_store', testStore);
      localStorage.setItem('shopify_connected', 'true');
      return true;
    }
    
    if (!shopDomain) {
      connectionLogger.warn('No shop domain to test connection');
      return false;
    }
    
    // Limit connection checks
    if (connectionCheckCount > MAX_CONNECTION_CHECKS && !forceRefresh) {
      connectionLogger.log('Maximum connection checks reached, using cached values');
      return localStorage.getItem('shopify_connected') === 'true';
    }
    connectionCheckCount++;
    
    // Check cache first
    const cacheKey = `token_valid:${shopDomain}`;
    const cached = tokenValidationCache.get(cacheKey);
    const now = Date.now();
    
    if (!forceRefresh && cached && (now - cached.timestamp < 300000)) { // 5 minute cache
      connectionLogger.log('Using cached validation result');
      return cached.isValid;
    }
    
    setIsLoading(true);
    
    try {
      // Use the API function for connection testing
      const isConnected = await testShopifyConnection(shopDomain);
      
      setIsConnected(isConnected);
      localStorage.setItem('shopify_connected', isConnected ? 'true' : 'false');
      tokenValidationCache.set(cacheKey, { isValid: isConnected, timestamp: now });
      
      return isConnected;
    } catch (e) {
      connectionLogger.error('Error testing connection:', e);
      
      // In case of network errors, assume connection is valid in dev mode
      if (isDevMode || isTestStore(shopDomain)) {
        connectionLogger.log('Assuming connection is valid due to error in dev/test mode');
        setIsConnected(true);
        localStorage.setItem('shopify_connected', 'true');
        tokenValidationCache.set(cacheKey, { isValid: true, timestamp: now });
        return true;
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [shopDomain, isDevMode]);
  
  // Sync state function
  const syncState = useCallback(async (): Promise<void> => {
    // Track sync attempts
    const syncAttemptsStr = localStorage.getItem('shopify_sync_attempts') || '0';
    const syncAttempts = parseInt(syncAttemptsStr, 10) + 1;
    localStorage.setItem('shopify_sync_attempts', syncAttempts.toString());
    
    // Handle dev mode
    if (isDevMode) {
      connectionLogger.log('Setting up dev mode connection');
      const testStore = shopifyConnectionManager.getDevModeStore();
      setIsConnected(true);
      setShopDomain(testStore);
      shopifyConnectionManager.setActiveStore(testStore);
      setError(null);
      return;
    }
    
    setIsLoading(true);
    setIsValidating(true);
    
    try {
      // Ensure connection state consistency
      const stateValid = shopifyConnectionManager.validateConnectionState();
      const activeStore = shopifyConnectionManager.getActiveStore();
      
      if (activeStore) {
        setShopDomain(activeStore);
        
        // Validate connection
        const connectionIsValid = await testConnection();
        setIsConnected(connectionIsValid);
        
        if (!connectionIsValid && syncAttempts < 3) {
          connectionLogger.warn('Connection invalid, attempting recovery');
          
          // Try to load stores from database as recovery
          try {
            const { data: stores, error } = await shopifySupabase
              .from('shopify_stores')
              .select('shop,is_active,updated_at')
              .order('is_active', { ascending: false })
              .order('updated_at', { ascending: false });
              
            if (!error && stores && stores.length > 0) {
              connectionLogger.info('Loaded shops from database:', stores);
              
              // Use the first active store, or the most recently updated
              const activeDbStore = stores.find(s => s.is_active) || stores[0];
              
              if (activeDbStore) {
                connectionLogger.info(`Setting active shop from database: ${activeDbStore.shop}`);
                shopifyConnectionManager.setActiveStore(activeDbStore.shop);
                setShopDomain(activeDbStore.shop);
                setIsConnected(true);
              }
            }
          } catch (dbError) {
            connectionLogger.error('Error loading stores from database:', dbError);
          }
        }
      } else if (syncAttempts < 3) {
        // Try to load from database as recovery
        try {
          const { data: stores, error } = await shopifySupabase
            .from('shopify_stores')
            .select('shop,is_active,updated_at')
            .order('is_active', { ascending: false })
            .order('updated_at', { ascending: false });
            
          if (!error && stores && stores.length > 0) {
            connectionLogger.info('Loaded shops from database:', stores);
            
            // Use the first active store, or the most recently updated
            const activeDbStore = stores.find(s => s.is_active) || stores[0];
            
            if (activeDbStore) {
              connectionLogger.info(`Setting active shop from database: ${activeDbStore.shop}`);
              shopifyConnectionManager.setActiveStore(activeDbStore.shop);
              setShopDomain(activeDbStore.shop);
              setIsConnected(true);
            }
          }
        } catch (dbError) {
          connectionLogger.error('Error loading stores from database:', dbError);
        }
      }
      
      // Reset sync attempts counter if connection is stable
      if (isConnected && shopDomain) {
        connectionLogger.info('Connection appears stable, reset sync attempts counter');
        localStorage.setItem('shopify_sync_attempts', '0');
      }
    } catch (error) {
      connectionLogger.error('Error syncing state:', error);
      setError('Error syncing connection state');
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [isDevMode, testConnection, isConnected, shopDomain]);
  
  // Complete reload function
  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // For dev mode, just set the test store
      if (isDevMode) {
        const testStore = shopifyConnectionManager.getDevModeStore();
        setShopDomain(testStore);
        setIsConnected(true);
        shopifyConnectionManager.setActiveStore(testStore);
        return;
      }
      
      // Clear any cached validation
      tokenValidationCache.clear();
      
      // Reset connection check count
      connectionCheckCount = 0;
      
      // Get current shop
      const currentShop = shopifyConnectionManager.getActiveStore();
      if (currentShop) {
        // Test the connection
        const isConnected = await testConnection(true); // Force refresh
        
        if (!isConnected) {
          // Try to load from database as recovery
          try {
            const { data: stores, error } = await shopifySupabase
              .from('shopify_stores')
              .select('shop,is_active,updated_at')
              .order('is_active', { ascending: false })
              .order('updated_at', { ascending: false });
              
            if (!error && stores && stores.length > 0) {
              const activeDbStore = stores.find(s => s.is_active) || stores[0];
              
              if (activeDbStore) {
                shopifyConnectionManager.setActiveStore(activeDbStore.shop);
                setShopDomain(activeDbStore.shop);
                setIsConnected(true);
                
                // Re-test new store
                await testConnection(true);
              }
            }
          } catch (dbError) {
            connectionLogger.error('Error loading stores from database:', dbError);
          }
        }
      } else {
        // No current shop, try to load from database
        try {
          const { data: stores, error } = await shopifySupabase
            .from('shopify_stores')
            .select('shop,is_active,updated_at')
            .order('is_active', { ascending: false })
            .order('updated_at', { ascending: false });
            
          if (!error && stores && stores.length > 0) {
            const activeDbStore = stores.find(s => s.is_active) || stores[0];
            
            if (activeDbStore) {
              shopifyConnectionManager.setActiveStore(activeDbStore.shop);
              setShopDomain(activeDbStore.shop);
              setIsConnected(true);
              
              // Test new store
              await testConnection(true);
            }
          }
        } catch (dbError) {
          connectionLogger.error('Error loading stores from database:', dbError);
        }
      }
    } catch (error) {
      connectionLogger.error('Error during complete reload:', error);
      setError('Error reloading connection');
    } finally {
      setIsLoading(false);
    }
  }, [isDevMode, testConnection]);
  
  // Effect for initial state sync
  useEffect(() => {
    if (!isLoading) {
      syncState().catch(error => {
        connectionLogger.error('Error in initial state sync:', error);
      });
    }
  }, [isLoading, syncState]);
  
  const value = {
    isConnected,
    shopDomain,
    isLoading,
    isValidating,
    error,
    syncState,
    reload,
    testConnection,
    isDevMode,
    disconnect,
    forceSetConnected
  };
  
  return (
    <ShopifyConnectionContext.Provider value={value}>
      {children}
    </ShopifyConnectionContext.Provider>
  );
};
