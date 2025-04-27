
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

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
    
    console.log("معلمات الصفحة:", { shop, hmac, code, timestamp });
    
    // التحقق من وجود معلمة متجر
    if (!shop) {
      // إذا لم تكن هناك معلمة متجر، تحقق من وجود متجر مخزن سابقاً
      const savedShop = localStorage.getItem('shopify_store');
      const savedConnected = localStorage.getItem('shopify_connected');
      
      console.log("البيانات المخزنة:", { savedShop, savedConnected });
      
      if (savedShop && savedConnected === 'true') {
        // إذا كان لدينا بيانات متجر مخزنة، توجيه إلى لوحة التحكم مباشرة
        console.log("استخدام بيانات متجر مخزنة للتوجيه...");
        navigate(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(savedShop)}`);
        return;
      }
      
      // إذا لم تكن هناك معلمة متجر ولا بيانات مخزنة، أظهر خطأ
      setStatus("خطأ: لم يتم توفير معلمة متجر Shopify");
      setError("يرجى التأكد من وجود معلمة 'shop' في عنوان URL أو اتباع الخطوات الصحيحة لتثبيت التطبيق");
      return;
    }
    
    // تحديث حالة التوجيه
    setStatus(`جاري توجيهك للمصادقة مع متجر ${shop}...`);
    
    // إضافة سجل للتأكد من معلمات المصادقة الموجودة
    console.log("معلمات Shopify:", { shop, hmac, code, timestamp });
    
    // حفظ بيانات المتجر في localStorage مؤقتاً لاستخدامها في حالة انقطاع عملية المصادقة
    try {
      localStorage.setItem('shopify_temp_store', shop);
      console.log("تم حفظ معلومات المتجر المؤقتة:", shop);
    } catch (e) {
      console.error("خطأ في حفظ البيانات المؤقتة:", e);
    }
    
    // إذا كان لدينا معلمات المصادقة مثل hmac أو code، نستمر في عملية المصادقة
    if (hmac || code) {
      console.log("معلمات مصادقة وجدت، توجيه إلى مسار المصادقة...");
      // توجيه المستخدم إلى مسار المصادقة الرسمي مع جميع المعلمات
      window.location.href = `/auth?${params.toString()}`;
    } else {
      console.log("بدء عملية المصادقة الجديدة للمتجر:", shop);
      // إذا لدينا فقط معلمة المتجر، نبدأ عملية المصادقة من الصفر
      const shopParam = encodeURIComponent(shop);
      window.location.href = `/auth?shop=${shopParam}`;
    }
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {error ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4">{status}</h1>
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              العودة إلى لوحة التحكم
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">{status}</h1>
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
