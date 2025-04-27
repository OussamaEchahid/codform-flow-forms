
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const ShopifyRedirect = () => {
  const location = useLocation();
  const [status, setStatus] = useState("جاري التوجيه...");

  useEffect(() => {
    // الحصول على معلمة shop من العنوان
    const params = new URLSearchParams(location.search);
    const shop = params.get("shop");
    
    if (!shop) {
      setStatus("خطأ: لم يتم توفير معلمة متجر Shopify");
      return;
    }
    
    // توجيه إلى مسار المصادقة
    console.log("توجيه إلى مسار المصادقة مع متجر:", shop);
    
    // استخدام window.location.href بدلاً من navigate للتأكد من إعادة تحميل الصفحة بالكامل
    window.location.href = `/auth?shop=${shop}`;
  }, [location]);

  return (
    <div className="flex items-center justify-center h-screen" dir="rtl">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{status}</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4">سيتم توجيهك تلقائيًا خلال لحظات...</p>
        <p className="text-gray-500 text-sm mt-2">إذا لم يتم التوجيه تلقائيًا، <a href="/auth" className="text-purple-600 underline">انقر هنا</a></p>
      </div>
    </div>
  );
};

export default ShopifyRedirect;
