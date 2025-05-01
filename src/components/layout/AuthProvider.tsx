
import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext, AuthContextType } from '@/lib/auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState({
    shopifyConnected: false,
    shop: undefined as string | undefined,
    user: undefined as any
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [isAuthCheckInProgress, setIsAuthCheckInProgress] = useState(false);

  // Function to verify connection with Supabase
  const verifyShopifyConnection = async (shopDomain: string) => {
    if (!shopDomain) return false;

    try {
      console.log(`AuthProvider: Verifying connection for shop: ${shopDomain}`);
      // Get store access token
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shopDomain)
        .maybeSingle();
      
      if (storeError) {
        console.error('Store access token error:', storeError);
        return false;
      }
      
      if (!storeData || !storeData.access_token) {
        console.error('No store data or access token found');
        return false;
      }
      
      console.log('Valid token found for shop:', shopDomain);
      return true;
    } catch (err) {
      console.error('Error verifying connection:', err);
      return false;
    }
  };

  useEffect(() => {
    // الحماية ضد عمليات فحص متعددة متزامنة
    if (isAuthCheckInProgress || authChecked) {
      return;
    }

    // عملية فحص بيانات المصادقة
    const handleAuth = async () => {
      setIsAuthCheckInProgress(true);
      try {
        // فحص معلمات إعادة التوجيه من Shopify
        const params = new URLSearchParams(window.location.search);
        const shop = params.get("shop");
        const shopifyConnected = params.get("shopify_connected");
        const shopifySuccess = params.get("shopify_success");
        const hmac = params.get("hmac");
        const timestamp = params.get("timestamp");
        const authSuccess = params.get("auth_success");

        // الحصول على بيانات Shopify المحفوظة من التخزين المحلي
        const savedShop = localStorage.getItem('shopify_store');
        const savedConnected = localStorage.getItem('shopify_connected');
        const tempShop = localStorage.getItem('shopify_temp_store');

        // تسجيل معلمات المصادقة لتصحيح الأخطاء
        console.log('AuthProvider: Auth parameters:', { 
          shop, shopifyConnected, shopifySuccess, hmac, authSuccess,
          pathname: location.pathname,
          search: location.search,
          savedShop,
          savedConnected,
          tempShop,
          currentState: authState
        });

        // التحقق مما إذا كان لدينا رمز صالح في Supabase للمتجر
        let tokenValid = false;
        let shopToUse = shop || savedShop || tempShop;
        
        if (shopToUse) {
          tokenValid = await verifyShopifyConnection(shopToUse);
          
          if (tokenValid) {
            console.log('Found valid Shopify token in database for:', shopToUse);
            setIsTokenVerified(true);
            
            // تعيين حالة الاتصال
            setAuthState({
              shopifyConnected: true,
              shop: shopToUse,
              user: { id: 'shopify-user' }
            });
            
            // تحديث التخزين المحلي ليتطابق مع حالة قاعدة البيانات
            localStorage.setItem('shopify_store', shopToUse);
            localStorage.setItem('shopify_connected', 'true');
            
            // مسح أي بيانات مؤقتة
            localStorage.removeItem('shopify_temp_store');
            
            // عرض رسالة فقط في حالات معينة
            if ((shopifySuccess === "true" || authSuccess === "true") && 
                (location.pathname === '/dashboard' || location.pathname === '/shopify-redirect' || location.pathname.includes('/api/shopify-callback'))) {
              toast.success(`تم الاتصال بمتجر ${shopToUse} بنجاح`);
            }
            
            setAuthChecked(true);
            setIsAuthCheckInProgress(false);
            return;
          } else {
            console.log('No valid token found in database for shop:', shopToUse);
            // إذا كان لدينا بيانات تخزين محلية ولكن لا يوجد رمز صالح، قم بمسح التخزين المحلي
            if (savedShop === shopToUse && savedConnected === 'true') {
              console.log('Clearing invalid local storage data');
              localStorage.removeItem('shopify_store');
              localStorage.removeItem('shopify_connected');
            }
          }
        }

        // التحقق من معلمات نجاح Shopify إذا فشل فحص قاعدة البيانات
        if ((shopifySuccess === "true" || shopifyConnected === "true") && shop) {
          console.log('Shopify connection success from URL parameters:', shop);
          
          // تحقق مرة أخرى مع قاعدة البيانات للتأكد
          const isValid = await verifyShopifyConnection(shop);
              
          if (!isValid) {
            console.log('Token not found in database despite success parameter');
            
            // إذا كنا في صفحة لوحة التحكم، اعرض تحذيرًا
            if (location.pathname === '/dashboard') {
              toast.error('لم يتم العثور على رمز الوصول في قاعدة البيانات. يرجى إعادة الاتصال.');
              setAuthState({
                shopifyConnected: false,
                shop: undefined,
                user: undefined
              });
              setAuthChecked(true);
              setIsAuthCheckInProgress(false);
              return;
            }
          } else {
            console.log('Verified token exists in database');
            setIsTokenVerified(true);
            
            setAuthState({
              shopifyConnected: true,
              shop: shop,
              user: { id: 'shopify-user' }
            });
            
            localStorage.setItem('shopify_store', shop);
            localStorage.setItem('shopify_connected', 'true');
            
            // إزالة أي بيانات مؤقتة
            localStorage.removeItem('shopify_temp_store');
            
            // عرض رسالة نجاح إذا لم يتم عرضها بالفعل
            if (location.pathname === '/dashboard' || location.pathname === '/shopify-redirect') {
              toast.success(`تم الاتصال بمتجر ${shop} بنجاح`);
            }
            
            // إزالة معلمات URL إذا كنا في لوحة التحكم
            if (location.pathname === '/dashboard' && window.history.replaceState) {
              window.history.replaceState({}, document.title, '/dashboard');
            }
            
            setAuthChecked(true);
            setIsAuthCheckInProgress(false);
            return;
          }
        }
        // استعادة حالة الاتصال السابقة من التخزين المحلي إذا كان متاحًا
        else if (savedConnected === 'true' && savedShop && !tokenValid) {
          console.log('Restoring saved Shopify connection from localStorage:', savedShop);
          
          // تحقق مرة أخرى مع قاعدة البيانات إذا كان لدينا رمز صالح
          const isValid = await verifyShopifyConnection(savedShop);
              
          if (isValid) {
            console.log('Confirmed token exists for saved shop:', savedShop);
            setIsTokenVerified(true);
            
            setAuthState({
              shopifyConnected: true,
              shop: savedShop,
              user: { id: 'shopify-user' }
            });
          } else {
            console.log('No token found for saved shop, clearing localStorage');
            localStorage.removeItem('shopify_store');
            localStorage.removeItem('shopify_connected');
            
            // تحديث الحالة إلى غير متصل
            setAuthState({
              shopifyConnected: false,
              shop: undefined,
              user: undefined
            });
            
            if (location.pathname === '/forms' || location.pathname === '/dashboard') {
              toast.error('انتهت صلاحية الاتصال بـ Shopify. يرجى إعادة الاتصال.');
            }
          }
        } else {
          // إذا لم يتم العثور على معلومات الاتصال، قم بتعيين الحالة إلى غير متصل
          setAuthState({
            shopifyConnected: false,
            shop: undefined,
            user: undefined
          });
        }
        
        // إذا كان لدينا معلومات مخزن مؤقتة ولكن المصادقة لم تكتمل
        if (tempShop && (location.pathname === '/dashboard' || location.pathname === '/forms') && !authState.shopifyConnected) {
          console.log('Temporary store data exists, but auth didn\'t complete:', tempShop);
          
          // عرض رسالة للمستخدم
          toast.error("لم تكتمل عملية مصادقة Shopify. الرجاء المحاولة مرة أخرى.");
          localStorage.removeItem('shopify_temp_store');
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
      } finally {
        setAuthChecked(true);
        setIsAuthCheckInProgress(false);
      }
    };

    handleAuth();
  }, [location.pathname, location.search, navigate, authChecked, isAuthCheckInProgress, authState]);
  
  // وظيفة لتحديث حالة الاتصال
  const refreshShopifyConnection = () => {
    console.log("Refreshing Shopify connection state");
    
    // مسح حالة التخزين المحلي
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_temp_store');
    
    // إعادة تعيين حالة المصادقة
    setAuthState({
      shopifyConnected: false,
      shop: undefined,
      user: undefined
    });
    
    setIsTokenVerified(false);
    setAuthChecked(false); // إعادة التحقق من حالة المصادقة
  };
  
  // كائن السياق مع وظيفة التحديث
  const authContextValue: AuthContextType = {
    ...authState,
    refreshShopifyConnection,
    isTokenVerified
  };

  // عرض حالة التحميل حتى يتم التحقق من المصادقة
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
