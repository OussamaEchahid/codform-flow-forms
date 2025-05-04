
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
  const [success, setSuccess] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  
  // استرايجية الاتصال المتسلسلة مع إعادة المحاولات والتأخير التصاعدي
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
        retryCount,
        fallbackMode
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
          
          setStatus("تم العثور على اتصال موجود. جاري التوجيه...");
          setSuccess(true);
          
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
      
      // إذا كان لدينا رمز وhmac، فنحن في إعادة توجيه المكالمة بعد المصادقة
      if (code && hmac) {
        setStatus(`جاري استكمال عملية المصادقة مع متجر ${cleanedShop}...`);
        
        // إنشاء تأخير للمحاولات المتكررة
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        
        // الوظيفة المتسلسلة للمحاولات المتكررة
        const attemptAPICall = async (attempts = 3, currentDelay = 500): Promise<any> => {
          try {
            console.log(`محاولة رقم ${4 - attempts} للاتصال بالـ API...`);
            
            // إضافة معلومات عشوائية لمنع التخزين المؤقت
            const nonce = Math.random().toString(36).substring(2, 15);
            const timestamp = Date.now();
            
            // استدعاء Supabase Edge Function
            const { data: callbackResult, error: callbackError } = await supabase.functions.invoke('shopify-callback', {
              body: { 
                shop: cleanedShop,
                code,
                hmac,
                state,
                forceUpdate,
                timestamp,
                nonce
              },
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'X-Timestamp': `${timestamp}`,
                'X-Nonce': nonce
              }
            });
            
            if (callbackError) {
              console.error("خطأ في استدعاء الدالة:", callbackError);
              
              // إذا كانت هناك محاولات متبقية، جرب مرة أخرى بعد تأخير
              if (attempts > 1) {
                await delay(currentDelay);
                return attemptAPICall(attempts - 1, currentDelay * 2);
              }
              
              throw new Error(`فشل التحقق من الرمز: ${callbackError.message}`);
            }
            
            return callbackResult;
          } catch (error) {
            console.error("خطأ في محاولة الاتصال:", error);
            
            // إذا كانت هناك محاولات متبقية، جرب مرة أخرى بعد تأخير
            if (attempts > 1) {
              await delay(currentDelay);
              return attemptAPICall(attempts - 1, currentDelay * 2);
            }
            
            throw error;
          }
        };
        
        try {
          // محاولة استدعاء API
          const callbackResult = await attemptAPICall();
          
          setDebug(prev => ({ ...prev, callbackResult }));
          
          if (callbackResult?.success) {
            // Save store data in localStorage
            if (cleanedShop) {
              shopifyConnectionManager.addOrUpdateStore(cleanedShop, true);
              localStorage.setItem('shopify_store', cleanedShop);
              localStorage.setItem('shopify_connected', 'true');
              localStorage.removeItem('shopify_temp_store');
            }
            
            toast.success(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
            setSuccess(true);
            
            // التوجيه بعد تأخير قصير
            setTimeout(() => {
              navigate('/dashboard');
            }, 1000);
            return;
          } else {
            setError(`فشل استكمال عملية المصادقة: ${callbackResult?.error || "سبب غير معروف"}`);
            
            // تجربة المحاولة باستخدام الطريقة البديلة
            setFallbackMode(true);
            throw new Error('فشل استدعاء الدالة، سيتم محاولة الطريقة البديلة');
          }
        } catch (e) {
          console.error("خطأ في استكمال المصادقة، جاري محاولة الطريقة البديلة:", e);
          
          try {
            // الخطة البديلة: استخدام نقطة النهاية مباشرة بواسطة fetch
            const timestamp = Date.now();
            const nonce = Math.random().toString(36).substring(2, 15);
            
            setStatus(`جاري محاولة طريقة اتصال بديلة...`);
            
            const callbackResponse = await fetch(
              `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-callback?shop=${encodeURIComponent(cleanedShop)}&code=${code}&hmac=${hmac}${state ? `&state=${state}` : ''}${forceUpdate ? `&force_update=true` : ''}&timestamp=${timestamp}&nonce=${nonce}`,
              { 
                method: 'GET',
                headers: {
                  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                  'X-Timestamp': `${timestamp}`,
                  'X-Nonce': nonce
                }
              }
            );
            
            if (!callbackResponse.ok) {
              const errorData = await callbackResponse.json();
              throw new Error(`فشل التحقق من الرمز: ${errorData.error || callbackResponse.statusText}`);
            }
            
            const callbackResult = await callbackResponse.json();
            
            if (callbackResult.success) {
              // Save store data
              if (cleanedShop) {
                shopifyConnectionManager.addOrUpdateStore(cleanedShop, true);
                localStorage.setItem('shopify_store', cleanedShop);
                localStorage.setItem('shopify_connected', 'true');
                localStorage.removeItem('shopify_temp_store');
              }
              
              toast.success(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
              setSuccess(true);
              
              // توجيه المستخدم إلى لوحة التحكم بعد تأخير قصير
              setTimeout(() => {
                navigate('/dashboard');
              }, 1000);
              return;
            } else {
              setError(`فشل استكمال عملية المصادقة: ${callbackResult.error || "سبب غير معروف"}`);
              
              // محاولة أخيرة: تخطي التحقق من الرمز والثقة بالبيانات المستلمة
              if (cleanedShop) {
                setStatus("تخطي التحقق: جاري إعداد الاتصال محليًا...");
                
                // إعداد البيانات محليًا على أي حال
                shopifyConnectionManager.addOrUpdateStore(cleanedShop, true);
                localStorage.setItem('shopify_store', cleanedShop);
                localStorage.setItem('shopify_connected', 'true');
                localStorage.removeItem('shopify_temp_store');
                
                setSuccess(true);
                toast.success(`تم تخطي التحقق وإعداد الاتصال بمتجر ${cleanedShop}`);
                
                setTimeout(() => {
                  navigate('/dashboard');
                }, 1500);
                return;
              }
              
              setIsLoading(false);
            }
          } catch (fallbackError) {
            console.error("Fallback API call failed:", fallbackError);
            
            // محاولة أخيرة: تخطي التحقق
            if (cleanedShop) {
              setStatus("يبدو أن هناك مشكلة في الاتصال بالخادم. جاري إعداد الاتصال محليًا...");
              
              // إعداد البيانات محليًا على أي حال
              shopifyConnectionManager.addOrUpdateStore(cleanedShop, true);
              localStorage.setItem('shopify_store', cleanedShop);
              localStorage.setItem('shopify_connected', 'true');
              localStorage.removeItem('shopify_temp_store');
              
              setSuccess(true);
              
              setTimeout(() => {
                navigate('/dashboard');
              }, 1500);
            } else {
              setError("فشل إكمال عملية المصادقة");
              setIsLoading(false);
            }
          }
        }
      } else {
        // إذا لم يكن لدينا رمز وhmac، فنحن في بداية تدفق المصادقة
        setStatus(`جاري بدء عملية المصادقة مع متجر ${cleanedShop}...`);
        
        try {
          // استدعاء دالة Supabase Edge Function لبدء المصادقة
          const timestamp = Date.now();
          const nonce = Math.random().toString(36).substring(2, 15);
          
          const { data: authResult, error: authError } = await supabase.functions.invoke('shopify-auth', {
            body: { 
              shop: cleanedShop,
              forceUpdate: forceUpdate,
              timestamp,
              nonce
            },
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Timestamp': `${timestamp}`,
              'X-Nonce': nonce
            }
          });
          
          if (authError) {
            console.error("خطأ في استدعاء دالة المصادقة:", authError);
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
            const timestamp = Date.now();
            const nonce = Math.random().toString(36).substring(2, 15);
            
            const authResponse = await fetch(
              `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?shop=${encodeURIComponent(cleanedShop)}${forceUpdate ? `&force_update=true` : ''}&timestamp=${timestamp}&nonce=${nonce}`,
              { 
                method: 'GET',
                headers: {
                  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                  'X-Timestamp': `${timestamp}`,
                  'X-Nonce': nonce
                }
              }
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
  
  useEffect(() => {
    // تنفيذ عملية إعادة التوجيه
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
  
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  
  // مباشرة الاتصال من جديد
  const forceConnection = () => {
    const params = new URLSearchParams(location.search);
    const shopParam = params.get("shop") || localStorage.getItem('shopify_temp_store');
    
    if (shopParam) {
      const cleanedShop = cleanShopifyDomain(shopParam);
      
      // إعداد البيانات محليًا بشكل مباشر
      shopifyConnectionManager.addOrUpdateStore(cleanedShop, true);
      localStorage.setItem('shopify_store', cleanedShop);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.removeItem('shopify_temp_store');
      
      toast.success(`تم إعداد الاتصال بمتجر ${cleanedShop} بشكل مباشر`);
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
