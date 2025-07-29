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
        
        // في حالة تسجيل الدخول بنجاح، جلب المتاجر وربطها
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            if (isMounted) {
              await fetchUserStores(session.user.id);
              // إضافة آلية لربط المتاجر غير المربوطة تلقائياً
              await autoLinkOrphanStores(session.user.id);
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

    // جلب الجلسة الحالية مع معلومات إضافية
    const getInitialSession = async () => {
      try {
        console.log('🔍 AuthProvider - جاري جلب الجلسة الحالية...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ خطأ في جلب الجلسة:', error);
          setLoading(false);
          return;
        }
        
        console.log('📋 الجلسة:', session ? `موجودة للمستخدم ${session.user.email}` : 'غير موجودة');
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('✅ تم العثور على مستخدم نشط:', session.user.email);
          await fetchUserStores(session.user.id);
          // ربط المتاجر غير المربوطة عند التهيئة
          await autoLinkOrphanStores(session.user.id);
        } else {
          console.log('❌ لا يوجد مستخدم نشط');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ خطأ في تهيئة الجلسة:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserStores = async (userId: string) => {
    try {
      if (!userId) return;
      
      console.log('🔄 جاري جلب متاجر المستخدم من قاعدة البيانات...');
      
      // استخدام edge function للحصول على المتاجر
      const response = await supabase.functions.invoke('store-link-manager', {
        body: {
          action: 'get_stores',
          userId: userId
        }
      });

      if (response.error) {
        console.error('❌ خطأ في جلب المتاجر:', response.error);
        return;
      }

      const { data } = response;
      const storeList = data?.stores?.map((store: any) => store.shop) || [];
      
      console.log('📋 المتاجر المستلمة:', storeList);
      setShops(storeList);
      
      // التحقق من صحة المتجر النشط الحالي
      const currentActiveStore = simpleShopifyConnectionManager.getActiveStore();
      console.log('🔍 المتجر النشط الحالي:', currentActiveStore);
      
      if (storeList.length > 0) {
        let validStoreFound = false;
        
        // إذا كان هناك متجر نشط، تحقق من صحته
        if (currentActiveStore && storeList.includes(currentActiveStore)) {
          console.log(`✅ المتجر النشط صحيح: ${currentActiveStore}`);
          localStorage.setItem('shopify_connected', 'true');
          validStoreFound = true;
        } else if (currentActiveStore) {
          // إذا كان هناك متجر نشط ولكن غير موجود في القائمة، لا تغيّره
          console.log(`⚠️ المتجر النشط ${currentActiveStore} غير موجود في قائمة المتاجر المتاحة`);
          // لا تقم بتغيير المتجر النشط تلقائياً
          localStorage.setItem('shopify_connected', 'false');
          validStoreFound = false;
        } else {
          // فقط إذا لم يكن هناك متجر نشط على الإطلاق
          const firstValidStore = storeList[0];
          console.log(`🔄 لا يوجد متجر نشط - تعيين: ${firstValidStore}`);
          
          simpleShopifyConnectionManager.setActiveStore(firstValidStore);
          localStorage.setItem('shopify_connected', 'true');
          validStoreFound = true;
        }
        
        if (!validStoreFound) {
          console.log('❌ لم يتم العثور على متجر صالح');
          simpleShopifyConnectionManager.disconnect();
        }
      } else {
        // لا توجد متاجر متصلة
        console.log('❌ لا توجد متاجر متصلة - قطع الاتصال');
        simpleShopifyConnectionManager.disconnect();
      }
    } catch (error) {
      console.error('❌ خطأ في جلب متاجر المستخدم:', error);
    }
  };

  // ربط المتاجر غير المربوطة تلقائياً
  const autoLinkOrphanStores = async (userId: string) => {
    try {
      console.log('🔗 فحص المتاجر غير المربوطة وربطها بالمستخدم:', userId);
      
      // استدعاء edge function لربط المتاجر غير المربوطة
      const response = await supabase.functions.invoke('store-link-manager', {
        body: {
          action: 'link_orphan_stores',
          userId: userId
        }
      });

      if (response.error) {
        console.error('❌ خطأ في ربط المتاجر:', response.error);
      } else {
        console.log('✅ تم فحص وربط المتاجر بنجاح');
      }
    } catch (error) {
      console.error('❌ خطأ في ربط المتاجر التلقائي:', error);
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

  // التحقق من حالة اتصال Shopify بطريقة أكثر دقة
  const [shopifyState, setShopifyState] = useState({
    connected: false,
    activeStore: null as string | null
  });

  // مراقبة تغييرات localStorage وإصلاح حالة المتجر (بدون فحص دوري)
  useEffect(() => {
    const checkShopifyConnection = () => {
      // إذا لم تكن هناك متاجر، اقطع الاتصال
      if (!shops || shops.length === 0) {
        setShopifyState({
          connected: false,
          activeStore: null
        });
        return;
      }

      // الحصول على المتجر النشط من localStorage
      let activeStore = simpleShopifyConnectionManager.getActiveStore();
      
      // فقط إذا لم يكن هناك متجر نشط على الإطلاق، اختر الأول من القائمة
      if (!activeStore) {
        activeStore = shops[0];
        simpleShopifyConnectionManager.setActiveStore(activeStore);
        console.log(`🔄 لا يوجد متجر نشط - تم تعيين: ${activeStore}`);
      } else if (!shops.includes(activeStore)) {
        // إذا كان المتجر النشط غير موجود في القائمة، لا تغيّره تلقائياً
        console.log(`⚠️ المتجر النشط ${activeStore} غير موجود في قائمة المتاجر`);
      }

      const isConnected = simpleShopifyConnectionManager.isConnected();
      
      setShopifyState({
        connected: isConnected && !!activeStore,
        activeStore
      });
    };

    checkShopifyConnection();
  }, [shops]);
  
  const shopifyConnected = shopifyState.connected;
  const shop = shopifyState.activeStore;

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