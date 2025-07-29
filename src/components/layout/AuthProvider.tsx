import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  shopifyConnected: boolean;
  shop: string | null;
  shops: string[] | null;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string) => Promise<{ error?: any }>;
  setShop?: (shop: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<string[] | null>(null);
  const [activeStore, setActiveStore] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // جلب المتاجر
          try {
            // @ts-ignore - temporary fix for type issue
            const { data: stores, error } = await supabase
              .from('shopify_stores')
              .select('shop')
              .eq('user_id', session.user.id)
              .eq('is_active', true)
              .order('updated_at', { ascending: false });

            if (!error && stores) {
              const storeList = stores.map(s => s.shop);
              setShops(storeList);
              
              // تعيين أول متجر كنشط
              if (storeList.length > 0) {
                const firstStore = storeList[0];
                setActiveStore(firstStore);
                localStorage.setItem('shopify_store', firstStore);
                localStorage.setItem('shopify_connected', 'true');
                console.log(`✅ Active store set: ${firstStore}`);
              }
            }
          } catch (err) {
            console.error('Error fetching stores:', err);
          }
        }
        
        if (event === 'SIGNED_OUT') {
          setShops(null);
          setActiveStore(null);
          localStorage.removeItem('shopify_store');
          localStorage.removeItem('shopify_connected');
        }
        
        setLoading(false);
      }
    );

    // جلب الجلسة الحالية
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!error && session?.user && isMounted) {
          setSession(session);
          setUser(session.user);
          
          // @ts-ignore - temporary fix for type issue
          const { data: stores, error: storesError } = await supabase
            .from('shopify_stores')
            .select('shop')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .order('updated_at', { ascending: false });

          if (!storesError && stores) {
            const storeList = stores.map(s => s.shop);
            setShops(storeList);
            
            if (storeList.length > 0) {
              const firstStore = storeList[0];
              setActiveStore(firstStore);
              localStorage.setItem('shopify_store', firstStore);
              localStorage.setItem('shopify_connected', 'true');
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error getting initial session:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setLoading(false);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      setLoading(false);
      return { error };
    } catch (error) {
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/auth';
    }
  };

  const shopifyConnected = !!activeStore && !!shops && shops.length > 0;

  const value = {
    user,
    session,
    loading,
    shopifyConnected,
    shop: activeStore,
    shops,
    signOut,
    signIn,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};