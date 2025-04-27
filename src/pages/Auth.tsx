
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [retryCount, setRetryCount] = useState(0);
  const [directServerAccess, setDirectServerAccess] = useState(false);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // الحصول على معلمات عنوان URL
        const url = new URL(window.location.href);
        let shop = url.searchParams.get("shop");
        const hmac = url.searchParams.get("hmac");
        const code = url.searchParams.get("code");
        const timestamp = url.searchParams.get("timestamp");
        const state = url.searchParams.get("state");
        const host = url.searchParams.get("host");

        // تخزين معلومات التصحيح
        const debug = { 
          originalShop: shop, 
          hmac, 
          code, 
          timestamp,
          state,
          host,
          url: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search,
          origin: window.location.origin,
          fullUrl: window.location.href,
          fullPath: window.location.href,
          referrer: document.referrer || "none",
          userAgent: navigator.userAgent,
          cookies: document.cookie,
          retryCount,
        };
        
        setDebugInfo(debug);
        console.log("Auth page loaded with parameters:", debug);

        // تنظيف معلمة المتجر إذا كانت تحتوي على بروتوكول كامل
        if (shop) {
          try {
            // إذا كان يبدأ بـ http:// أو https://، خذ فقط اسم النطاق
            if (shop.startsWith('http')) {
              const shopUrl = new URL(shop);
              shop = shopUrl.hostname;
              console.log("Cleaned shop parameter:", shop);
            }
            
            // تأكد من أن المتجر ينتهي بـ myshopify.com
            if (!shop.endsWith('myshopify.com')) {
              if (!shop.includes('.')) {
                shop = `${shop}.myshopify.com`;
                console.log("Added myshopify.com to shop:", shop);
              }
            }
          } catch (e) {
            console.error("Error cleaning shop URL:", e);
          }
        }

        // إذا لم يكن لدينا معلمة متجر، حاول استخراجها من مسار عنوان URL
        if (!shop && window.location.pathname.includes('/auth/')) {
          const pathParts = window.location.pathname.split('/');
          for (let i = 0; i < pathParts.length; i++) {
            if (pathParts[i] === 'auth' && i+1 < pathParts.length) {
              const possibleShop = pathParts[i+1];
              if (possibleShop && possibleShop.includes('.')) {
                shop = possibleShop;
                console.log("Extracted shop from path:", shop);
                break;
              }
            }
          }
        }

        // إذا ما زلنا لا نملك معلمة متجر، تحقق مما إذا كانت موجودة في localStorage
        if (!shop) {
          const tempShop = localStorage.getItem('shopify_temp_store');
          if (tempShop) {
            shop = tempShop;
            console.log("Retrieved shop from localStorage:", shop);
          }
        }

        // إذا كنا ما زلنا لا نملك معلمة متجر، قم بإعادة توجيه المستخدم إلى لوحة التحكم
        if (!shop) {
          console.error("Missing shop parameter in auth flow");
          setError("معلمة المتجر مفقودة في عملية المصادقة");
          setIsLoading(false);
          return;
        }

        // تخزين معلومات المتجر المؤقتة لاستخدامها إذا تم قطع تدفق المصادقة
        localStorage.setItem('shopify_temp_store', shop);
        
        // محاولة الوصول المباشر إلى نقطة نهاية المصادقة على الخادم
        if (!directServerAccess) {
          try {
            const authParams = new URLSearchParams();
            authParams.set("shop", shop);
            if (hmac) authParams.set("hmac", hmac);
            if (code) authParams.set("code", code);
            if (timestamp) authParams.set("timestamp", timestamp);
            if (state) authParams.set("state", state);
            if (host) authParams.set("host", host);
            
            // استخدم عنوان URL مطلقًا للوصول إلى نقطة نهاية المصادقة على الخادم
            const serverAuthUrl = `${window.location.origin}/auth?${authParams.toString()}`;
            console.log("Directly accessing server auth endpoint:", serverAuthUrl);

            // استخدم fetch لاختبار الوصول إلى نقطة نهاية المصادقة قبل إعادة التوجيه
            const response = await fetch(serverAuthUrl, {
              method: 'GET',
              redirect: 'manual', // لا تتبع إعادة التوجيه تلقائيًا
              headers: {
                'Accept': 'text/html'
              }
            });
            
            console.log("Server auth response:", {
              status: response.status,
              type: response.type,
              redirected: response.redirected,
              url: response.url,
              headers: Object.fromEntries(response.headers.entries()),
            });
            
            // إذا كانت الاستجابة هي إعادة توجيه، انتقل إلى عنوان URL المحدد
            if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
              const redirectUrl = response.headers.get('Location') || response.url;
              if (redirectUrl && redirectUrl !== serverAuthUrl) {
                console.log("Following server redirect to:", redirectUrl);
                window.location.href = redirectUrl;
                return;
              }
            }
            
            // إذا كانت الاستجابة ناجحة، انتقل مباشرة
            setDirectServerAccess(true);
            console.log("Server response successful, proceeding with redirect");
            window.location.href = serverAuthUrl;
            return;
          } catch (e) {
            console.error("Error testing server auth endpoint:", e);
            // استمر في تنفيذ المنطق العادي في حالة فشل الاختبار
          }
        }
        
        if (code && hmac) {
          // نحن في الخطوة الثانية من OAuth، قم بإعادة التوجيه مباشرة إلى نقطة نهاية المصادقة على الخادم
          console.log("OAuth callback detected, redirecting to server auth endpoint");
          const authParams = new URLSearchParams();
          authParams.set("shop", shop);
          if (hmac) authParams.set("hmac", hmac);
          if (code) authParams.set("code", code);
          if (timestamp) authParams.set("timestamp", timestamp);
          if (state) authParams.set("state", state);
          if (host) authParams.set("host", host);
          
          // استخدم عنوان URL مطلقًا لضمان المعالجة المناسبة
          const serverAuthUrl = `${window.location.origin}/auth?${authParams.toString()}`;
          console.log("Redirecting to server auth URL:", serverAuthUrl);
          
          // استخدم انتقال مباشر لضمان معالجة الاستجابة بشكل صحيح
          window.location.href = serverAuthUrl;
        } else {
          // نحن في الخطوة الأولى من OAuth، توجيه مباشر إلى نقطة نهاية المصادقة على الخادم
          console.log("Starting OAuth flow for shop:", shop);
          const authParams = new URLSearchParams();
          authParams.set("shop", shop);
          
          // إضافة معلمات عشوائية لمنع التخزين المؤقت
          authParams.set("_t", Date.now().toString());
          authParams.set("_r", Math.random().toString().substring(2));
          
          // استخدم عنوان URL مطلقًا لضمان المعالجة المناسبة
          const serverAuthUrl = `${window.location.origin}/auth?${authParams.toString()}`;
          console.log("Redirecting to server auth URL:", serverAuthUrl);
          
          // استخدم انتقال مباشر لضمان معالجة الاستجابة بشكل صحيح
          window.location.href = serverAuthUrl;
        }
      } catch (err) {
        console.error("Auth error:", err);
        setError("حدث خطأ أثناء المصادقة");
        setIsLoading(false);
      }
    };

    handleAuth();

    // إعادة محاولة المصادقة إذا لم تنجح بعد ثانيتين
    const retryTimer = setTimeout(() => {
      if (isLoading && retryCount < 3) {
        console.log(`Retrying authentication (attempt ${retryCount + 1})`);
        setRetryCount(prev => prev + 1);
        handleAuth();
      }
    }, 2000);

    return () => clearTimeout(retryTimer);
  }, [navigate, location, retryCount, directServerAccess]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4">خطأ في المصادقة</h1>
          <div className="mb-6 text-red-600">{error}</div>
          <div className="mb-4 p-4 bg-gray-100 rounded text-left text-xs max-h-40 overflow-auto">
            <p className="font-bold mb-2">معلومات التصحيح:</p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
          <button
            onClick={() => {
              // حاول مرة أخرى عن طريق إعادة تحميل الصفحة
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mr-2"
          >
            إعادة المحاولة
          </button>
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
    <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">معالجة المصادقة</h1>
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <p>الرجاء الانتظار بينما نقوم بمصادقة متجر Shopify الخاص بك...</p>
        
        {retryCount > 0 && (
          <p className="text-amber-600 mt-2">
            جاري إعادة المحاولة... ({retryCount}/3)
          </p>
        )}
        
        <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs max-h-40 overflow-auto">
          <p className="font-bold mb-2">معلومات التصحيح:</p>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default Auth;
