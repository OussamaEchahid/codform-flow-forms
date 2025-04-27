
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

const ShopifyRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("جاري التوجيه...");
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>({});

  useEffect(() => {
    // الحصول على معلمات عنوان URL
    const params = new URLSearchParams(location.search);
    let shop = params.get("shop");
    const hmac = params.get("hmac");
    const code = params.get("code");
    const timestamp = params.get("timestamp");
    const state = params.get("state"); // إضافة معلمة state
    const host = params.get("host"); // إضافة معلمة host
    
    // تحديث معلومات التصحيح
    const debugInfo = { 
      shop, 
      hmac, 
      code, 
      timestamp,
      state,
      host,
      url: window.location.href,
      fullPath: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      referrer: document.referrer || "none",
      userAgent: navigator.userAgent,
      cookies: document.cookie,
    };
    
    setDebug(debugInfo);
    console.log("ShopifyRedirect parameters:", debugInfo);
    
    // التحقق من معلمة المتجر
    if (!shop) {
      // إذا لم يكن لدينا معلمة متجر، تحقق من المتجر المخزن مسبقًا
      const savedShop = localStorage.getItem('shopify_store');
      const savedConnected = localStorage.getItem('shopify_connected');
      // تحقق من المتجر المؤقت أثناء المصادقة
      const tempShop = localStorage.getItem('shopify_temp_store');
      
      console.log("Stored data:", { savedShop, savedConnected, tempShop });
      
      if (savedShop && savedConnected === 'true') {
        // إذا كان لدينا بيانات متجر مخزنة، قم بإعادة التوجيه مباشرة إلى لوحة التحكم
        console.log("Using stored shop data for redirect...");
        navigate(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(savedShop)}`);
        return;
      }
      
      if (tempShop) {
        // إذا كان لدينا بيانات متجر مؤقتة، حاول متابعة تدفق المصادقة
        console.log("Using temporary shop data to continue auth:", tempShop);
        // استخدام XMLHttpRequest للتحقق من حالة الاتصال قبل التوجيه
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/auth?shop=${encodeURIComponent(tempShop)}`, true);
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            console.log("Auth check response status:", xhr.status);
            window.location.href = `/auth?shop=${encodeURIComponent(tempShop)}`;
          }
        };
        xhr.onerror = function() {
          setStatus("خطأ: فشل الاتصال بالخادم");
          setError("تعذر الاتصال بخادم المصادقة. يرجى المحاولة مرة أخرى لاحقًا.");
        };
        xhr.send();
        return;
      }
      
      // إذا لم يكن لدينا معلمة متجر أو بيانات مخزنة، أظهر خطأً
      setStatus("خطأ: لم يتم توفير معلمة متجر Shopify");
      setError("يرجى التأكد من وجود معلمة 'shop' في عنوان URL أو اتباع الخطوات الصحيحة لتثبيت التطبيق");
      return;
    }
    
    // تنظيف نطاق المتجر إذا لزم الأمر
    let cleanedShop = shop;
    if (shop.startsWith('http')) {
      try {
        const shopUrl = new URL(shop);
        cleanedShop = shopUrl.hostname;
        console.log("Cleaned shop URL:", cleanedShop);
      } catch (e) {
        console.error("Error cleaning shop URL:", e);
      }
    }
    
    // تأكد من أنه ينتهي بـ myshopify.com
    if (!cleanedShop.endsWith('myshopify.com') && !cleanedShop.includes('.')) {
      cleanedShop = `${cleanedShop}.myshopify.com`;
      console.log("Added myshopify.com to shop:", cleanedShop);
    }
    
    // تحديث حالة إعادة التوجيه
    setStatus(`جاري توجيهك للمصادقة مع متجر ${cleanedShop}...`);
    
    // تخزين معلومات المتجر في localStorage للاستخدام إذا تم قطع تدفق المصادقة
    try {
      localStorage.setItem('shopify_temp_store', cleanedShop);
      console.log("Temp shop info saved:", cleanedShop);
    } catch (e) {
      console.error("Error saving temp data:", e);
    }
    
    // توجيه المستخدم مباشرة إلى مسار المصادقة الخاص بالخادم
    const authParams = new URLSearchParams();
    authParams.set("shop", cleanedShop);
    if (hmac) authParams.set("hmac", hmac); 
    if (code) authParams.set("code", code);
    if (timestamp) authParams.set("timestamp", timestamp);
    if (state) authParams.set("state", state);
    if (host) authParams.set("host", host);
    
    const authUrl = `/auth?${authParams.toString()}`;
    console.log("Redirecting to server auth route:", window.location.origin + authUrl);
    
    // استخدام XMLHttpRequest للتحقق من حالة الاتصال قبل التوجيه
    const xhr = new XMLHttpRequest();
    xhr.open('GET', authUrl, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        console.log("Auth response status:", xhr.status);
        console.log("Auth response headers:", xhr.getAllResponseHeaders());
        window.location.href = authUrl;
      }
    };
    xhr.onerror = function() {
      setStatus("خطأ: فشل الاتصال بالخادم");
      setError("تعذر الاتصال بخادم المصادقة. يرجى المحاولة مرة أخرى لاحقًا.");
    };
    xhr.send();
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
            {/* Debug information */}
            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-40">
              <p className="font-bold mb-2">معلومات التصحيح:</p>
              <pre>{JSON.stringify(debug, null, 2)}</pre>
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
            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-40">
              <p className="font-bold mb-2">معلومات التصحيح:</p>
              <pre>{JSON.stringify(debug, null, 2)}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopifyRedirect;
