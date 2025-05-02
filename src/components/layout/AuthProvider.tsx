
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
  const refreshShopifyConnection = async (): Promise<boolean> => {
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
      const verified = await verifyTokenInDatabase(shopInStorage);
      
      // هام: إذا كان Shopify متصلاً، أنشئ مستخدمًا افتراضيًا
      // هذا يضمن أن النظام يتعرف على المصادقة حتى بدون تسجيل دخول مباشر
      if (!user && verified) {
        setUser({
          id: `shopify-${shopInStorage}`,
          email: `shop@${shopInStorage}`,
          app_metadata: { provider: 'shopify' },
          user_metadata: { shop: shopInStorage },
          shopify: true
        });
      }
      
      return verified;
    }
    
    return false;
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
    
    // Reset user state if it's a Shopify-based user
    if (user && user.shopify) {
      setUser(null);
    }
    
    // إظهار رسالة للمستخدم
    toast.info('تم مسح بيانات الاتصال. يرجى إعادة الاتصال بمتجر Shopify.');
    
    // يمكن إعادة توجيه المستخدم إلى صفحة الاتصال
    setTimeout(() => {
      window.location.href = '/shopify?force=true&ts=' + Date.now();
    }, 1000);
  };

  // التحقق من وجود الرمز في قاعدة البيانات
  const verifyTokenInDatabase = async (shopDomain: string): Promise<boolean> => {
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
        return false;
      }
      
      if (storeData && storeData.access_token) {
        console.log("AuthProvider: Token verified for shop", shopDomain);
        setIsTokenVerified(true);
        
        // تحديث وقت آخر اتصال ناجح
        localStorage.setItem('shopify_last_connect_time', Date.now().toString());
        setLastConnectionTime(Date.now().toString());
        
        // Create a virtual user for Shopify authentication if user doesn't exist
        if (!user) {
          const shopifyUser = {
            id: `shopify-${shopDomain}`,
            email: `shop@${shopDomain}`,
            app_metadata: { provider: 'shopify' },
            user_metadata: { shop: shopDomain },
            shopify: true
          };
          console.log("AuthProvider: Creating virtual Shopify user:", shopifyUser);
          setUser(shopifyUser);
        }
        
        return true;
      } else {
        console.log("AuthProvider: No valid token found for shop", shopDomain);
        setIsTokenVerified(false);
        
        // إذا لم يتم العثور على رمز، يمكن محاولة إعادة الاتصال
        localStorage.removeItem('shopify_connected');
        setShopifyConnected(false);
        
        // Reset user if it was a Shopify-based user
        if (user && user.shopify) {
          setUser(null);
        }
        
        return false;
      }
    } catch (error) {
      console.error("AuthProvider: Exception while verifying token:", error);
      setIsTokenVerified(false);
      return false;
    }
  };

  // التحقق من حالة المصادقة عند تحميل التطبيق
  useEffect(() => {
    const setupAuth = async () => {
      console.log("AuthProvider: Setting up authentication");
      
      // التحقق من المستخدم الحالي من Supabase
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Check for Shopify authentication first
      const shopInStorage = localStorage.getItem('shopify_store');
      const connectionStatus = localStorage.getItem('shopify_connected') === 'true';
      
      if (shopInStorage && connectionStatus) {
        console.log("AuthProvider: Found Shopify connection, using as authentication");
        if (!currentUser) {
          // Create virtual user for Shopify authentication
          const shopifyUser = {
            id: `shopify-${shopInStorage}`,
            email: `shop@${shopInStorage}`,
            app_metadata: { provider: 'shopify' },
            user_metadata: { shop: shopInStorage },
            shopify: true
          };
          console.log("AuthProvider: Creating virtual Shopify user:", shopifyUser);
          setUser(shopifyUser);
        } else {
          // If there's both a Supabase user and Shopify connection
          console.log("AuthProvider: Using Supabase user with Shopify connection:", currentUser);
          setUser(currentUser);
        }
      } else if (currentUser) {
        // Standard Supabase authentication
        console.log("AuthProvider: Using standard Supabase user:", currentUser);
        setUser(currentUser);
      }
      
      // قراءة بيانات اتصال Shopify من التخزين المحلي
      await refreshShopifyConnection();
      
      // استماع لتغييرات حالة المصادقة
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("AuthProvider: Auth state change", event);
        if (session?.user) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          // Only reset user if it's a Supabase user, not a Shopify user
          const shopInStorage = localStorage.getItem('shopify_store');
          const connectionStatus = localStorage.getItem('shopify_connected') === 'true';
          
          if (!(shopInStorage && connectionStatus)) {
            setUser(null);
          }
        }
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
      const authSuccess = params.get('auth_success');
      
      if (shop && (host || timestamp || authSuccess === 'true')) {
        console.log("AuthProvider: Detected Shopify callback parameters", { shop, host, timestamp, authSuccess });
        
        // Store parameters and update connection status
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
        localStorage.setItem('shopify_last_connect_time', Date.now().toString());
        
        // Update state
        setShop(shop);
        setShopifyConnected(true);
        setLastConnectionTime(Date.now().toString());
        
        // Create a virtual user for Shopify authentication
        const shopifyUser = {
          id: `shopify-${shop}`,
          email: `shop@${shop}`,
          app_metadata: { provider: 'shopify' },
          user_metadata: { shop },
          shopify: true
        };
        console.log("AuthProvider: Creating virtual Shopify user from callback:", shopifyUser);
        setUser(shopifyUser);
        
        // Verify token
        await verifyTokenInDatabase(shop);
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
