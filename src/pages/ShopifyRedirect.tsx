
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ShopifyRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("جاري التوجيه...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // الحصول على معلمات URL من العنوان
    const params = new URLSearchParams(location.search);
    const shop = params.get("shop");
    const hmac = params.get("hmac");
    const code = params.get("code");
    
    if (!shop) {
      setStatus("خطأ: لم يتم توفير معلمة متجر Shopify");
      setError("يرجى التأكد من وجود معلمة 'shop' في عنوان URL");
      return;
    }
    
    // التحقق مما إذا كنا في مرحلة المصادقة الأولى أو الثانية
    if (code) {
      // نحن في مرحلة المصادقة الثانية مع رمز التفويض
      console.log("تم الحصول على رمز التفويض، جاري إكمال المصادقة...");
      setStatus("تم الحصول على رمز التفويض، جاري إكمال المصادقة...");
    }
    
    console.log("توجيه إلى مسار المصادقة مع متجر:", shop);
    
    // تحديث حالة التوجيه
    setStatus(`جاري توجيهك إلى المصادقة مع متجر ${shop}...`);
    
    // إضافة تأخير قصير قبل التوجيه للسماح بعرض الحالة ثم استخدام window.location للتأكد من إعادة تحميل الصفحة
    const redirectTimer = setTimeout(() => {
      window.location.href = `/auth?${params.toString()}`;
    }, 500);
    
    return () => clearTimeout(redirectTimer);
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">{status}</h1>
        
        {error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
            <p className="mb-4">سيتم توجيهك تلقائيًا خلال لحظات...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopifyRedirect;
