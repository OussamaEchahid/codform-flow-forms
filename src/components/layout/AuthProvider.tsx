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
  const [activeStore, setActiveStore] = useState<string | null>(null);
  const [shops, setShops] = useState<string[] | null>(null);

  // دالة للحصول على المتجر من URL parameters عند القدوم من Shopify
  const getShopFromUrl = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('shop');
  };

  // دالة مبسطة لجلب المتاجر من قاعدة البيانات
  const fetchUserStores = async (userId: string) => {
    try {
      // @ts-ignore - temporary fix for type issue
      const { data: stores, error } = await supabase
        .from('shopify_stores')
        .select('shop')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (!error && stores) {
        const storeList = stores.map(s => s.shop);
        setShops(storeList);
        return storeList;
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
    return [];
  };

  // دالة مبسطة لربط المتجر بالمستخدم
  const linkStoreToUser = async (shop: string, userId: string) => {
    try {
      // @ts-ignore - temporary fix for type issue
      await supabase
        .from('shopify_stores')
        .upsert({
          shop,
          user_id: userId,
          is_active: true,
          updated_at: new Date().toISOString()
        });
      console.log('✅ Store linked to user:', shop);
    } catch (err) {
      console.error('Error linking store:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔑 Auth event:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // تحقق فوري من localStorage عند أي تسجيل دخول
          const cachedStore = localStorage.getItem('current_shopify_store');
          console.log('🔍 Checking localStorage for store:', cachedStore);
          
          if (cachedStore) {
            console.log('🏪 Found cached store, setting as active:', cachedStore);
            setActiveStore(cachedStore);
            setShops([cachedStore]);
            
            // تأكد من ربط المتجر بالمستخدم في قاعدة البيانات
            await linkStoreToUser(cachedStore, session.user.id);
          }
          
          // تحقق من وجود متجر في URL (القدوم من Shopify)
          const shopFromUrl = getShopFromUrl();
          if (shopFromUrl) {
            console.log('🏪 Shop detected from URL:', shopFromUrl);
            
            // ربط المتجر بالمستخدم فوراً
            await linkStoreToUser(shopFromUrl, session.user.id);
            
            // تعيين المتجر كنشط
            setActiveStore(shopFromUrl);
            setShops([shopFromUrl]);
            localStorage.setItem('current_shopify_store', shopFromUrl);
            localStorage.setItem('shopify_connected', 'true');
            
            console.log('✅ Store connection established from URL:', shopFromUrl);
          }
          
          // جلب جميع المتاجر من قاعدة البيانات
          const userStores = await fetchUserStores(session.user.id);
          if (userStores.length > 0) {
            setShops(userStores);
            
            // إذا لم يكن هناك متجر نشط محفوظ، استخدم الأول من القاعدة
            if (!cachedStore && !shopFromUrl) {
              const firstStore = userStores[0];
              setActiveStore(firstStore);
              localStorage.setItem('current_shopify_store', firstStore);
              localStorage.setItem('shopify_connected', 'true');
              console.log('✅ Using first store from database:', firstStore);
            }
          }
        }
        
        if (event === 'SIGNED_OUT') {
          setShops(null);
          setActiveStore(null);
          localStorage.removeItem('current_shopify_store');
          localStorage.removeItem('shopify_connected');
          console.log('🚪 User signed out, cleared store data');
        }
        
        setLoading(false);
      }
    );

    // جلب الجلسة الحالية عند البداية
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!error && session?.user && isMounted) {
          setSession(session);
          setUser(session.user);
          
          // تحقق فوري من localStorage
          const cachedStore = localStorage.getItem('current_shopify_store');
          console.log('🔍 Initial session - cached store:', cachedStore);
          
          if (cachedStore) {
            console.log('🏪 Setting active store from cache:', cachedStore);
            setActiveStore(cachedStore);
            setShops([cachedStore]);
            
            // تأكد من ربط المتجر بالمستخدم في قاعدة البيانات
            await linkStoreToUser(cachedStore, session.user.id);
          }
          
          // جلب المتاجر من قاعدة البيانات
          const userStores = await fetchUserStores(session.user.id);
          if (userStores.length > 0) {
            setShops(userStores);
            
            // إذا لم يكن هناك متجر نشط محفوظ، استخدم الأول
            if (!cachedStore) {
              const firstStore = userStores[0];
              setActiveStore(firstStore);
              localStorage.setItem('current_shopify_store', firstStore);
              localStorage.setItem('shopify_connected', 'true');
              console.log('✅ Setting first store from database:', firstStore);
            }
          }
        } else if (!session?.user) {
          // إذا لم يكن هناك مستخدم مسجل دخول
          setActiveStore(null);
          setShops(null);
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