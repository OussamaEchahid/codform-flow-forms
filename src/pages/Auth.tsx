
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shop = searchParams.get('shop');
    
    // تسجيل معلومات التشخيص
    console.log("Auth page loaded with params:", {
      shop,
      search: location.search,
      path: location.pathname,
      pathname: window.location.pathname,
      fullUrl: window.location.href
    });
    
    if (shop) {
      // حفظ متجر مؤقت في localStorage
      try {
        localStorage.setItem('shopify_temp_store', shop);
        console.log("Saved temporary shop:", shop);
      } catch (e) {
        console.error("Error saving temp shop:", e);
      }
      
      // إعادة توجيه إلى ShopifyRedirect مع نفس المعلمات
      navigate(`/shopify-redirect${location.search}`);
    } else {
      // إذا لم يكن هناك معلمة متجر، توجيه مباشر إلى صفحة Shopify
      navigate('/shopify');
    }
  }, [location, navigate]);
  
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">جاري المصادقة...</h1>
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <p className="mb-4">يرجى الانتظار بينما نقوم بإعادة توجيهك...</p>
      </div>
    </div>
  );
};

export default Auth;
