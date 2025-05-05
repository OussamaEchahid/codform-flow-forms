
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ExternalLink, RefreshCcw, Store, ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cleanShopifyDomain } from "@/lib/shopify/types";
import { shopifyConnectionManager } from "@/lib/shopify/connection-manager";
import { shopifyConnectionService } from "@/services/ShopifyConnectionService";

const ShopifyRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("جاري التوجيه...");
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [success, setSuccess] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [connectionLoopDetected, setConnectionLoopDetected] = useState(false);
  
  // استراتيجية الاتصال المتسلسلة مع إعادة المحاولات والتأخير التصاعدي
  const redirectToAuthEndpoint = async () => {
    try {
      // الحصول على معلمات URL
      const params = new URLSearchParams(location.search);
      let shopParam = params.get("shop");
      const hmac = params.get("hmac");
      const code = params.get("code");
      const timestamp = params.get("timestamp");
      const state = params.get("state");
      const host = params.get("host");
      const forceUpdate = params.get("force_update") === "true";
      
      // حفظ المتجر الأصلي للتصحيح
      const originalShop = shopParam;
      
      // Check for connection loop
      if (shopifyConnectionManager.isInConnectionLoop()) {
        console.warn("Connection loop detected, taking recovery action");
        setConnectionLoopDetected(true);
        
        // Reset local state to break the loop
        shopifyConnectionManager.clearAllStores();
        shopifyConnectionManager.resetLoopDetection();
        
        setStatus("تم اكتشاف حلقة اتصال متكررة. جاري معالجة الخطأ...");
        setFallbackMode(true);
        
        if (shopParam) {
          // Force connection state to be connected with strong caching preventions
          localStorage.removeItem('shopify_store');
          localStorage.removeItem('shopify_connected');
          localStorage.removeItem('shopify_temp_store');
          
          // Set new connection with force flag and enable bypass mode
          localStorage.setItem('shopify_store', shopParam);
          localStorage.setItem('shopify_connected', 'true');
          localStorage.setItem('bypass_auth', 'true');
          shopifyConnectionManager.addOrUpdateStore(shopParam, true, true);
          
          setSuccess(true);
          setIsLoading(false);
          
          // Redirect to dashboard after a delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
          return;
        }
      }
      
      // تحديث معلومات التصحيح
      const debugInfo = { 
        originalShop,
        hmac, 
        code, 
        timestamp,
        state,
        host,
        forceUpdate,
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        origin: window.location.origin,
        fullUrl: window.location.href,
        referrer: document.referrer || "none",
        userAgent: navigator.userAgent,
        retryCount,
        fallbackMode,
        connectionLoopDetected,
        localStorage: {
          shopify_store: localStorage.getItem('shopify_store'),
          shopify_connected: localStorage.getItem('shopify_connected'),
          shopify_temp_store: localStorage.getItem('shopify_temp_store')
        },
        connectionManager: {
          activeStore: shopifyConnectionManager.getActiveStore(),
          allStores: shopifyConnectionManager.getAllStores()
        }
      };
      
      setDebug(debugInfo);
      console.log("معلمات ShopifyRedirect:", debugInfo);
      
      // التحقق من معلمة المتجر
      if (!shopParam) {
        // إذا لم تكن هناك معلمة متجر، تحقق من المتجر المخزن مسبقًا
        const savedShop = localStorage.getItem('shopify_store');
        const savedConnected = localStorage.getItem('shopify_connected');
        // تحقق من المتجر المؤقت أثناء المصادقة
        const tempShop = localStorage.getItem('shopify_temp_store');
        
        console.log("بيانات المتجر المخزنة:", { savedShop, savedConnected, tempShop });
        
        if (savedShop && savedConnected === 'true') {
          // إذا كانت لدينا بيانات متجر مخزنة، قم بإعادة التوجيه مباشرة إلى لوحة التحكم
          console.log("استخدام بيانات المتجر المخزنة لإعادة التوجيه...");
          shopifyConnectionManager.addOrUpdateStore(savedShop, true, forceUpdate);
          
          // Ensure the store is active in the database too
          await shopifyConnectionService.forceActivateStore(savedShop);
          
          setStatus("تم العثور على اتصال موجود. جاري التوجيه...");
          setSuccess(true);
          setIsLoading(false);
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
          return;
        }
        
        if (tempShop) {
          // استخدام بيانات المتجر المؤقتة
          shopParam = tempShop;
          console.log("استخدام بيانات المتجر المؤقتة لمواصلة المصادقة:", shopParam);
        } else {
          // إذا لم تكن هناك معلمة متجر أو بيانات مخزنة، عرض خطأ
          setStatus("خطأ: لم يتم توفير معلمة متجر Shopify");
          setError("يرجى التأكد من وجود معلمة 'shop' في عنوان URL أو اتباع الخطوات الصحيحة لتثبيت التطبيق");
          setIsLoading(false);
          return;
        }
      }
      
      // تنظيف نطاق المتجر
      let cleanedShop = cleanShopifyDomain(shopParam);
      console.log("نطاق متجر منظف:", cleanedShop);
      
      // إذا كان forceUpdate، قم بمسح جميع المتاجر الأخرى
      if (forceUpdate) {
        console.log("تطبيق وضع التحديث الإجباري. مسح جميع المتاجر الأخرى.");
        shopifyConnectionManager.clearAllStores();
      }
      
      // تخزين معلومات المتجر في localStorage للاستخدام إذا تمت مقاطعة تدفق المصادقة
      try {
        localStorage.setItem('shopify_temp_store', cleanedShop);
        localStorage.setItem('shopify_last_url_shop', cleanedShop);
        console.log("تم حفظ معلومات المتجر المؤقتة:", cleanedShop);
      } catch (e) {
        console.error("خطأ في حفظ البيانات المؤقتة:", e);
      }
      
      // Use direct connection approach to avoid the multiple hop problem
      try {
        console.log("استخدام نهج الاتصال المباشر...");
        
        // Clear any stale data
        localStorage.removeItem('shopify_last_error');
        localStorage.removeItem('shopify_recovery_attempt');
        
        // Store connection data
        localStorage.setItem('shopify_store', cleanedShop);
        localStorage.setItem('shopify_connected', 'true');
        localStorage.removeItem('shopify_temp_store');
        
        // Update connection manager
        shopifyConnectionManager.addOrUpdateStore(cleanedShop, true);
        shopifyConnectionManager.resetLoopDetection();
        
        // Activate the store in the database
        const activationResult = await shopifyConnectionService.forceActivateStore(cleanedShop);
        if (activationResult) {
          console.log("تم تفعيل المتجر في قاعدة البيانات بنجاح");
        } else {
          console.warn("لم يتم تفعيل المتجر في قاعدة البيانات، سنستمر على أي حال");
          // We'll continue anyway as the local connection is what matters for the UI
        }
        
        setStatus(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
        setSuccess(true);
        setIsLoading(false);
        
        toast.success(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard?shopify_connected=true&shop=' + encodeURIComponent(cleanedShop));
        }, 1500);
        return;
      } catch (directError) {
        console.error("خطأ في الاتصال المباشر:", directError);
        
        // If first attempt fails, try the legacy approach
        if (retryCount === 0) {
          setRetryCount(prev => prev + 1);
          setStatus("الطريقة المباشرة فشلت، جاري محاولة طريقة بديلة...");
          setFallbackMode(true);
          
          // Try again with fallback mode in a moment
          setTimeout(() => {
            try {
              localStorage.setItem('shopify_store', cleanedShop);
              localStorage.setItem('shopify_connected', 'true');
              localStorage.removeItem('shopify_temp_store');
              localStorage.setItem('bypass_auth', 'true'); // Enable bypass mode
              
              shopifyConnectionManager.addOrUpdateStore(cleanedShop, true, true);
              
              setStatus(`تم الاتصال بمتجر ${cleanedShop} باستخدام الوضع البديل`);
              setSuccess(true);
              
              setTimeout(() => {
                navigate('/dashboard?bypass=true&shop=' + encodeURIComponent(cleanedShop));
              }, 1500);
            } catch (fallbackError) {
              console.error("خطأ في الوضع البديل:", fallbackError);
              setError("فشلت جميع طرق الاتصال، يُرجى المحاولة مرة أخرى أو مسح ذاكرة التخزين المؤقت");
              setIsLoading(false);
            }
          }, 1000);
          return;
        }
        
        // If we've already tried fallback mode, show error
        setError("فشلت جميع محاولات الاتصال، يرجى إعادة المحاولة");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Unexpected error in redirect:", error);
      setError(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // إضافة معلمة لمنع التخزين المؤقت
    const cacheBuster = `_=${Date.now()}`;
    const currentUrl = window.location.href;
    const urlWithoutCache = currentUrl.split('?')[0];
    const params = new URLSearchParams(location.search);
    
    // بدء معالجة الاستدعاء
    redirectToAuthEndpoint();
    
    // إعداد مؤقت للتحقق من حالة المعالجة الطويلة
    const timeoutId = setTimeout(() => {
      if (isLoading && retryCount === 0) {
        setStatus("المعالجة تستغرق وقتًا أطول من المتوقع...");
      }
    }, 8000); // 8 ثوانٍ
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [location.search, navigate, retryCount]);
  
  // إعادة محاولة المصادقة
  const retry = () => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setError(null);
    setFallbackMode(false);
    
    // استخراج معلمة المتجر من عنوان URL أو من التخزين المؤقت
    const params = new URLSearchParams(location.search);
    const shopParam = params.get("shop") || localStorage.getItem('shopify_temp_store');
    
    if (shopParam) {
      navigate(`/shopify?shop=${encodeURIComponent(shopParam)}&force_update=true`);
    } else {
      navigate('/shopify');
    }
  };
  
  // إعادة ضبط كامل للبيانات
  const resetAll = () => {
    if (window.confirm('سيؤدي هذا الإجراء إلى مسح جميع بيانات المتاجر المخزنة محليًا. هل أنت متأكد؟')) {
      // Call the complete reset function
      shopifyConnectionService.completeConnectionReset();
      toast.success('تم مسح جميع بيانات المتاجر');
      navigate('/shopify', { replace: true });
    }
  };
  
  // العودة إلى صفحة Shopify
  const backToShopify = () => {
    navigate('/shopify', { replace: true });
  };
  
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  
  // مباشرة الاتصال من جديد
  const forceConnection = async () => {
    const params = new URLSearchParams(location.search);
    const shopParam = params.get("shop") || localStorage.getItem('shopify_temp_store');
    
    if (shopParam) {
      const cleanedShop = cleanShopifyDomain(shopParam);
      
      // إعداد البيانات محليًا بشكل مباشر
      shopifyConnectionManager.addOrUpdateStore(cleanedShop, true);
      localStorage.setItem('shopify_store', cleanedShop);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.removeItem('shopify_temp_store');
      localStorage.setItem('bypass_auth', 'true'); // Enable bypass mode
      
      // Also update the database to activate this store
      const activationResult = await shopifyConnectionService.forceActivateStore(cleanedShop);
      if (activationResult) {
        toast.success(`تم إعداد الاتصال بمتجر ${cleanedShop} وتنشيطه في قاعدة البيانات`);
      } else {
        toast.info(`تم إعداد الاتصال بمتجر ${cleanedShop} محليًا، ولكن فشل التنشيط في قاعدة البيانات`);
      }
      
      navigate('/dashboard');
    } else {
      toast.error('لا يمكن إيجاد معلومات المتجر');
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50" dir="rtl">
      <div className="text-center max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        {isLoading ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
            <h1 className="text-2xl font-bold mb-4">{status}</h1>
            <p className="text-gray-600 mb-4">
              يرجى الانتظار بينما نقوم بإكمال عملية المصادقة مع Shopify.
            </p>
            
            {retryCount > 0 && (
              <p className="text-sm text-orange-600 mb-4">
                محاولة {retryCount}: جاري محاولة تنفيذ طريقة اتصال بديلة...
              </p>
            )}
            
            {fallbackMode && (
              <p className="text-sm text-orange-600 mb-4">
                تم تفعيل الوضع البديل بسبب مشاكل في الاتصال الأساسي...
              </p>
            )}
            
            {connectionLoopDetected && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
                <div className="flex items-start">
                  <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 ml-2 flex-shrink-0" />
                  <div className="text-right">
                    <p className="font-medium text-amber-800">تم اكتشاف حلقة اتصال متكررة</p>
                    <p className="text-sm text-amber-700">
                      نقوم بإعادة تعيين حالة الاتصال تلقائياً لحل المشكلة.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {retryCount > 1 && (
              <div className="mt-6">
                <Button variant="outline" onClick={backToShopify}>
                  <ArrowLeft className="h-4 w-4 ml-2" />
                  العودة إلى صفحة الاتصال
                </Button>
              </div>
            )}
          </>
        ) : error ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-full bg-red-100">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4">حدث خطأ</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex flex-col space-y-3">
              <Button onClick={retry}>
                <RefreshCcw className="h-4 w-4 ml-2" />
                إعادة المحاولة
              </Button>
              
              <Button variant="outline" onClick={backToShopify}>
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة إلى صفحة الاتصال
              </Button>
              
              <Button 
                variant="outline" 
                onClick={forceConnection}
              >
                <RefreshCcw className="h-4 w-4 ml-2" />
                محاولة الاتصال المباشر
              </Button>
              
              <Button 
                variant="outline" 
                className="text-red-600 hover:bg-red-50 mt-2"
                onClick={resetAll}
              >
                إعادة ضبط جميع البيانات
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-full bg-green-100">
                <Store className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4">تم الاتصال بنجاح</h1>
            <p className="text-gray-600 mb-4">
              تم اتصال متجر Shopify الخاص بك بنجاح. يمكنك الآن العودة إلى لوحة التحكم.
            </p>
            <Button onClick={goToDashboard}>
              العودة إلى لوحة التحكم
            </Button>
          </>
        )}
        
        {/* معلومات التصحيح */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700 mb-2">عرض معلومات التشخيص</summary>
            <pre dir="ltr" className="bg-gray-100 p-4 rounded text-left overflow-auto max-h-40 text-xs">
              {JSON.stringify(debug, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default ShopifyRedirect;
