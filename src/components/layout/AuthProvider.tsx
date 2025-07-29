import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { simpleShopifyConnectionManager } from '@/lib/shopify/simple-connection-manager';

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

// دالة تنظيف بيانات المصادقة
const cleanupAuthState = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.startsWith('shopify_')) {
      localStorage.removeItem(key);
    }
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<string[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    // إعداد مستمع تغييرات المصادقة أولاً
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // في حالة تسجيل الدخول بنجاح، جلب المتاجر
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            if (isMounted) {
              fetchUserStores(session.user.id);
            }
          }, 0);
        }
        
        // في حالة تسجيل الخروج، تنظيف البيانات
        if (event === 'SIGNED_OUT') {
          setShops(null);
          cleanupAuthState();
        }
        
        setLoading(false);
      }
    );

    // جلب الجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserStores(session.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserStores = async (userId: string) => {
    try {
      if (!userId) return;
      
      const response = await supabase.functions.invoke('store-link-manager', {
        body: {
          action: 'get_stores',
          userId: userId
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error fetching stores');
      }

      const { data } = response;
      const storeList = data?.stores?.map((store: any) => store.shop) || [];
      setShops(storeList);
      
      // إذا كان هناك متجر نشط، اجعله المتجر الحالي
      if (storeList.length > 0) {
        const activeStore = simpleShopifyConnectionManager.getActiveStore();
        if (!activeStore || !storeList.includes(activeStore)) {
          simpleShopifyConnectionManager.setActiveStore(storeList[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching user stores:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // تنظيف الحالة القديمة
      cleanupAuthState();
      
      // محاولة تسجيل خروج عام
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // تجاهل الأخطاء
      }
      
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
      
      // تنظيف الحالة القديمة
      cleanupAuthState();
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
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
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });
      // إعادة تحميل كاملة للصفحة لضمان تنظيف الحالة
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      // في حالة فشل تسجيل الخروج، توجيه إلى صفحة تسجيل الدخول
      window.location.href = '/auth';
    }
  };

  // التحقق من حالة اتصال Shopify
  const activeStore = simpleShopifyConnectionManager.getActiveStore();
  const isShopifyConnected = simpleShopifyConnectionManager.isConnected();
  
  const shopifyConnected = isShopifyConnected && !!activeStore;
  const shop = activeStore;

  const value = {
    user,
    session,
    loading,
    shopifyConnected,
    shop,
    shops,
    signOut,
    signIn,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};