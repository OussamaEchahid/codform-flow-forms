
import React, { useState, useEffect } from 'react';
import { AuthContext, AuthContextType } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [shopifyConnected, setShopifyConnected] = useState<boolean>(false);
  const [shop, setShop] = useState<string | undefined>(undefined);
  const [isTokenVerified, setIsTokenVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [lastConnectionTime, setLastConnectionTime] = useState<string | undefined>(undefined);

  // تحديث حالة الاتصال مع متجر Shopify
  const refreshShopifyConnection = () => {
    // قراءة البيانات من التخزين المحلي
    const shopInStorage = localStorage.getItem('shopify_store');
    const connectionStatus = localStorage.getItem('shopify_connected') === 'true';
    const lastConnectTime = localStorage.getItem('shopify_last_connect_time');
    
    console.log("AuthProvider: refreshing Shopify connection status", {
      shopInStorage,
      connectionStatus,
      lastConnectTime
    });

    setShop(shopInStorage || undefined);
    setShopifyConnected(connectionStatus);
    setLastConnectionTime(lastConnectTime || undefined);
    
    // إعادة تعيين حالة التحقق من الرمز
    setIsTokenVerified(false);

    if (shopInStorage && connectionStatus) {
      verifyTokenInDatabase(shopInStorage);
    }
  };

  // إعادة الاتصال بشكل إجباري - مسح جميع بيانات الاتصال
  const forceReconnect = () => {
    console.log("AuthProvider: forcing reconnection");
    
    // مسح جميع بيانات الاتصال من التخزين المحلي
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_temp_store');
    localStorage.removeItem('shopify_last_connect_time');
    localStorage.removeItem('shopify_reconnect_attempts');
    
    // إعادة تعيين حالة الاتصال
    setShop(undefined);
    setShopifyConnected(false);
    setIsTokenVerified(false);
    setLastConnectionTime(undefined);
    
    // إظهار رسالة للمستخدم
    toast.info('تم مسح بيانات الاتصال. يرجى إعادة الاتصال بمتجر Shopify.');
    
    // يمكن إعادة توجيه المستخدم إلى صفحة الاتصال
    setTimeout(() => {
      window.location.href = '/shopify?force=true&ts=' + Date.now();
    }, 1000);
  };

  // التحقق من وجود الرمز في قاعدة البيانات
  const verifyTokenInDatabase = async (shopDomain: string) => {
    console.log("AuthProvider: verifying token in database for shop", shopDomain);
    
    try {
      // التحقق من وجود الرمز في قاعدة البيانات
      const { data: storeData, error } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shopDomain)
        .maybeSingle();
      
      if (error) {
        console.error("AuthProvider: Error verifying token:", error);
        setIsTokenVerified(false);
        return;
      }
      
      if (storeData && storeData.access_token) {
        console.log("AuthProvider: Token verified for shop", shopDomain);
        setIsTokenVerified(true);
        
        // تحديث وقت آخر اتصال ناجح
        localStorage.setItem('shopify_last_connect_time', Date.now().toString());
        setLastConnectionTime(Date.now().toString());
      } else {
        console.log("AuthProvider: No valid token found for shop", shopDomain);
        setIsTokenVerified(false);
        
        // إذا لم يتم العثور على رمز، يمكن محاولة إعادة الاتصال
        localStorage.removeItem('shopify_connected');
        setShopifyConnected(false);
      }
    } catch (error) {
      console.error("AuthProvider: Exception while verifying token:", error);
      setIsTokenVerified(false);
    }
  };

  // التحقق من حالة المصادقة عند تحميل التطبيق
  useEffect(() => {
    const setupAuth = async () => {
      console.log("AuthProvider: Setting up authentication");
      
      // التحقق من المستخدم الحالي
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      // قراءة بيانات اتصال Shopify من التخزين المحلي
      refreshShopifyConnection();
      
      // استماع لتغييرات حالة المصادقة
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("AuthProvider: Auth state change", event);
        setUser(session?.user ?? null);
      });
      
      setLoading(false);
      
      return () => {
        authListener.subscription.unsubscribe();
      };
    };
    
    setupAuth();
  }, []);

  // Check for Shopify callback parameters and process them
  useEffect(() => {
    const processCallbackParams = async () => {
      const params = new URLSearchParams(window.location.search);
      const shop = params.get('shop');
      const host = params.get('host');
      const timestamp = params.get('timestamp');
      
      if (shop && host && timestamp) {
        console.log("AuthProvider: Detected Shopify callback parameters", { shop, host, timestamp });
        
        // Store parameters and update connection status
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
        localStorage.setItem('shopify_last_connect_time', Date.now().toString());
        
        // Update state
        setShop(shop);
        setShopifyConnected(true);
        setLastConnectionTime(Date.now().toString());
        
        // Verify token
        verifyTokenInDatabase(shop);
      }
    };
    
    processCallbackParams();
  }, []);

  // إنشاء كائن سياق المصادقة
  const contextValue: AuthContextType = {
    user,
    shopifyConnected,
    shop,
    refreshShopifyConnection,
    isTokenVerified,
    forceReconnect,
    lastConnectionTime
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#9b87f5]"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
