
import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { detectCurrentShop, parseShopifyParams } from '@/utils/shopify-helpers';
import { toast } from 'sonner';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';

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

  // Function to detect and store shop
  const setupShopFromUrl = () => {
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
      
      setShop(shopDomain);
      setShopifyConnected(true);
      
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
      setShops(allStores.map(store => store.domain));
      
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
  const handleSetShop = (shopDomain: string) => {
    try {
      if (!shopDomain) return;
      
      console.log("Explicitly setting active shop to:", shopDomain);
      
      // Update in connection manager
      shopifyConnectionManager.addOrUpdateStore(shopDomain, true);
      
      // Update state
      setShop(shopDomain);
      setShopifyConnected(true);
      
      // Update localStorage for backward compatibility
      localStorage.setItem('shopify_store', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
      
      // Update list of shops
      const allStores = shopifyConnectionManager.getAllStores();
      setShops(allStores.map(store => store.domain));
      
      console.log(`Active shop set to: ${shopDomain}`);
    } catch (error) {
      console.error("Error setting active shop:", error);
      toast.error("حدث خطأ أثناء تعيين المتجر النشط");
    }
  };

  // Load shops from database
  const loadShopsFromDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('shopify_stores')
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
            // Will be handled by the authentication flow - we just continue
          }
          
          // Update connection manager - but clear all existing first to avoid confusion
          shopifyConnectionManager.clearAllStores();
          
          setShop(shopDomain);
          setShopifyConnected(true);
          setShops([shopDomain]);
        } else {
          // Update connection manager with database shops
          // But don't clear existing shops to avoid losing local state
          data.forEach(storeRecord => {
            shopifyConnectionManager.addOrUpdateStore(storeRecord.shop, storeRecord.is_active);
          });
          
          // Use active shop from database
          const activeShop = data.find(store => store.is_active)?.shop || data[0].shop;
          setShop(activeShop);
          setShopifyConnected(true);
          setShops(data.map(store => store.shop));
        }
      }
    } catch (error) {
      console.error("Error loading shops from database:", error);
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
          // Clear any other stores to avoid confusion, only keep this one
          shopifyConnectionManager.clearAllStores();
          
          setShop(shopDomain);
          setShopifyConnected(true);
          setShops([shopDomain]);
        } else {
          // Setup Shopify shop from other sources
          const shopConnected = setupShopFromUrl();
          
          if (shopConnected) {
            // Get the active store again to ensure it's updated
            const activeStore = shopifyConnectionManager.getActiveStore();
            if (activeStore) {
              setShop(activeStore);
              setShopifyConnected(true);
              
              // Get all stores for the shops list
              const allStores = shopifyConnectionManager.getAllStores();
              setShops(allStores.map(store => store.domain));
            }
          }
        
          // For development, create a default user if not authenticated
          if (process.env.NODE_ENV === 'development' && !shopConnected) {
            console.log("Development mode: Using default shop and user");
            const defaultShop = 'dev-store.myshopify.com';
            shopifyConnectionManager.addOrUpdateStore(defaultShop, true);
            
            setShop(defaultShop);
            setShopifyConnected(true);
            setShops([defaultShop]);
            
            // Create a default user for development
            const devUser = { id: 'shopify-user', email: 'dev@example.com' };
            setUser(devUser);
          }
        }
        
        // Try to load all shops from database
        await loadShopsFromDatabase();
        
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

    // Perform an immediate check for connection state
    setTimeout(() => {
      const activeStore = shopifyConnectionManager.getActiveStore();
      if (activeStore && !shopifyConnected) {
        console.log("Connection state inconsistency detected, syncing state...");
        setShop(activeStore);
        setShopifyConnected(true);
        const allStores = shopifyConnectionManager.getAllStores();
        setShops(allStores.map(store => store.domain));
      }
    }, 500);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('popstate', handleUrlChange);
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
