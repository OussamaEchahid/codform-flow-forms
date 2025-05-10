import React, { 
  createContext, 
  useState, 
  useEffect, 
  useCallback, 
  useContext 
} from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  shopifyAuth, 
  ShopifyAuthParams, 
  ShopifyAuthRedirectResult 
} from '@shopify/shopify-app-remix/server';
import { clearShopifyCache } from '@/hooks/useShopify';
import { shopifyStores } from './supabase/supabase-client';

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
  const isDevMode = process.env.NODE_ENV === 'development';
  
  // Load initial state from localStorage
  useEffect(() => {
    const storedShop = localStorage.getItem('shopify_store');
    const storedConnected = localStorage.getItem('shopify_connected') === 'true';
    
    if (storedShop) {
      setShopDomain(storedShop);
    }
    
    setIsConnected(storedConnected);
    setIsLoading(false);
  }, []);
  
  // Sync connection state with localStorage
  const syncState = useCallback(async () => {
    setIsLoading(true);
    setIsValidating(true);
    
    try {
      // Get the current shop domain
      const currentShop = localStorage.getItem('shopify_store');
      
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
      
      if (error) {
        console.error('Error fetching shop data:', error);
        setIsConnected(false);
        setShopDomain('');
        localStorage.removeItem('shopify_connected');
        return;
      }
      
      // If shop exists, set connected state
      const isCurrentlyConnected = !!data?.shop;
      setIsConnected(isCurrentlyConnected);
      setShopDomain(currentShop);
      localStorage.setItem('shopify_connected', String(isCurrentlyConnected));
      
      console.log(`Shop ${currentShop} is ${isCurrentlyConnected ? 'connected' : 'disconnected'}`);
    } catch (err) {
      console.error('Error syncing state:', err);
      setIsConnected(false);
      setShopDomain('');
      localStorage.removeItem('shopify_connected');
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, []);
  
  // Reload the page
  const reload = useCallback(async () => {
    window.location.reload();
  }, []);
  
  // Enhanced test connection function with cache implementation
  const testConnection = useCallback(async (forceRefresh: boolean = false): Promise<boolean> => {
    if (!shopDomain) {
      console.warn('No shop domain to test connection');
      return false;
    }
    
    // Development mode bypass for test store
    if (isDevMode && shopDomain === DEV_TEST_STORE) {
      console.log('[DEV MODE] Bypassing connection test for test store');
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
      const response = await fetch(`/api/shopify-test-connection?shop=${encodeURIComponent(shopDomain)}&force=${forceRefresh}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Connection test failed:', errorText);
        setError(`Connection test failed: ${errorText}`);
        tokenValidationCache.set(cacheKey, { isValid: false, timestamp: now });
        return false;
      }
      
      const result = await response.json();
      
      if (result.success === true) {
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
      setError(e.message || 'Error testing connection');
      setIsConnected(false);
      localStorage.removeItem('shopify_connected');
      tokenValidationCache.set(cacheKey, { isValid: false, timestamp: now });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [shopDomain, syncState]);
  
  // Schedule token refresh checks
  const scheduleTokenRefresh = useCallback(() => {
    const checkToken = async () => {
      if (shopDomain) {
        console.log('Scheduled token refresh check...');
        await testConnection(true); // Force refresh the token
      }
    };
    
    // Check immediately on mount
    checkToken();
    
    // Then check every 12 hours
    const intervalId = setInterval(checkToken, 12 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [shopDomain]);
  
  // Run scheduled token refresh on mount and when shopDomain changes
  useEffect(() => {
    const cleanup = scheduleTokenRefresh();
    
    return () => {
      cleanup?.();
    };
  }, [shopDomain, scheduleTokenRefresh]);
  
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
      }}
    >
      {children}
    </ShopifyConnectionContext.Provider>
  );
};
