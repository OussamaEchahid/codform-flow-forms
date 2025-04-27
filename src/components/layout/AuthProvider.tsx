
import { ReactNode, useEffect, useState } from 'react';
import { AuthContext, useInitAuth } from '@/lib/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useInitAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const handleAuth = () => {
      // التحقق من معلمات Shopify في عنوان URL
      const params = new URLSearchParams(window.location.search);
      const shop = params.get("shop");
      const shopifyConnected = params.get("shopify_connected");
      const hmac = params.get("hmac");
      const timestamp = params.get("timestamp");
      const authError = params.get("auth_error");

      // عرض إشعارات لحالات الاتصال بـ Shopify
      if (shopifyConnected === "true") {
        toast.success('تم الاتصال بمتجر Shopify بنجاح');
      }
      
      if (authError === "true") {
        toast.error('حدث خطأ في الاتصال بمتجر Shopify');
      }

      // إذا كان هناك معلمات Shopify، فنحن في تدفق مصادقة Shopify
      if (shop || hmac || timestamp) {
        console.log("Shopify auth parameters detected:", { shop, hmac, timestamp });
        
        // إذا كنا في المسار الجذر مع معلمات متجر، قم بالتوجيه إلى المصادقة
        if (location.pathname === '/') {
          window.location.href = `/auth?${params.toString()}`;
          return;
        }
        
        // لا تقاطع تدفق المصادقة إذا كنا في مسار المصادقة
        if (location.pathname.startsWith('/auth') || location.pathname.startsWith('/shopify')) {
          console.log("In auth flow, not redirecting");
          setAuthChecked(true);
          return;
        }
      }

      // منطق المصادقة العادي للتطبيق
      if (user) {
        // المستخدم مسجل الدخول
        if (location.pathname === '/auth') {
          console.log("User logged in but on auth page, redirecting to dashboard");
          navigate('/dashboard');
        }
      } else {
        // المستخدم غير مسجل الدخول
        // السماح بالوصول إلى الصفحة الرئيسية دون تسجيل الدخول
        if (location.pathname !== '/' && 
            !location.pathname.startsWith('/auth') && 
            !location.pathname.startsWith('/shopify')) {
          // توجيه المستخدم إلى المصادقة إذا كان يحاول الوصول إلى صفحات محمية
          console.log("User not logged in accessing protected page, redirecting to auth");
          navigate('/auth');
        }
      }
      
      setAuthChecked(true);
    };

    handleAuth();
  }, [user, navigate, location.pathname]);

  // لا تعرض أي شيء حتى نتحقق من حالة المصادقة
  if (!authChecked && !location.pathname.startsWith('/auth') && !location.pathname.startsWith('/shopify')) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, session }}>
      {children}
    </AuthContext.Provider>
  );
};
