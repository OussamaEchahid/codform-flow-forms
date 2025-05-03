
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ExternalLink, RefreshCcw, Store, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cleanShopifyDomain } from "@/lib/shopify/types";
import { shopifyConnectionManager } from "@/lib/shopify/connection-manager";

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
          cookies: document.cookie,
          localStorage: {
            shopify_store: localStorage.getItem('shopify_store'),
            shopify_connected: localStorage.getItem('shopify_connected'),
            shopify_temp_store: localStorage.getItem('shopify_temp_store'),
            shopify_emergency_mode: localStorage.getItem('shopify_emergency_mode'),
            shopify_active_store: localStorage.getItem('shopify_active_store'),
            shopify_last_url_shop: localStorage.getItem('shopify_last_url_shop'),
            shopify_connected_stores: localStorage.getItem('shopify_connected_stores')
          },
          retryCount
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
            navigate(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(savedShop)}`);
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
          shopifyConnectionManager.clearAllStoresExcept(cleanedShop);
        }
        
        // تخزين معلومات المتجر في localStorage للاستخدام إذا تمت مقاطعة تدفق المصادقة
        try {
          localStorage.setItem('shopify_temp_store', cleanedShop);
          localStorage.setItem('shopify_last_url_shop', cleanedShop);
          console.log("تم حفظ معلومات المتجر المؤقتة:", cleanedShop);
        } catch (e) {
          console.error("خطأ في حفظ البيانات المؤقتة:", e);
        }
        
        // إذا كان لدينا رمز وhmac، فنحن في إعادة توجيه المكالمة بعد المصادقة
        if (code && hmac) {
          setStatus(`جاري استكمال عملية المصادقة مع متجر ${cleanedShop}...`);
          
          try {
            // استدعاء Supabase Edge Function لإكمال المصادقة
            const { data: callbackResult, error: callbackError } = await supabase.functions.invoke('shopify-callback', {
              body: { 
                shop: cleanedShop,
                code,
                hmac,
                state,
                forceUpdate
              },
            });
            
            if (callbackError) {
              throw new Error(`فشل التحقق من الرمز: ${callbackError.message}`);
            }
            
            setDebug(prev => ({ ...prev, callbackResult }));
            
            if (callbackResult?.success) {
              // حفظ بيانات المتجر في localStorage
              shopifyConnectionManager.clearAllStoresExcept(cleanedShop);
              
              // إزالة البيانات المؤقتة
              localStorage.removeItem('shopify_temp_store');
              
              toast.success(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
              
              // التحقق مما إذا كان هناك عنوان URL لإعادة التوجيه من الاستجابة
              if (callbackResult.redirect) {
                window.location.href = callbackResult.redirect;
              } else {
                navigate('/dashboard?shopify_success=true&shop=' + encodeURIComponent(cleanedShop));
              }
            } else {
              setError(`فشل استكمال عملية المصادقة: ${callbackResult?.error || "سبب غير معروف"}`);
              setIsLoading(false);
            }
          } catch (e) {
            console.error("خطأ في استكمال المصادقة:", e);
            
            try {
              // الخطة البديلة: استخدام نقطة النهاية مباشرة
              const callbackResponse = await fetch(
                `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-callback?shop=${encodeURIComponent(cleanedShop)}&code=${code}&hmac=${hmac}${state ? `&state=${state}` : ''}${forceUpdate ? `&force_update=true` : ''}`,
                { method: 'GET' }
              );
              
              if (!callbackResponse.ok) {
                const errorData = await callbackResponse.json();
                throw new Error(`فشل التحقق من الرمز: ${errorData.error || callbackResponse.statusText}`);
              }
              
              const callbackResult = await callbackResponse.json();
              
              if (callbackResult.success) {
                // حفظ بيانات المتجر في localStorage
                shopifyConnectionManager.clearAllStoresExcept(cleanedShop);
                
                // إزالة البيانات المؤقتة
                localStorage.removeItem('shopify_temp_store');
                
                toast.success(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
                
                // توجيه المستخدم إلى لوحة التحكم
                navigate('/dashboard?shopify_success=true&shop=' + encodeURIComponent(cleanedShop));
              } else {
                setError(`فشل استكمال عملية المصادقة: ${callbackResult.error || "سبب غير معروف"}`);
                setIsLoading(false);
              }
            } catch (fallbackError) {
              console.error("Fallback API call failed:", fallbackError);
              setError("فشل إكمال عملية المصادقة");
              setIsLoading(false);
            }
          }
        } else {
          // إذا لم يكن لدينا رمز وhmac، فنحن في بداية تدفق المصادقة
          setStatus(`جاري بدء عملية المصادقة مع متجر ${cleanedShop}...`);
          
          try {
            // استدعاء دالة Supabase Edge Function لبدء المصادقة
            const { data: authResult, error: authError } = await supabase.functions.invoke('shopify-auth', {
              body: { 
                shop: cleanedShop,
                forceUpdate: forceUpdate
              },
            });
            
            if (authError) {
              throw new Error(`فشل بدء المصادقة: ${authError.message}`);
            }
            
            setDebug(prev => ({ ...prev, authResult }));
            
            if (authResult?.redirect) {
              // توجيه المستخدم إلى صفحة المصادقة Shopify
              window.location.href = authResult.redirect;
            } else {
              setError("لم يتم استلام عنوان URL للمصادقة من الخادم");
              setIsLoading(false);
            }
          } catch (e) {
            console.error("خطأ في بدء المصادقة:", e);
            
            try {
              // الخطة البديلة: استخدام نقطة النهاية مباشرة
              const authResponse = await fetch(
                `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?shop=${encodeURIComponent(cleanedShop)}${forceUpdate ? `&force_update=true` : ''}`,
                { method: 'GET' }
              );
              
              if (!authResponse.ok) {
                const errorData = await authResponse.json();
                throw new Error(`فشل بدء المصادقة: ${errorData.error || authResponse.statusText}`);
              }
              
              const authData = await authResponse.json();
              
              if (authData.redirect) {
                // توجيه المستخدم إلى صفحة المصادقة Shopify
                window.location.href = authData.redirect;
              } else {
                setError("لم يتم استلام عنوان URL للمصادقة");
                setIsLoading(false);
              }
            } catch (directError) {
              console.error("Direct API call failed:", directError);
              setError("فشل بدء عملية المصادقة");
              setIsLoading(false);
            }
          }
        }
      } catch (error) {
        console.error("Unexpected error in redirect:", error);
        setError(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
        setIsLoading(false);
      }
    };
    
    // زيادة عداد المحاولات وإعادة محاولة توجيه المصادقة
    const handleRetry = () => {
      setRetryCount(count => count + 1);
      setIsLoading(true);
      setError(null);
      redirectToAuthEndpoint();
    };
    
    redirectToAuthEndpoint();
    
    // إعداد مؤقت للتحقق من حالة المعالجة الطويلة
    const timeoutId = setTimeout(() => {
      if (isLoading && retryCount === 0) {
        setStatus("المعالجة تستغرق وقتًا أطول من المتوقع...");
      }
    }, 10000); // 10 ثوانٍ
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [location.search, navigate, retryCount]);
  
  // إعادة محاولة المصادقة
  const retry = () => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setError(null);
    
    // استخراج معلمة المتجر من عنوان URL أو من التخزين المؤقت
    const params = new URLSearchParams(location.search);
    const shopParam = params.get("shop") || localStorage.getItem('shopify_temp_store');
    
    if (shopParam) {
      navigate(`/shopify?shop=${encodeURIComponent(shopParam)}&force_update=true`);
    } else {
      navigate('/shopify');
    }
  };
  
  // إعادة ضبط جميع البيانات
  const resetAll = () => {
    if (window.confirm('سيؤدي هذا الإجراء إلى مسح جميع بيانات المتاجر المخزنة محليًا. هل أنت متأكد؟')) {
      shopifyConnectionManager.clearAllStores();
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_last_url_shop');
      toast.success('تم مسح جميع بيانات المتاجر');
      navigate('/shopify', { replace: true });
    }
  };
  
  // العودة إلى صفحة Shopify
  const backToShopify = () => {
    navigate('/shopify', { replace: true });
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
                إعادة المحاولة
              </Button>
              
              <Button variant="outline" onClick={backToShopify}>
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة إلى صفحة الاتصال
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
            <Button onClick={() => navigate('/dashboard')}>
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
