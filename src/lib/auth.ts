import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<any>;
  shop: string | null;
  shopifyConnected: boolean;
  refreshShopifyConnection?: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({}),
  logout: async () => {},
  register: async () => ({}),
  shop: null,
  shopifyConnected: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<string | null>(null);
  const [shopifyConnected, setShopifyConnected] = useState(false);

  // Load auth state from supabase and localStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      setLoading(true);
      
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          setUser(data.session.user);
          
          // Check for Shopify connection
          checkShopifyConnection();
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAuthState();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
          checkShopifyConnection();
        } else {
          setUser(null);
          setShopifyConnected(false);
          setShop(null);
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Helper to check Shopify connection status
  const checkShopifyConnection = () => {
    // First check localStorage for connection info
    const storedShop = localStorage.getItem('shopify_store');
    const storedConnected = localStorage.getItem('shopify_connected');
    
    if (storedShop && storedConnected === 'true') {
      setShop(storedShop);
      setShopifyConnected(true);
      return;
    }
    
    // If not found in localStorage, try to get from database
    if (user) {
      supabase
        .rpc('get_user_shop')
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching shop connection:', error);
            return;
          }
          
          if (data) {
            setShop(data);
            setShopifyConnected(true);
            
            // Update localStorage for faster access in the future
            localStorage.setItem('shopify_store', data);
            localStorage.setItem('shopify_connected', 'true');
          }
        });
    }
  };
  
  // Function to refresh Shopify connection
  const refreshShopifyConnection = () => {
    // Clear stored connection info
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    
    // Reset state
    setShopifyConnected(false);
    setShop(null);
    
    // Check if we can retrieve connection info from database
    if (user) {
      checkShopifyConnection();
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setShopifyConnected(false);
      setShop(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Register function
  const register = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    shop,
    shopifyConnected,
    refreshShopifyConnection,
  };

  return { Provider: AuthContext.Provider, value, children };
};

export const useAuth = () => useContext(AuthContext);
