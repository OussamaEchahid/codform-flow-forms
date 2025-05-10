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
      const { data, error } = await shopifySupabase
        .from('shopify_stores')
        .select('shop,is_active,updated_at')
        .order('is_active', { ascending: false })
        .order('updated_at', { ascending: false });
        
      if (!error && data && data.length > 0) {
        console.log('Loaded shops from database:', data);
        
        // Use the first active store, or the most recently updated
        const activeDbStore = data.find(s => s.is_active) || data[0];
        
        if (activeDbStore) {
          console.log(`Setting active shop from database: ${activeDbStore.shop}`);
          shopifyConnectionManager.setActiveStore(activeDbStore.shop);
          setShop(activeDbStore.shop);
          setShopifyConnected(true);
          
          // Update shops list
          setShops(data.map(store => store.shop));
          return true;
        }
      }
      return false;
    } catch (dbError) {
      console.error('Error loading shops from database:', dbError);
      return false;
    }
  };

  // Sync shop state from all available sources
  const syncShopState = async () => {
    try {
      // First, try to get shop from URL params
      const urlShopFound = await setupShopFromUrl();
      if (urlShopFound) return true;
      
      // Next, try to get from database
      const dbShopFound = await loadShopsFromDatabase();
      if (dbShopFound) return true;
      
      // Finally, try developer mode defaults
      if (process.env.NODE_ENV === 'development' || import.meta.env.DEV === true) {
        console.log("Development environment detected, using test shop");
        const testStore = 'astrem.myshopify.com';
        handleSetShop(testStore);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error syncing shop state:", error);
      return false;
    }
  };

  // Run initial sync
  useEffect(() => {
    const initShopState = async () => {
      setLoading(true);
      try {
        const success = await syncShopState();
        if (!success) {
          console.log("Could not establish shop connection from any source");
        }
      } catch (error) {
        console.error("Error in initial shop state setup:", error);
      } finally {
        setLoading(false);
      }
    };
    
    initShopState();
  }, []);

  // Auth state change listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          setUser(session?.user || null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
  };

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
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
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
