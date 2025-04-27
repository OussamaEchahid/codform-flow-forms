
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // الحصول على معلمات URL
        const url = new URL(window.location.href);
        let shop = url.searchParams.get("shop");
        const hmac = url.searchParams.get("hmac");
        const code = url.searchParams.get("code");
        const timestamp = url.searchParams.get("timestamp");

        // تخزين معلومات التصحيح
        setDebugInfo({ originalShop: shop, hmac, code, timestamp, url: window.location.href });
        console.log("Auth page parameters:", { shop, hmac, code, timestamp, url: window.location.href });

        // تنظيف معلمة المتجر إذا كانت تحتوي على البروتوكول الكامل
        if (shop) {
          try {
            // إذا كان يبدأ بـ http:// أو https://، نأخذ اسم النطاق فقط
            if (shop.startsWith('http')) {
              const shopUrl = new URL(shop);
              shop = shopUrl.hostname;
              console.log("Cleaned shop parameter:", shop);
            }
          } catch (e) {
            console.error("Error cleaning shop URL:", e);
          }
        }

        // إذا لم يكن لدينا معلمة متجر، نعيد توجيه المستخدم إلى لوحة التحكم
        if (!shop) {
          console.error("Missing shop parameter in auth flow");
          setError("معلمة المتجر مفقودة في عملية المصادقة");
          navigate("/dashboard");
          return;
        }

        // تخزين معلومات المتجر المؤقتة في حالة الحاجة إليها لاحقًا
        localStorage.setItem('shopify_temp_store', shop);
        
        // علينا الآن إجراء طلب من جانب الخادم لإكمال المصادقة
        // سيعيد الخادم التوجيه مرة أخرى إلى لوحة التحكم مع جلسة مصادقة
        
        // بناء عنوان URL للمصادقة مع جميع معلمات الاستعلام
        const authParams = new URLSearchParams();
        authParams.set("shop", shop);
        if (hmac) authParams.set("hmac", hmac);
        if (code) authParams.set("code", code);
        if (timestamp) authParams.set("timestamp", timestamp);
        
        console.log("Redirecting to server auth endpoint with params:", authParams.toString());
        window.location.href = `/auth?${authParams.toString()}`;
      } catch (err) {
        console.error("Auth error:", err);
        setError("حدث خطأ أثناء المصادقة");
        setIsLoading(false);
      }
    };

    handleAuth();
  }, [navigate, location]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">خطأ في المصادقة</h1>
          <div className="mb-6 text-red-600">{error}</div>
          <div className="mb-4 p-4 bg-gray-100 rounded text-left text-xs max-h-40 overflow-auto">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">معالجة المصادقة</h1>
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <p>الرجاء الانتظار بينما نقوم بمصادقة متجر Shopify الخاص بك...</p>
        <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs max-h-40 overflow-auto">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default Auth;
