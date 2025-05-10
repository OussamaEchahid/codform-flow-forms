
import React, { 
  createContext, 
  useState, 
  useEffect, 
  useCallback, 
  useContext 
} from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { clearShopifyCache } from '@/hooks/useShopify';
import { shopifyStores } from '@/lib/shopify/supabase-client';

// Test store configuration for development
const DEV_TEST_STORE = 'astrem.myshopify.com';
const DEV_TEST_TOKEN = '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';

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
  // Add these properties to fix the type errors
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
  // Add missing methods to match the interface
  disconnect: async () => {},
  forceSetConnected: () => {}
});

// Create a cache for token validation results to prevent redundant API calls
export const tokenValidationCache = new Map<string, { isValid: boolean, timestamp: number }>();

export const useShopifyConnection = () => useContext(ShopifyConnectionContext);

export const ShopifyConnectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [shopDomain, setShopDomain] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Check if the app is running in development mode
  const isDevMode = process.env.NODE_ENV === 'development' || import.meta.env.DEV === true;
  
  // Load initial state from localStorage
  useEffect(() => {
    const storedShop = localStorage.getItem('shopify_store');
    const storedConnected = localStorage.getItem('shopify_connected') === 'true';
    
    // Check if this is the test store in dev mode
    if (isDevMode && storedShop === DEV_TEST_STORE) {
      console.log('[DEV MODE] Using test store:', DEV_TEST_STORE);
      setIsConnected(true);
      localStorage.setItem('shopify_connected', 'true');
    } else if (storedShop) {
      setShopDomain(storedShop);
      setIsConnected(storedConnected);
    }
    
    setIsLoading(false);
  }, [isDevMode]);
  
  // Force set connected state - needed for the redirect page
  const forceSetConnected = useCallback((shop: string) => {
    setShopDomain(shop);
    setIsConnected(true);
    localStorage.setItem('shopify_store', shop);
    localStorage.setItem('shopify_connected', 'true');
    console.log(`Force set connection state to connected for shop: ${shop}`);
  }, []);
  
  // Disconnect from Shopify store
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear local storage items
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_token');
      
      // Clear token validation cache
      tokenValidationCache.clear();
      
      // Update state
      setIsConnected(false);
      setShopDomain('');
      setError(null);
      
      // Clear cache
      clearShopifyCache();
      
      toast.success('تم قطع الاتصال بمتجر Shopify بنجاح');
      
      // Don't return any value (void)
    } catch (error) {
      console.error('Error disconnecting store:', error);
      toast.error('حدث خطأ أثناء محاولة قطع الاتصال');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Enhanced test connection function with cache implementation and improved dev mode handling
  const testConnection = useCallback(async (forceRefresh: boolean = false): Promise<boolean> => {
    if (!shopDomain) {
      console.warn('No shop domain to test connection');
      return false;
    }
    
    // Development mode bypass for test store - ENHANCED
    if (isDevMode && shopDomain === DEV_TEST_STORE) {
      console.log('[DEV MODE] Bypassing connection test for test store');
      // Set connection state for dev mode
      setIsConnected(true);
      localStorage.setItem('shopify_connected', 'true');
      return true;
    }
    
    // Check the cache first
    const cacheKey = `token_valid:${shopDomain}`;
    const cached = tokenValidationCache.get(cacheKey);
    const now = Date.now();
    
    if (!forceRefresh && cached && (now - cached.timestamp < 60000)) { // 1 minute cache
      console.log('Using cached token validation result');
      return cached.isValid;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the test connection API route
      const response = await fetch(`/api/shopify-test-connection?shop=${encodeURIComponent(shopDomain)}&force=${forceRefresh}&dev=${isDevMode}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Connection test failed:', errorText);
        setError(`Connection test failed: ${errorText}`);
        tokenValidationCache.set(cacheKey, { isValid: false, timestamp: now });
        return false;
      }
      
      const result = await response.json();
      
      if (result.success === true || (isDevMode && shopDomain === DEV_TEST_STORE && result.devMode)) {
        console.log('Connection test successful');
        setIsConnected(true);
        localStorage.setItem('shopify_connected', 'true');
        tokenValidationCache.set(cacheKey, { isValid: true, timestamp: now });
        return true;
      } else {
        console.warn('Connection test failed:', result.error);
        setError(result.error || 'Connection test failed');
        setIsConnected(false);
        localStorage.removeItem('shopify_connected');
        tokenValidationCache.set(cacheKey, { isValid: false, timestamp: now });
        return false;
      }
    } catch (e: any) {
      console.error('Error testing connection:', e);
      
      // Special handling for dev mode test store when API fails
      if (isDevMode && shopDomain === DEV_TEST_STORE) {
        console.log('[DEV MODE] API failed but using test store failsafe');
        setIsConnected(true);
        localStorage.setItem('shopify_connected', 'true');
        return true;
      }
      
      setError(e.message || 'Error testing connection');
      setIsConnected(false);
      localStorage.removeItem('shopify_connected');
      tokenValidationCache.set(cacheKey, { isValid: false, timestamp: now });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [shopDomain, isDevMode]);
  
  // Sync connection state with localStorage
  const syncState = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setIsValidating(true);
    
    try {
      // Get the current shop domain
      const currentShop = localStorage.getItem('shopify_store');
      
      // Special handling for dev mode test store
      if (isDevMode && currentShop === DEV_TEST_STORE) {
        console.log('[DEV MODE] Syncing state for test store');
        setIsConnected(true);
        setShopDomain(DEV_TEST_STORE);
        localStorage.setItem('shopify_connected', 'true');
        return;
      }
      
      if (!currentShop) {
        console.log('No shop domain found in localStorage');
        setIsConnected(false);
        setShopDomain('');
        localStorage.removeItem('shopify_connected');
        return;
      }
      
      // Check if the shop is connected
      const { data, error } = await shopifyStores()
        .select('shop')
        .eq('shop', currentShop)
        .single();
      
      if (error && currentShop !== DEV_TEST_STORE) {
        console.error('Error fetching shop data:', error);
        setIsConnected(false);
        setShopDomain('');
        localStorage.removeItem('shopify_connected');
        return;
      }
      
      // If shop exists or is test store, set connected state
      const isCurrentlyConnected = !!data?.shop || (isDevMode && currentShop === DEV_TEST_STORE);
      setIsConnected(isCurrentlyConnected);
      setShopDomain(currentShop);
      localStorage.setItem('shopify_connected', String(isCurrentlyConnected));
      
      console.log(`Shop ${currentShop} is ${isCurrentlyConnected ? 'connected' : 'disconnected'}`);
    } catch (err) {
      console.error('Error syncing state:', err);
      
      // Failsafe for test store in dev mode
      const currentShop = localStorage.getItem('shopify_store');
      if (isDevMode && currentShop === DEV_TEST_STORE) {
        setIsConnected(true);
        setShopDomain(DEV_TEST_STORE);
        localStorage.setItem('shopify_connected', 'true');
      } else {
        setIsConnected(false);
        setShopDomain('');
        localStorage.removeItem('shopify_connected');
      }
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [isDevMode]);
  
  // Reload the page
  const reload = useCallback(async (): Promise<void> => {
    window.location.reload();
  }, []);
  
  // Schedule token refresh checks
  const scheduleTokenRefresh = useCallback(() => {
    const checkToken = async () => {
      if (shopDomain && shopDomain !== DEV_TEST_STORE) {
        console.log('Scheduled token refresh check...');
        await testConnection(true); // Force refresh the token
      } else if (isDevMode && shopDomain === DEV_TEST_STORE) {
        console.log('[DEV MODE] Skipping scheduled token refresh for test store');
      }
    };
    
    // Check immediately on mount
    checkToken();
    
    // Then check every 12 hours
    const intervalId = setInterval(checkToken, 12 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [shopDomain, testConnection, isDevMode]);
  
  // Run scheduled token refresh on mount and when shopDomain changes
  useEffect(() => {
    // Skip token refresh for test store in dev mode
    if (isDevMode && shopDomain === DEV_TEST_STORE) {
      console.log('[DEV MODE] Using test store, skipping token refresh');
      return;
    }
    
    const cleanup = scheduleTokenRefresh();
    
    return () => {
      cleanup?.();
    };
  }, [shopDomain, scheduleTokenRefresh, isDevMode]);
  
  return (
    <ShopifyConnectionContext.Provider
      value={{
        isConnected,
        shopDomain,
        isLoading,
        isValidating,
        error,
        syncState,
        reload,
        testConnection,
        isDevMode,
        // Add the missing methods
        disconnect,
        forceSetConnected
      }}
    >
      {children}
    </ShopifyConnectionContext.Provider>
  );
};
