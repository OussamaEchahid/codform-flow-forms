
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const ShopifyRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("جاري التوجيه...");
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    const redirectToAuthEndpoint = async () => {
      try {
        // الحصول على معلمات عنوان URL
        const params = new URLSearchParams(location.search);
        let shop = params.get("shop");
        const hmac = params.get("hmac");
        const code = params.get("code");
        const timestamp = params.get("timestamp");
        const state = params.get("state");
        const host = params.get("host");
        
        // تحديث معلومات التصحيح
        const originalShop = shop;
        const debugInfo = { 
          originalShop,
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
          referrer: document.referrer || "none",
          userAgent: navigator.userAgent,
          cookies: document.cookie,
          retryCount
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
            // استخدام بيانات المتجر المؤقتة
            shop = tempShop;
            console.log("Using temporary shop data to continue auth:", shop);
          } else {
            // إذا لم يكن لدينا معلمة متجر أو بيانات مخزنة، أظهر خطأً
            setStatus("خطأ: لم يتم توفير معلمة متجر Shopify");
            setError("يرجى التأكد من وجود معلمة 'shop' في عنوان URL أو اتباع الخطوات الصحيحة لتثبيت التطبيق");
            setIsLoading(false);
            return;
          }
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
        
        // تخزين معلومات المتجر في localStorage للاستخدام إذا تم قطع تدفق المصادقة
        try {
          localStorage.setItem('shopify_temp_store', cleanedShop);
          console.log("Temp shop info saved:", cleanedShop);
        } catch (e) {
          console.error("Error saving temp data:", e);
        }
        
        // إذا كان لدينا رمز ومعلمة hmac، فهذا يعني أننا في استدعاء إعادة التوجيه بعد المصادقة
        if (code && hmac) {
          setStatus(`جاري استكمال عملية المصادقة مع متجر ${cleanedShop}...`);
          
          // استدعاء Supabase Edge Function للتحقق من الرمز
          try {
            const callbackResponse = await fetch(
              `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-callback?shop=${encodeURIComponent(cleanedShop)}&code=${code}&hmac=${hmac}&state=${state || ""}`,
              { method: 'GET' }
            );
            
            if (!callbackResponse.ok) {
              const errorData = await callbackResponse.json();
              throw new Error(`فشل التحقق من الرمز: ${errorData.error || callbackResponse.statusText}`);
            }
            
            const callbackResult = await callbackResponse.json();
            
            if (callbackResult.success) {
              // حفظ بيانات المتجر في localStorage
              localStorage.setItem('shopify_store', cleanedShop);
              localStorage.setItem('shopify_connected', 'true');
              localStorage.removeItem('shopify_temp_store');
              
              toast.success(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
              
              // التحقق مما إذا كان هناك عنوان إعادة توجيه من الاستجابة
              if (callbackResult.redirect) {
                window.location.href = callbackResult.redirect;
              } else {
                navigate('/dashboard?shopify_success=true&shop=' + encodeURIComponent(cleanedShop));
              }
            } else {
              setError(`فشل استكمال عملية المصادقة: ${callbackResult.error || "سبب غير معروف"}`);
              setIsLoading(false);
            }
          } catch (e) {
            console.error("Error completing authentication:", e);
            setError(e instanceof Error ? e.message : "حدث خطأ أثناء استكمال عملية المصادقة");
            setIsLoading(false);
          }
        } else {
          // توجيه المستخدم مباشرة إلى مسار المصادقة الخاص بالخادم
          setStatus(`جاري توجيهك للمصادقة مع متجر ${cleanedShop}...`);
          
          // استخدام Edge Function مباشرة للحصول على عنوان URL للمصادقة
          try {
            const authResponse = await fetch(
              `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?shop=${encodeURIComponent(cleanedShop)}`, 
              { method: 'GET' }
            );
            
            if (!authResponse.ok) {
              const errorData = await authResponse.json();
              throw new Error(`فشل بدء عملية المصادقة: ${errorData.error || authResponse.statusText}`);
            }
            
            const authData = await authResponse.json();
            setDebug(prev => ({ ...prev, authResponse: authData }));
            
            if (authData.redirect) {
              console.log("Redirecting to Shopify OAuth:", authData.redirect);
              
              // توجيه مباشر إلى عنوان URL للمصادقة
              window.location.href = authData.redirect;
            } else {
              throw new Error("لم يتم استلام عنوان URL للمصادقة من الخادم");
            }
          } catch (e) {
            console.error("Error getting auth URL:", e);
            
            // في حالة الفشل، حاول مرة أخرى باستخدام النهج المباشر إذا لم نصل إلى الحد الأقصى للمحاولات
            if (retryCount < 3) {
              setRetryCount(prev => prev + 1);
              
              // استخدام URL مباشر للمصادقة بعد الفشل في استخدام Edge Function
              const directAuthUrl = `/auth?shop=${encodeURIComponent(cleanedShop)}`;
              console.log("Trying direct auth URL as fallback:", directAuthUrl);
              
              // استخدام تأخير بسيط قبل إعادة توجيه
              setTimeout(() => {
                window.location.href = directAuthUrl;
              }, 500);
            } else {
              setError(e instanceof Error ? e.message : "حدث خطأ أثناء بدء عملية المصادقة");
              setIsLoading(false);
            }
          }
        }
      } catch (error) {
        console.error("Unexpected error during redirection:", error);
        setError(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
        setIsLoading(false);
      }
    };

    redirectToAuthEndpoint();
  }, [location, navigate, retryCount]);
  
  // إضافة طريقة بديلة للتوجيه المباشر
  const handleDirectAuth = () => {
    const shop = localStorage.getItem('shopify_temp_store');
    if (shop) {
      // باستخدام عنوان URL المباشر مع معلمات إضافية لتجنب مشكلات ذاكرة التخزين المؤقت
      const directAuthUrl = `/auth?shop=${encodeURIComponent(shop)}&_t=${Date.now()}&_r=${Math.random().toString().substring(2)}`;
      window.location.href = directAuthUrl;
    } else {
      toast.error("لا توجد معلومات متجر متاحة للاستخدام");
    }
  };

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
            
            {/* خيارات الاسترداد */}
            <div className="mb-6 space-y-3">
              <Button 
                className="w-full"
                onClick={handleDirectAuth}
              >
                محاولة الاتصال مباشرة
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/shopify')}
                className="w-full"
              >
                العودة إلى صفحة الاتصال بـ Shopify
              </Button>
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
            {isLoading && retryCount > 0 && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                <p className="text-yellow-800">
                  محاولة رقم {retryCount}/3: جاري تجربة طريقة اتصال بديلة...
                </p>
              </div>
            )}
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
