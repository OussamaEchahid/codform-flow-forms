
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ShopifyRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // الحصول على معلمة shop من العنوان
    const params = new URLSearchParams(location.search);
    const shop = params.get("shop");

    // تحديد مكان التوجيه بناءً على المسار الحالي
    if (location.pathname.includes("/auth")) {
      // إذا كنا على مسار المصادقة، قم بالتوجيه إلى مصادقة Shopify
      window.location.href = `/auth?shop=${shop}`;
    } else if (location.pathname.includes("/dashboard") || location.pathname === "/shopify" || location.pathname === "/shopify/dashboard") {
      // إذا كنا على مسار لوحة التحكم أو مسار Shopify، قم بالتوجيه إلى لوحة التحكم
      navigate("/dashboard");
    } else {
      // لأي مسار آخر متعلق بـ Shopify، تحقق مما إذا كان لدينا معلمة shop
      if (shop) {
        // إذا كان لدينا معلمة shop، قم بالتوجيه إلى المصادقة
        window.location.href = `/auth?shop=${shop}`;
      } else {
        // خلاف ذلك، قم بالتوجيه إلى الصفحة الرئيسية
        navigate("/");
      }
    }
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center h-screen" dir="rtl">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">جاري التوجيه...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4">سيتم توجيهك تلقائيًا خلال لحظات...</p>
      </div>
    </div>
  );
};

export default ShopifyRedirect;
