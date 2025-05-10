import React, { createContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { detectCurrentShop, parseShopifyParams } from '@/utils/shopify-helpers';
import { toast } from 'sonner';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';

interface AuthProviderProps {
  children: React.ReactNode;
}

interface AuthContextType {
  user: any;
  loading: boolean;
  shopifyConnected: boolean;
  shop: string | null;
  shops: string[] | null;
  setShop: (shopDomain: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  shopifyConnected: false,
  shop: null,
  shops: null,
  setShop: () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<string | null>(null);
  const [shops, setShops] = useState<string[] | null>(null);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const syncAttempts = useRef(0);
  const lastErrorHash = useRef<string>('');
  const inRecoveryMode = useRef(false);
  
  // Circuit breaker to prevent too many sync attempts
  const MAX_SYNC_ATTEMPTS = 5;
  const SYNC_INTERVAL = 30000; // 30 seconds instead of 3 seconds
  const RECOVERY_TIMEOUT = 300000; // 5 minutes
  const SYNC_ATTEMPT_RESET = 60000; // Reset attempt counter after 1 minute of successful syncs

  // Function to detect and store shop
  const setupShopFromUrl = async () => {
    // First try to get shop from URL (highest priority)
    const { shopDomain, isShopifyRequest } = parseShopifyParams();
    
    console.log("Checking shop from URL:", { shopDomain, isShopifyRequest });
    
    if (shopDomain && isShopifyRequest) {
      console.log("Found shop in URL, setting as active and clearing others:", shopDomain);
      
      // If shop from URL is different from current shop, clear other stores
      if (shop !== shopDomain) {
        // Clear other stores and only keep this one
        shopifyConnectionManager.clearAllStores();
      }
      
      shopifyConnectionManager.addOrUpdateStore(shopDomain, true);
      
      // Also update database to ensure this store is active
      await shopifyConnectionService.forceActivateStore(shopDomain);
      
      setShop(shopDomain);
      setShopifyConnected(true);
      
      // Reset circuit breaker on successful URL shop detection
      syncAttempts.current = 0;
      inRecoveryMode.current = false;
      
      return true;
    }
    
    // If not in URL, check connection manager first
    const activeStore = shopifyConnectionManager.getActiveStore();
    if (activeStore) {
      console.log("Setting active shop from connection manager:", activeStore);
      setShop(activeStore);
      setShopifyConnected(true);
      
      // Get all stores for the shops list
      const allStores = shopifyConnectionManager.getAllStores();
      if (allStores && allStores.length > 0) {
        setShops(allStores.map(store => store.domain));
      }
      
      return true;
    }
    
    // As fallback check localStorage (legacy approach)
    const storedShop = localStorage.getItem('shopify_store');
    const isConnected = localStorage.getItem('shopify_connected') === 'true';
    
    if (storedShop && isConnected) {
      console.log("Setting shop from localStorage (legacy):", storedShop);
      setShop(storedShop);
      setShopifyConnected(true);
      
      // Add to connection manager
      shopifyConnectionManager.addOrUpdateStore(storedShop, true);
      
      // Update shops list
      setShops([storedShop]);
      
      return true;
    }
    
    return false;
  };

  // Handler for setting active shop
  const handleSetShop = async (shopDomain: string) => {
    try {
      if (!shopDomain) return;
      
      console.log("Explicitly setting active shop to:", shopDomain);
      
      // First, clear any old connection data to avoid conflicts
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      
      // Update in connection manager
      shopifyConnectionManager.clearAllStores();
      shopifyConnectionManager.addOrUpdateStore(shopDomain, true);
      
      // Update state
      setShop(shopDomain);
      setShopifyConnected(true);
      
      // Update localStorage
      localStorage.setItem('shopify_store', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
      
      // Update list of shops
      setShops([shopDomain]);
      
      // Reset circuit breaker states
      syncAttempts.current = 0;
      inRecoveryMode.current = false;
      lastErrorHash.current = '';
      
      console.log(`Active shop set to: ${shopDomain}`);
    } catch (error) {
      console.error("Error setting active shop:", error);
      toast.error("حدث خطأ أثناء تعيين المتجر النشط");
    }
  };

  // Load shops from database
  const loadShopsFromDatabase = async () => {
    try {
      const { data, error } = await shopifySupabase()
        .select('shop, is_active, updated_at')
        .order('is_active', { ascending: false })
        .order('updated_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log("Loaded shops from database:", data);
        
        // First check URL parameters (highest priority)
        const { shopDomain } = parseShopifyParams();
        
        if (shopDomain) {
          // If URL has shop parameter, prioritize it
          const foundInDb = data.some(store => store.shop === shopDomain);
          if (!foundInDb) {
            console.log("Shop from URL not found in database, will add it");
          }
          
          // Clear existing stores to avoid confusion
          shopifyConnectionManager.clearAllStores();
          
          setShop(shopDomain);
          setShopifyConnected(true);
          setShops([shopDomain]);
          
          // Update localStorage
          localStorage.setItem('shopify_store', shopDomain);
          localStorage.setItem('shopify_connected', 'true');
        } else {
          // Update connection manager with database shops
          data.forEach(storeRecord => {
            shopifyConnectionManager.addOrUpdateStore(storeRecord.shop, storeRecord.is_active);
          });
          
          // Use active shop from database
          const activeShop = data.find(store => store.is_active)?.shop || data[0].shop;
          
          setShop(activeShop);
          setShopifyConnected(true);
          setShops(data.map(store => store.shop));
          
          // Update localStorage
          localStorage.setItem('shopify_store', activeShop);
          localStorage.setItem('shopify_connected', 'true');
        }
      }
    } catch (error) {
      console.error("Error loading shops from database:", error);
    }
  };

  // Function to forcibly synchronize connection state with circuit breaker
  const syncConnectionState = async () => {
    // Don't sync if in recovery mode
    if (inRecoveryMode.current) {
      console.log("In recovery mode, skipping connection sync");
      return false;
    }
    
    // Only sync if enough time has passed since last sync
    const now = Date.now();
    if (now - lastSyncTime < SYNC_INTERVAL) {
      return false;
    }
    
    // Check if we've reached max attempts and enter recovery mode if needed
    if (syncAttempts.current >= MAX_SYNC_ATTEMPTS) {
      console.log(`Too many sync attempts (${syncAttempts.current}), entering recovery mode`);
      inRecoveryMode.current = true;
      localStorage.setItem('shopify_recovery_mode', 'true');
      
      // Force enable bypass auth as a last resort
      localStorage.setItem('bypass_auth', 'true');
      
      // Schedule recovery mode exit
      setTimeout(() => {
        console.log("Exiting recovery mode");
        inRecoveryMode.current = false;
        syncAttempts.current = 0;
        localStorage.removeItem('shopify_recovery_mode');
      }, RECOVERY_TIMEOUT);
      
      return false;
    }
    
    setLastSyncTime(now);
    syncAttempts.current += 1;
    
    // Check localStorage first as the most reliable source
    const storedShop = localStorage.getItem('shopify_store');
    const isConnected = localStorage.getItem('shopify_connected') === 'true';
    
    // Check connection manager
    const activeStore = shopifyConnectionManager.getActiveStore();
    const allStores = shopifyConnectionManager.getAllStores();
    
    // Create an error hash to detect repeated errors
    const stateHash = JSON.stringify({
      storedShop, 
      isConnected, 
      activeStore, 
      shopCount: allStores.length,
      shop, 
      shopifyConnected
    });
    
    // If same error state persists, increase attempt count
    if (stateHash === lastErrorHash.current) {
      console.log("Same connection state issue detected, incrementing attempt counter");
    } else {
      // If state changed, update hash and reset counter if it was successful
      lastErrorHash.current = stateHash;
      
      // If valid connection exists, consider resetting attempt counter
      if ((storedShop && isConnected) || activeStore) {
        // Only reset counter if this is a valid state for a while
        setTimeout(() => {
          if (!inRecoveryMode.current) {
            syncAttempts.current = 0;
            console.log("Connection appears stable, reset sync attempts counter");
          }
        }, SYNC_ATTEMPT_RESET);
      }
    }
    
    console.log("Synchronizing connection state:", {
      localStorage: { storedShop, isConnected },
      connectionManager: { activeStore, storeCount: allStores.length },
      currentState: { shop, shopifyConnected },
      syncAttempts: syncAttempts.current,
      inRecovery: inRecoveryMode.current,
      timestamp: now
    });
    
    // If any valid source shows a connection, update state to match
    if ((storedShop && isConnected) || activeStore) {
      const shopToUse = activeStore || storedShop;
      
      if (shopToUse) {
        setShop(shopToUse);
        setShopifyConnected(true);
        
        if (allStores && allStores.length > 0) {
          setShops(allStores.map(store => store.domain));
        } else if (shopToUse) {
          setShops([shopToUse]);
        }
        
        // Ensure localStorage and connection manager are in sync
        if (!isConnected || storedShop !== shopToUse) {
          localStorage.setItem('shopify_store', shopToUse);
          localStorage.setItem('shopify_connected', 'true');
        }
        
        if (!activeStore || activeStore !== shopToUse) {
          shopifyConnectionManager.addOrUpdateStore(shopToUse, true);
        }
        
        console.log("Connection state synchronized to connected with shop:", shopToUse);
        return true;
      }
    } else if (shopifyConnected || shop) {
      // If we have no connection data but state says connected, correct the state
      console.log("No connection data found but state says connected, correcting state");
      setShopifyConnected(false);
      setShop(null);
      return true;
    }
    
    return false;
  };

  // Full connection reset to fix issues
  const resetEntireConnectionState = async () => {
    try {
      console.log("Performing full connection state reset");
      
      // Clear localStorage
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_recovery_mode');
      
      // Reset connection manager
      shopifyConnectionManager.clearAllStores();
      
      // Reset state
      setShop(null);
      setShopifyConnected(false);
      setShops(null);
      
      // Reset circuit breaker
      syncAttempts.current = 0;
      inRecoveryMode.current = false;
      lastErrorHash.current = '';
      
      // Delay before trying to reload data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to load from URL or database
      const fromUrl = await setupShopFromUrl();
      if (!fromUrl) {
        await loadShopsFromDatabase();
      }
      
      console.log("Connection state reset complete");
    } catch (error) {
      console.error("Error during connection reset:", error);
    }
  };

  useEffect(() => {
    const setupAuth = async () => {
      try {
        setLoading(true);
        
        // Try URL parameters first (highest priority)
        const { shopDomain, isShopifyRequest } = parseShopifyParams();
        
        if (shopDomain && isShopifyRequest) {
          console.log("URL contains Shopify parameters:", shopDomain);
          // Clear any other stores to avoid confusion
          shopifyConnectionManager.clearAllStores();
          
          // Set as connected
          setShop(shopDomain);
          setShopifyConnected(true);
          setShops([shopDomain]);
          
          // Update localStorage
          localStorage.setItem('shopify_store', shopDomain);
          localStorage.setItem('shopify_connected', 'true');
        } else {
          // Setup Shopify shop from other sources
          const shopConnected = await setupShopFromUrl();
          
          if (shopConnected) {
            // Get the active store again to ensure it's updated
            const activeStore = shopifyConnectionManager.getActiveStore();
            if (activeStore) {
              setShop(activeStore);
              setShopifyConnected(true);
              
              // Get all stores for the shops list
              const allStores = shopifyConnectionManager.getAllStores();
              if (allStores && allStores.length > 0) {
                setShops(allStores.map(store => store.domain));
              } else {
                setShops([activeStore]);
              }
              
              // Update localStorage
              localStorage.setItem('shopify_store', activeStore);
              localStorage.setItem('shopify_connected', 'true');
            }
          }
        
          // For development, create a default connection if none exists
          if (process.env.NODE_ENV === 'development' && !shopConnected && !shop) {
            console.log("Development mode: Using default shop");
            const defaultShop = 'dev-store.myshopify.com';
            shopifyConnectionManager.addOrUpdateStore(defaultShop, true);
            
            setShop(defaultShop);
            setShopifyConnected(true);
            setShops([defaultShop]);
            
            // Update localStorage
            localStorage.setItem('shopify_store', defaultShop);
            localStorage.setItem('shopify_connected', 'true');
            
            // Create a default user for development
            const devUser = { id: 'shopify-user', email: 'dev@example.com' };
            setUser(devUser);
          }
        }
        
        // Try to load all shops from database
        await loadShopsFromDatabase();
        
        // After all attempts, forcibly synchronize state
        await syncConnectionState();
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUser(session.user);
        } else if (shop) {
          // If we have a shop connection but no user, create a temporary user
          const tempUser = { id: 'shopify-user', email: shop ? `shopify@${shop.replace('.myshopify.com', '')}.app` : 'shopify@unknown.app' };
          console.log("Creating temporary Shopify user:", tempUser);
          setUser(tempUser);
        }
      } catch (error) {
        console.error("Error setting up auth:", error);
      } finally {
        setLoading(false);
      }
    };

    setupAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          // Don't clear Shopify connection when signing out
        }
      }
    );

    // Listen for URL changes to detect shop parameter
    const handleUrlChange = () => {
      const { shopDomain, isShopifyRequest } = parseShopifyParams();
      if (shopDomain && isShopifyRequest && shopDomain !== shop) {
        console.log("URL changed with new shop:", shopDomain);
        handleSetShop(shopDomain);
      }
    };

    // Use the popstate event to detect URL changes
    window.addEventListener('popstate', handleUrlChange);

    // Perform regular checks to make sure connection state is synchronized
    // But with reduced frequency and with circuit breaker
    const intervalId = setInterval(() => {
      // Only run when not loading
      if (!loading) {
        syncConnectionState();
      }
    }, SYNC_INTERVAL);

    // Expose emergency reset function globally for debugging
    (window as any).resetShopifyConnection = resetEntireConnectionState;

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('popstate', handleUrlChange);
      clearInterval(intervalId);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(`خطأ في تسجيل الدخول: ${error.message}`);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`خطأ في تسجيل الخروج: ${error.message}`);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        shopifyConnected,
        shop,
        shops,
        setShop: handleSetShop,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
