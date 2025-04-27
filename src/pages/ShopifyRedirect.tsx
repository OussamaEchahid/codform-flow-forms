
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
    const timestamp = params.get("timestamp");
    
    if (!shop) {
      setStatus("خطأ: لم يتم توفير معلمة متجر Shopify");
      setError("يرجى التأكد من وجود معلمة 'shop' في عنوان URL");
      return;
    }
    
    // إضافة سجل للتأكد من معلمات المصادقة الموجودة
    console.log("معلمات Shopify:", { shop, hmac, code, timestamp });
    
    // تحديث حالة التوجيه
    setStatus(`جاري توجيهك إلى المصادقة مع متجر ${shop}...`);
    
    // إذا كان لدينا معلمات Shopify كاملة، أعد توجيه المستخدم مباشرة إلى لوحة التحكم
    if (shop && (hmac || code)) {
      console.log("معلمات مصادقة كاملة، توجيه مباشر إلى لوحة التحكم مع معلمات");
      window.location.href = `/dashboard?shopify_connected=true&shop=${encodeURIComponent(shop)}`;
      return;
    }
    
    // إذا لم تكن هناك معلمات مصادقة كاملة، أرسل المستخدم إلى مسار المصادقة
    const redirectTimer = setTimeout(() => {
      console.log("توجيه إلى مسار المصادقة...");
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
