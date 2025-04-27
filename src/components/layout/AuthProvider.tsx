
import { ReactNode, useEffect, useState } from 'react';
import { AuthContext } from '@/lib/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState({
    shopifyConnected: false,
    shop: undefined as string | undefined,
    user: undefined as any
  });
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const handleShopifyAuth = async () => {
      // التحقق من وجود معلمات التوجيه من Shopify
      const params = new URLSearchParams(window.location.search);
      const shop = params.get("shop");
      const shopifyConnected = params.get("shopify_connected");
      const hmac = params.get("hmac");
      const timestamp = params.get("timestamp");
      const authSuccess = params.get("auth_success");

      // استعادة بيانات متجر Shopify من localStorage
      const savedShop = localStorage.getItem('shopify_store');
      const savedConnected = localStorage.getItem('shopify_connected');
      // بيانات متجر مؤقتة (أثناء المصادقة)
      const tempShop = localStorage.getItem('shopify_temp_store');

      console.log('معلمات المصادقة:', { 
        shop, shopifyConnected, hmac, authSuccess,
        savedShop, savedConnected, tempShop,
        pathname: location.pathname
      });

      // إذا كان هناك معلمة متجر وكود تفويض في URL، توجيه إلى مسار المصادقة
      if ((shop || tempShop) && (hmac || location.pathname.startsWith('/auth'))) {
        // المستخدم في عملية المصادقة، اتركه لعملية المصادقة
        console.log('في عملية المصادقة، عدم التدخل...');
        setAuthChecked(true);
        return;
      }

      // التحقق من وجود معلمات جديدة من شوبيفاي من المصادقة الناجحة
      if (shopifyConnected === "true" && shop) {
        console.log('تم اكتشاف اتصال جديد بـ Shopify:', shop);
        
        // تحديث حالة المصادقة وحفظها في localStorage
        setAuthState({
          shopifyConnected: true,
          shop: shop,
          user: { id: 'shopify-user' }
        });
        
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
        
        // إزالة أي بيانات مؤقتة
        localStorage.removeItem('shopify_temp_store');
        
        // إظهار رسالة نجاح
        if (authSuccess === "true") {
          toast.success(`تم الاتصال بمتجر ${shop} بنجاح`);
        }
        
        // إزالة معلمات URL من العنوان إذا كنا في لوحة التحكم
        if (location.pathname === '/dashboard' && window.history.replaceState) {
          window.history.replaceState({}, document.title, '/dashboard');
        }
      } 
      // استعادة حالة الاتصال السابقة من localStorage إذا كانت متوفرة
      else if (savedConnected === 'true' && savedShop) {
        console.log('استعادة اتصال Shopify مخزن:', savedShop);
        
        setAuthState({
          shopifyConnected: true,
          shop: savedShop,
          user: { id: 'shopify-user' }
        });
      }
      // إذا كان لدينا معلومات متجر مؤقتة ولكن لم تكتمل المصادقة بعد
      else if (tempShop && location.pathname === '/dashboard') {
        console.log('بيانات متجر مؤقتة موجودة، ولكن المصادقة لم تكتمل:', tempShop);
        
        // إذا كنا على صفحة لوحة التحكم، عرض رسالة للمستخدم
        toast.error("لم تكتمل عملية المصادقة مع Shopify. يرجى المحاولة مرة أخرى.");
        localStorage.removeItem('shopify_temp_store');
      }

      // السماح بالوصول إلى لوحة التحكم على أي حال (مع أو بدون مصادقة)
      setAuthChecked(true);
    };

    handleShopifyAuth();
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
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};
