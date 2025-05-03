
import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { detectCurrentShop, parseShopifyParams } from '@/utils/shopify-helpers';
import { toast } from 'sonner';

interface AuthProviderProps {
  children: React.ReactNode;
}

interface AuthContextType {
  user: any;
  loading: boolean;
  shopifyConnected: boolean;
  shop: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  shopifyConnected: false,
  shop: null,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<string | null>(null);
  const [shopifyConnected, setShopifyConnected] = useState(false);

  // Function to detect and store shop
  const setupShopFromUrl = () => {
    // First try to get shop from URL
    const { shopDomain, isShopifyRequest } = parseShopifyParams();
    
    if (shopDomain && isShopifyRequest) {
      console.log("Setting shop from URL params:", shopDomain);
      localStorage.setItem('shopify_store', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
      setShop(shopDomain);
      setShopifyConnected(true);
      return true;
    }
    
    // If not in URL, check localStorage
    const storedShop = localStorage.getItem('shopify_store');
    const isConnected = localStorage.getItem('shopify_connected') === 'true';
    
    if (storedShop && isConnected) {
      console.log("Setting shop from localStorage:", storedShop);
      setShop(storedShop);
      setShopifyConnected(true);
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    const setupAuth = async () => {
      try {
        setLoading(true);
        
        // Setup Shopify shop first
        const shopConnected = setupShopFromUrl();
        
        // For development, create a default user if not authenticated
        if (process.env.NODE_ENV === 'development' && !shopConnected) {
          console.log("Development mode: Using default shop and user");
          const defaultShop = 'dev-store.myshopify.com';
          localStorage.setItem('shopify_store', defaultShop);
          localStorage.setItem('shopify_connected', 'true');
          setShop(defaultShop);
          setShopifyConnected(true);
          
          // Create a default user for development
          const devUser = { id: 'shopify-user', email: 'dev@example.com' };
          setUser(devUser);
          setLoading(false);
          return;
        }
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setUser(session.user);
        } else if (shopConnected) {
          // If we have a shop connection but no user, create a temporary user
          const tempUser = { id: 'shopify-user', email: `shopify@${shop?.replace('.myshopify.com', '')}.app` };
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

    return () => {
      authListener.subscription.unsubscribe();
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
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
