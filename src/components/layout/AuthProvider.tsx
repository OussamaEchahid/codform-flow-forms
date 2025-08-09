import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import UnifiedStoreManager from '@/utils/unified-store-manager';

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
  // إضافة معلومات المستخدم المستخلصة من Shopify
  isShopifyAuthenticated: boolean;
  shopifyUserEmail: string | null;
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
  
  // دالة مساعدة للحصول على الإيميل من localStorage  
  const getEmailFromLocalStorage = (): string | null => {
    try {
      return localStorage.getItem('shopify_user_email') || null;
    } catch {
      return null;
    }
  };
  
  // الحالة الأساسية - تعتمد على UnifiedStoreManager + تحقق من قاعدة البيانات
  const [activeStore, setActiveStore] = useState<string | null>(() => UnifiedStoreManager.getActiveStore());
  const [shopifyUserEmail, setShopifyUserEmail] = useState<string | null>(() => getEmailFromLocalStorage());
  const [shops, setShops] = useState<string[] | null>(() => {
    const store = UnifiedStoreManager.getActiveStore();
    return store ? [store] : null;
  });
  const [shopifyConnected, setShopifyConnected] = useState<boolean>(false);
  
  // مراقبة تغييرات المتجر باستخدام UnifiedStoreManager
  useEffect(() => {
    const updateFromStorage = () => {
      const currentStore = UnifiedStoreManager.getActiveStore();
      const currentEmail = getEmailFromLocalStorage();
      
      if (currentStore !== activeStore) {
        console.log('📱 AuthProvider - Store updated via UnifiedStoreManager:', currentStore);
        setActiveStore(currentStore);
        setShops(currentStore ? [currentStore] : null);
      }
      
      if (currentEmail !== shopifyUserEmail) {
        console.log('📧 AuthProvider - Email updated from localStorage:', currentEmail);
        setShopifyUserEmail(currentEmail);
      }
    };
    
    // تحديث فوري
    updateFromStorage();
    
    // مراقبة تغييرات المتجر
    const unsubscribe = UnifiedStoreManager.onStoreChange((store) => {
      console.log('📱 AuthProvider - Store changed via UnifiedStoreManager:', store);
      setActiveStore(store);
      setShops(store ? [store] : null);
    });
    
    // مراقبة تغييرات localStorage التقليدية
    window.addEventListener('storage', updateFromStorage);
    
    // تحديث دوري للتأكد من التزامن (يتوقف عند خمول التبويب)
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      updateFromStorage();
    }, 3000);
    
    return () => {
      unsubscribe();
      window.removeEventListener('storage', updateFromStorage);
      clearInterval(interval);
    };
  }, [activeStore, shopifyUserEmail]);

  // تحقق من فعالية الاتصال من قاعدة البيانات (store_is_active)
  useEffect(() => {
    const validate = async () => {
      const store = UnifiedStoreManager.getActiveStore();
      if (!store) {
        setShopifyConnected(false);
        // تنظيف شامل عند عدم وجود متجر
        UnifiedStoreManager.clearActiveStore();
        setActiveStore(null);
        setShops(null);
        localStorage.removeItem('shopify_user_email');
        localStorage.removeItem('shopify_user_name');
        localStorage.removeItem('shopify_connected');
        return;
      }
      try {
        const { data } = await (supabase as any).rpc('store_is_active', { p_shop: store });
        const ok = data === true;
        setShopifyConnected(ok);
        if (!ok) {
          // تنظيف محلي إذا لم يعد المتجر نشطًا
          UnifiedStoreManager.clearActiveStore();
          setActiveStore(null);
          setShops(null);
          localStorage.removeItem('shopify_connected');
        }
      } catch (e) {
        console.error('❌ validate store connection failed:', e);
        // اعتبر الاتصال غير فعّال ونظّف الحالة محلياً لتجنب اتصال وهمي
        setShopifyConnected(false);
        UnifiedStoreManager.clearActiveStore();
        setActiveStore(null);
        setShops(null);
        localStorage.removeItem('shopify_user_email');
        localStorage.removeItem('shopify_user_name');
        localStorage.removeItem('shopify_connected');
      }
    };

    validate();
    const onFocus = () => validate();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [activeStore]);

  // إعداد المصادقة التقليدية (اختيارية)
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔑 Auth event:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // تحقق من الجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    // Clear all Shopify data using UnifiedStoreManager
    UnifiedStoreManager.clearActiveStore();
    localStorage.removeItem('shopify_user_email');
    localStorage.removeItem('shopify_connected');
    
    // Clear state
    setActiveStore(null);
    setShopifyUserEmail(null);
    setShops(null);
    
    // Sign out from Supabase (optional)
    await supabase.auth.signOut();
    
    console.log('🚪 Signed out and cleared all data');
  };

  const setShop = (shop: string) => {
    const success = UnifiedStoreManager.setActiveStore(shop);
    if (success) {
      setActiveStore(shop);
      setShops([shop]);
    }
    console.log('🏪 Shop set to:', shop, 'Success:', success);
  };

  // تحديد حالة المصادقة عبر Shopify بعد التحقق من قاعدة البيانات
  const isShopifyAuthenticated = shopifyConnected;

  console.log('🔍 AuthProvider state:', {
    activeStore,
    shopifyUserEmail,
    isShopifyAuthenticated,
    shopifyConnected,
    hasTraditionalAuth: !!user,
    loading
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        shopifyConnected,
        shop: activeStore,
        shops,
        signOut,
        signIn,
        signUp,
        setShop,
        isShopifyAuthenticated,
        shopifyUserEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};