
import { ReactNode, useEffect, useState } from 'react';
import { AuthContext } from '@/lib/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { cleanShopDomain } from '@/utils/shopify-helpers';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState({
    shopifyConnected: false,
    shop: undefined as string | undefined,
    user: undefined as any,
    shops: [] as string[]
  });
  const [authChecked, setAuthChecked] = useState(false);

  // تحديث المتجر في حالة المصادقة
  const setShop = (shop: string | undefined) => {
    if (shop) {
      setAuthState(prev => ({
        ...prev,
        shopifyConnected: true,
        shop
      }));
    } else {
      setAuthState(prev => ({
        ...prev,
        shopifyConnected: false,
        shop: undefined
      }));
    }
  };

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // فحص معلمات إعادة التوجيه من Shopify
        const params = new URLSearchParams(window.location.search);
        const shopParam = params.get("shop");
        const shopifyConnected = params.get("shopify_connected");
        const shopifySuccess = params.get("shopify_success");
        const hmac = params.get("hmac");
        const timestamp = params.get("timestamp");
        const authSuccess = params.get("auth_success");

        // تحميل جميع المتاجر من مدير الاتصال
        const allStores = shopifyConnectionManager.getAllStores();
        const activeStore = shopifyConnectionManager.getActiveStore();

        // تسجيل معلومات المصادقة للتصحيح
        console.log('Auth parameters:', { 
          shopParam, shopifyConnected, shopifySuccess, hmac, authSuccess,
          pathname: location.pathname,
          search: location.search,
          activeStore: activeStore?.shop,
          allStores: allStores.map(s => s.shop)
        });

        // التحقق من وجود متجر في Supabase
        try {
          const { data: shopifyStoreFromDB, error } = await supabase
            .rpc('get_user_shop')
            .single();

          if (shopifyStoreFromDB && !error) {
            console.log('Found Shopify store in database:', shopifyStoreFromDB);
            
            // إضافة المتجر من قاعدة البيانات إلى مدير الاتصال إذا لم يكن موجودًا بالفعل
            shopifyConnectionManager.addStore(shopifyStoreFromDB);
            
            // تعيين حالة المصادقة
            setAuthState({
              shopifyConnected: true,
              shop: shopifyConnectionManager.activeStore,
              user: { id: 'shopify-user' },
              shops: shopifyConnectionManager.getAllStores().map(s => s.shop)
            });
            
            setAuthChecked(true);
            return;
          }
        } catch (dbError) {
          console.error("Error checking database for shop:", dbError);
        }

        // التحقق من نجاح الاتصال بـ Shopify
        if (shopifySuccess === "true" && shopParam) {
          console.log('Shopify connection success:', shopParam);
          
          const cleanedShop = cleanShopDomain(shopParam);
          shopifyConnectionManager.addStore(cleanedShop);
          
          setAuthState({
            shopifyConnected: true,
            shop: shopifyConnectionManager.activeStore,
            user: { id: 'shopify-user' },
            shops: shopifyConnectionManager.getAllStores().map(s => s.shop)
          });
          
          // إظهار رسالة نجاح
          toast.success(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
          
          // إزالة معلمات URL إذا كنا على لوحة التحكم
          if (location.pathname === '/dashboard' && window.history.replaceState) {
            window.history.replaceState({}, document.title, '/dashboard');
          }
        }
        // التحقق من معلمات Shopify الجديدة
        else if (shopifyConnected === "true" && shopParam) {
          console.log('New Shopify connection detected:', shopParam);
          
          const cleanedShop = cleanShopDomain(shopParam);
          shopifyConnectionManager.addStore(cleanedShop);
          
          // تحديث حالة المصادقة
          setAuthState({
            shopifyConnected: true,
            shop: shopifyConnectionManager.activeStore,
            user: { id: 'shopify-user' },
            shops: shopifyConnectionManager.getAllStores().map(s => s.shop)
          });
          
          // إظهار رسالة نجاح
          if (authSuccess === "true") {
            toast.success(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
          }
          
          // إزالة معلمات URL إذا كنا على لوحة التحكم
          if (location.pathname === '/dashboard' && window.history.replaceState) {
            window.history.replaceState({}, document.title, '/dashboard');
          }
        } 
        // استعادة حالة الاتصال من مدير الاتصال
        else if (activeStore) {
          console.log('Restoring saved Shopify connection from connection manager:', activeStore.shop);
          
          setAuthState({
            shopifyConnected: true,
            shop: activeStore.shop,
            user: { id: 'shopify-user' },
            shops: shopifyConnectionManager.getAllStores().map(s => s.shop)
          });
        }
        // إذا لم يكن هناك متجر نشط ولم نجد متجر في قاعدة البيانات
        else {
          console.log('No active Shopify store found');
          
          setAuthState({
            shopifyConnected: false,
            shop: undefined,
            user: undefined,
            shops: []
          });
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
      } finally {
        setAuthChecked(true);
      }
    };

    handleAuth();
  }, [location.pathname, location.search, navigate]);

  // عرض حالة التحميل حتى يتم التحقق من المصادقة
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...authState, setShop }}>
      {children}
    </AuthContext.Provider>
  );
};
