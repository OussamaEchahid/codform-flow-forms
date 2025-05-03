
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
            shopifyConnectionManager.addOrUpdateStore(savedShop, true);
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
        
        // تخزين معلومات المتجر في localStorage للاستخدام إذا تمت مقاطعة تدفق المصادقة
        try {
          localStorage.setItem('shopify_temp_store', cleanedShop);
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
                state
              },
            });
            
            if (callbackError) {
              throw new Error(`فشل التحقق من الرمز: ${callbackError.message}`);
            }
            
            setDebug(prev => ({ ...prev, callbackResult }));
            
            if (callbackResult?.success) {
              // حفظ بيانات المتجر في localStorage
              shopifyConnectionManager.addOrUpdateStore(cleanedShop, true);
              
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
                `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-callback?shop=${encodeURIComponent(cleanedShop)}&code=${code}&hmac=${hmac}${state ? `&state=${state}` : ''}`,
                { method: 'GET' }
              );
              
              if (!callbackResponse.ok) {
                const errorData = await callbackResponse.json();
                throw new Error(`فشل التحقق من الرمز: ${errorData.error || callbackResponse.statusText}`);
              }
              
              const callbackResult = await callbackResponse.json();
              
              if (callbackResult.success) {
                // حفظ بيانات المتجر في localStorage
                shopifyConnectionManager.addOrUpdateStore(cleanedShop, true);
                
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
                setError(`فشل استكمال عملية المصادقة: ${callbackResult.error || "سبب غير معروف"}`);
                setIsLoading(false);
              }
            } catch (fallbackError) {
              console.error("فشل الطريقة البديلة:", fallbackError);
              setError(e instanceof Error ? e.message : "حدث خطأ أثناء استكمال عملية المصادقة");
              setIsLoading(false);
            }
          }
        } else {
          // توجيه المستخدم مباشرة إلى مسار المصادقة على الخادم
          setStatus(`جاري توجيهك للمصادقة مع متجر ${cleanedShop}...`);
          
          try {
            // استخدام Supabase Edge Function للحصول على عنوان URL للمصادقة
            const { data, error } = await supabase.functions.invoke('shopify-auth', {
              body: { shop: cleanedShop },
            });
            
            if (error) {
              throw new Error(`فشل بدء عملية المصادقة: ${error.message}`);
            }
            
            setDebug(prev => ({ ...prev, authResponse: data }));
            
            if (data?.redirect) {
              console.log("إعادة توجيه إلى Shopify OAuth:", data.redirect);
              
              // إعادة توجيه مباشرة إلى عنوان URL للمصادقة
              window.location.href = data.redirect;
            } else {
              throw new Error("لم يتم استلام عنوان URL للمصادقة من الخادم");
            }
          } catch (e) {
            console.error("خطأ في الحصول على عنوان URL للمصادقة:", e);
            
            // إذا فشل، حاول مرة أخرى بنهج مباشر إذا لم نصل إلى الحد الأقصى لعدد المحاولات
            if (retryCount < 3) {
              setRetryCount(prev => prev + 1);
              
              try {
                // محاولة استخدام استدعاء مباشر
                const authResponse = await fetch(
                  `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?shop=${encodeURIComponent(cleanedShop)}&_t=${Date.now()}`, 
                  { method: 'GET' }
                );
                
                if (!authResponse.ok) {
                  throw new Error(`فشل استدعاء API: ${authResponse.statusText}`);
                }
                
                const authData = await authResponse.json();
                setDebug(prev => ({ ...prev, directAuthResponse: authData }));
                
                if (authData.redirect) {
                  console.log("إعادة توجيه باستخدام URL مباشر:", authData.redirect);
                  window.location.href = authData.redirect;
                } else {
                  throw new Error("لم يتم استلام عنوان URL للمصادقة");
                }
              } catch (directError) {
                console.error("فشل النهج المباشر:", directError);
                
                // استخدام عنوان URL المباشر للمصادقة بعد فشل استخدام Edge Function
                const directAuthUrl = `/auth?shop=${encodeURIComponent(cleanedShop)}&_t=${Date.now()}&_r=${Math.random().toString().substring(2)}`;
                console.log("محاولة استخدام عنوان URL للمصادقة المباشرة كخطة احتياطية:", directAuthUrl);
                
                // استخدام تأخير قليل قبل إعادة التوجيه
                setTimeout(() => {
                  window.location.href = directAuthUrl;
                }, 500);
              }
            } else {
              setError(e instanceof Error ? e.message : "حدث خطأ أثناء بدء عملية المصادقة");
              setIsLoading(false);
            }
          }
        }
      } catch (error) {
        console.error("خطأ غير متوقع أثناء إعادة التوجيه:", error);
        setError(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
        setIsLoading(false);
      }
    };

    redirectToAuthEndpoint();
  }, [location, navigate, retryCount]);
  
  // طريقة المصادقة البديلة المباشرة
  const handleDirectAuth = () => {
    const shop = localStorage.getItem('shopify_temp_store');
    if (shop) {
      // استخدام عنوان URL مباشر مع معلمات إضافية لتجنب مشكلات التخزين المؤقت
      const directAuthUrl = `/auth?shop=${encodeURIComponent(shop)}&_t=${Date.now()}&_r=${Math.random().toString().substring(2)}`;
      window.location.href = directAuthUrl;
    } else {
      toast.error("لا توجد معلومات متجر متاحة للاستخدام");
    }
  };

  // التعامل مع إعادة المحاولة بنهج مباشر
  const handleRetryDirectly = () => {
    // تجربة نقطة نهاية المصادقة Remix مباشرة
    const shop = localStorage.getItem('shopify_temp_store') || debug.originalShop;
    if (shop) {
      // استخدام عنوان URL مع طابع زمني لتجنب التخزين المؤقت
      window.location.href = `/auth?shop=${encodeURIComponent(cleanShopifyDomain(shop))}&_t=${Date.now()}`;
    } else {
      navigate('/shopify');
    }
  };
  
  // إعادة المحاولة باستخدام Edge Function
  const handleRetryEdgeFunction = async () => {
    const shop = localStorage.getItem('shopify_temp_store') || debug.originalShop;
    if (!shop) {
      toast.error("لا توجد معلومات متجر متاحة للاستخدام");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const cleanedShop = cleanShopifyDomain(shop);
      
      // استخدام Edge Function
      const { data, error } = await supabase.functions.invoke('shopify-auth', {
        body: { shop: cleanedShop },
      });
      
      if (error) {
        throw new Error(`فشل بدء عملية المصادقة: ${error.message}`);
      }
      
      if (data?.redirect) {
        window.location.href = data.redirect;
      } else {
        throw new Error("لم يتم استلام عنوان URL للمصادقة من الخادم");
      }
    } catch (e) {
      console.error("فشل إعادة المحاولة باستخدام Edge Function:", e);
      setError(e instanceof Error ? e.message : "حدث خطأ أثناء بدء عملية المصادقة");
      setIsLoading(false);
      
      // محاولة الطريقة البديلة
      handleDirectAuth();
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <div className="flex-1 flex items-center justify-center p-6">
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
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleRetryEdgeFunction}
                >
                  <Store className="h-4 w-4" />
                  إعادة محاولة الاتصال
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleDirectAuth}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  محاولة الاتصال مباشرة
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleRetryDirectly}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  محاولة الاتصال باستخدام مسار Node.js
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/shopify')}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  العودة إلى صفحة الاتصال بـ Shopify
                </Button>
              </div>
              
              {/* معلومات التصحيح */}
              <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-40 dir-ltr">
                <p className="font-bold mb-2 text-right">معلومات التصحيح:</p>
                <pre className="whitespace-pre-wrap">{JSON.stringify(debug, null, 2)}</pre>
              </div>
              <Button 
                onClick={() => navigate('/dashboard')} 
                variant="link"
                className="mt-4"
              >
                العودة إلى لوحة التحكم
              </Button>
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
            </>
          )}
        </div>
      </div>
      
      {/* لوحة معلومات التصحيح */}
      <div className="fixed bottom-0 left-0 m-4 p-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const debugPanel = document.getElementById('debug-panel');
            if (debugPanel) {
              debugPanel.classList.toggle('hidden');
            }
          }}
        >
          عرض/إخفاء التصحيح
        </Button>
        
        <div id="debug-panel" className="hidden mt-2 p-4 bg-white border rounded shadow-lg text-left text-xs overflow-auto max-h-80 max-w-lg dir-ltr">
          <p className="font-bold mb-2 text-right">معلومات التصحيح:</p>
          <pre className="whitespace-pre-wrap">{JSON.stringify(debug, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default ShopifyRedirect;
