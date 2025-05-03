
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, RefreshCcw, Store, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cleanShopifyDomain } from '@/lib/shopify/types';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';

export default function ShopifyCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("جاري إكمال المصادقة...");
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [triedFallback, setTriedFallback] = useState(false);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const shopParam = params.get('shop');
        const code = params.get('code');
        const hmac = params.get('hmac');
        const state = params.get('state');
        const forceUpdate = params.get('force_update') === 'true';
        
        // Set debug info
        const debug = {
          shopParam,
          code: code ? "present" : "missing",
          hmac: hmac ? "present" : "missing",
          state,
          forceUpdate,
          search: location.search,
          url: window.location.href,
          origin: window.location.origin,
          referrer: document.referrer || "none",
          localStorage: {
            shopify_store: localStorage.getItem('shopify_store'),
            shopify_connected: localStorage.getItem('shopify_connected'),
            shopify_temp_store: localStorage.getItem('shopify_temp_store'),
            shopify_active_store: localStorage.getItem('shopify_active_store'),
            shopify_last_url_shop: localStorage.getItem('shopify_last_url_shop'),
            shopify_connected_stores: localStorage.getItem('shopify_connected_stores')
          },
          timestamp: new Date().toISOString()
        };
        
        setDebugInfo(debug);
        
        if (!shopParam || !code || !hmac) {
          setError("معلمات المصادقة مفقودة");
          setIsProcessing(false);
          return;
        }
        
        // تنظيف معلمة المتجر
        const cleanedShop = cleanShopifyDomain(shopParam);
        setShop(cleanedShop);
        
        try {
          // مسح جميع المتاجر الأخرى للتأكد من أن المتجر الجديد فقط هو النشط
          if (forceUpdate) {
            shopifyConnectionManager.clearAllStoresExcept(cleanedShop);
          }
          
          // استدعاء دالة Edge Function لإكمال المصادقة
          const { data, error } = await supabase.functions.invoke('shopify-callback', {
            body: {
              shop: cleanedShop,
              code,
              hmac,
              state,
              forceUpdate
            },
          });
          
          if (error) {
            throw new Error(`فشل إكمال المصادقة: ${error.message}`);
          }
          
          if (!data?.success) {
            throw new Error(data?.error || "حدث خطأ غير معروف أثناء إكمال المصادقة");
          }
          
          // تحديث مدير الاتصال
          shopifyConnectionManager.clearAllStoresExcept(cleanedShop);
          
          // حفظ معلومات المتجر في localStorage
          localStorage.setItem('shopify_store', cleanedShop);
          localStorage.setItem('shopify_connected', 'true');
          localStorage.setItem('shopify_active_store', cleanedShop);
          localStorage.setItem('shopify_last_url_shop', cleanedShop);
          
          // إزالة البيانات المؤقتة
          localStorage.removeItem('shopify_temp_store');
          
          setIsProcessing(false);
          toast.success(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
          
          // إذا كان هناك عنوان URL للتوجيه في الإستجابة، انتقل إليه
          if (data.redirect) {
            window.location.href = data.redirect;
          } else {
            setTimeout(() => {
              navigate('/dashboard?shopify_connected=true&shop=' + encodeURIComponent(cleanedShop) + '&timestamp=' + Date.now(), { replace: true });
            }, 1000);
          }
        } catch (error) {
          console.error("Error handling callback:", error);
          
          // محاولة استدعاء مباشر كخطة بديلة
          if (!triedFallback) {
            setTriedFallback(true);
            setStatus("جاري تجربة الطريقة البديلة للمصادقة...");
            
            try {
              const response = await fetch(
                `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-callback?shop=${encodeURIComponent(cleanedShop)}&code=${code}&hmac=${hmac}${state ? `&state=${state}` : ''}`,
                { method: 'GET' }
              );
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`فشل إكمال المصادقة: ${errorData.error || response.statusText}`);
              }
              
              const result = await response.json();
              
              // تحديث مدير الاتصال
              shopifyConnectionManager.clearAllStoresExcept(cleanedShop);
              
              // حفظ معلومات المتجر في localStorage
              localStorage.setItem('shopify_store', cleanedShop);
              localStorage.setItem('shopify_connected', 'true');
              localStorage.setItem('shopify_active_store', cleanedShop);
              localStorage.setItem('shopify_last_url_shop', cleanedShop);
              
              // إزالة البيانات المؤقتة
              localStorage.removeItem('shopify_temp_store');
              
              setIsProcessing(false);
              toast.success(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
              
              // توجيه المستخدم إلى لوحة التحكم
              navigate('/dashboard?shopify_connected=true&shop=' + encodeURIComponent(cleanedShop) + '&timestamp=' + Date.now(), { replace: true });
            } catch (fallbackError) {
              console.error("Fallback API call failed:", fallbackError);
              setError("فشل إكمال عملية المصادقة");
              setIsProcessing(false);
            }
          } else {
            setError("فشل إكمال عملية المصادقة");
            setIsProcessing(false);
          }
        }
      } catch (error) {
        console.error("Unexpected error in callback:", error);
        setError(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
        setIsProcessing(false);
      }
    };
    
    handleCallback();
  }, [location.search, navigate, triedFallback]);
  
  const retryAuth = () => {
    if (shop) {
      shopifyConnectionManager.clearAllStoresExcept(shop);
      navigate(`/shopify?shop=${encodeURIComponent(shop)}&force_update=true&t=${Date.now()}`);
    } else {
      navigate('/shopify');
    }
  };
  
  const retryWithFallback = () => {
    setTriedFallback(true);
    setIsProcessing(true);
    setError(null);
    setStatus("جاري تجربة الطريقة البديلة للمصادقة...");
  };
  
  const forceReset = () => {
    if (window.confirm('سيؤدي هذا الإجراء إلى مسح جميع بيانات المتاجر المخزنة محليًا. هل أنت متأكد؟')) {
      shopifyConnectionManager.clearAllStores();
      localStorage.removeItem('shopify_temp_store');
      toast.success('تم مسح جميع بيانات المتاجر');
      navigate('/shopify', { replace: true });
    }
  };
  
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {error ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4">فشل إكمال المصادقة</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            
            <div className="flex flex-col space-y-3">
              <Button onClick={retryAuth}>
                إعادة المحاولة
              </Button>
              
              {!triedFallback && (
                <Button variant="outline" onClick={retryWithFallback}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  استخدام الطريقة البديلة
                </Button>
              )}
              
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                العودة إلى لوحة التحكم
              </Button>
              
              <Button 
                variant="outline" 
                className="text-red-600 hover:bg-red-50 mt-2"
                onClick={forceReset}
              >
                إعادة ضبط جميع المتاجر
              </Button>
            </div>
            
            {/* معلومات التصحيح */}
            <div className="mt-6 p-4 bg-gray-100 text-xs text-left rounded-md dir-ltr">
              <details>
                <summary className="cursor-pointer font-bold mb-2 text-right">معلومات التصحيح</summary>
                <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
              </details>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              {isProcessing ? (
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              ) : (
                <div className="p-3 rounded-lg bg-green-100">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-4">
              {isProcessing ? status : "تمت المصادقة بنجاح"}
            </h1>
            <p className="mb-4">
              {isProcessing ? 
                "الرجاء الانتظار بينما نكمل عملية المصادقة..." :
                `تم الاتصال بمتجر ${shop} بنجاح`
              }
            </p>
            
            {!isProcessing && (
              <Button onClick={() => navigate('/dashboard')}>
                الانتقال إلى لوحة التحكم
              </Button>
            )}
            
            {/* معلومات التصحيح */}
            <div className="mt-6 p-4 bg-gray-100 text-xs text-left rounded-md dir-ltr">
              <details>
                <summary className="cursor-pointer font-bold mb-2 text-right">معلومات التصحيح</summary>
                <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
              </details>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
