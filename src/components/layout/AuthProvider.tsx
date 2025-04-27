
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

      // حفظ بيانات متجر Shopify في localStorage للاستمرارية
      const savedShop = localStorage.getItem('shopify_store');
      const savedConnected = localStorage.getItem('shopify_connected');

      console.log('معلمات المصادقة:', { 
        shop, shopifyConnected, hmac, 
        savedShop, savedConnected,
        pathname: location.pathname
      });

      // التحقق من وجود معلمات جديدة من شوبيفاي أو بيانات مخزنة
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
        
        // إظهار رسالة نجاح
        toast.success(`تم الاتصال بمتجر ${shop} بنجاح`);
        
        // إزالة معلمات URL من العنوان
        if (window.history.replaceState) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
        
        // توجيه المستخدم إلى لوحة التحكم إذا لم يكن موجودًا فيها بالفعل
        if (location.pathname !== '/dashboard') {
          navigate('/dashboard');
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
