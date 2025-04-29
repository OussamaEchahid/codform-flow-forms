
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ExternalLink, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Clean the shop domain
function cleanShopDomain(shop: string): string {
  let cleanedShop = shop.trim();
  
  // Remove protocol if present
  if (cleanedShop.startsWith('http')) {
    try {
      const url = new URL(cleanedShop);
      cleanedShop = url.hostname;
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  // Ensure it ends with myshopify.com
  if (!cleanedShop.endsWith('myshopify.com')) {
    if (!cleanedShop.includes('.')) {
      cleanedShop = `${cleanedShop}.myshopify.com`;
    }
  }
  
  return cleanedShop;
}

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
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        let shopParam = params.get("shop");
        const hmac = params.get("hmac");
        const code = params.get("code");
        const timestamp = params.get("timestamp");
        const state = params.get("state");
        const host = params.get("host");
        
        // تنظيف معلمة المتجر والاحتفاظ بالقيمة الأصلية للتشخيص
        const originalShop = shopParam;
        
        // Update debug info
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
        
        // Check for shop parameter
        if (!shopParam) {
          // If no shop parameter, check for previously stored shop
          const savedShop = localStorage.getItem('shopify_store');
          const savedConnected = localStorage.getItem('shopify_connected');
          // Check for temp shop during auth
          const tempShop = localStorage.getItem('shopify_temp_store');
          
          console.log("Stored data:", { savedShop, savedConnected, tempShop });
          
          if (savedShop && savedConnected === 'true') {
            // If we have stored shop data, redirect directly to dashboard
            console.log("Using stored shop data for redirect...");
            navigate(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(savedShop)}`);
            return;
          }
          
          if (tempShop) {
            // Use temporary shop data
            shopParam = tempShop;
            console.log("Using temporary shop data to continue auth:", shopParam);
          } else {
            // If no shop parameter or stored data, show error
            setStatus("خطأ: لم يتم توفير معلمة متجر Shopify");
            setError("يرجى التأكد من وجود معلمة 'shop' في عنوان URL أو اتباع الخطوات الصحيحة لتثبيت التطبيق");
            setIsLoading(false);
            return;
          }
        }
        
        // Clean shop domain
        let cleanedShop = cleanShopDomain(shopParam);
        console.log("Cleaned shop domain:", cleanedShop);
        
        // Store shop info in localStorage for use if auth flow is interrupted
        try {
          localStorage.setItem('shopify_temp_store', cleanedShop);
          console.log("Temp shop info saved:", cleanedShop);
        } catch (e) {
          console.error("Error saving temp data:", e);
        }
        
        // If we have code and hmac, we're in the callback redirect after auth
        if (code && hmac) {
          setStatus(`جاري استكمال عملية المصادقة مع متجر ${cleanedShop}...`);
          
          try {
            // Call Supabase Edge Function to complete the auth
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
              // Save shop data in localStorage
              localStorage.setItem('shopify_store', cleanedShop);
              localStorage.setItem('shopify_connected', 'true');
              localStorage.removeItem('shopify_temp_store');
              
              toast.success(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
              
              // Check if there's a redirect URL from the response
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
          // Redirect the user directly to the server auth path
          setStatus(`جاري توجيهك للمصادقة مع متجر ${cleanedShop}...`);
          
          try {
            // Use Edge Function directly to get auth URL
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
              
              // Direct redirect to auth URL
              window.location.href = authData.redirect;
            } else {
              throw new Error("لم يتم استلام عنوان URL للمصادقة من الخادم");
            }
          } catch (e) {
            console.error("Error getting auth URL:", e);
            
            // If failed, try again with direct approach if we haven't reached max retries
            if (retryCount < 3) {
              setRetryCount(prev => prev + 1);
              
              // Use direct auth URL after failing to use Edge Function
              const directAuthUrl = `/auth?shop=${encodeURIComponent(cleanedShop)}&_t=${Date.now()}&_r=${Math.random().toString().substring(2)}`;
              console.log("Trying direct auth URL as fallback:", directAuthUrl);
              
              // Use slight delay before redirect
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
  
  // Direct auth alternative method
  const handleDirectAuth = () => {
    const shop = localStorage.getItem('shopify_temp_store');
    if (shop) {
      // Using direct URL with additional params to avoid caching issues
      const directAuthUrl = `/auth?shop=${encodeURIComponent(shop)}&_t=${Date.now()}&_r=${Math.random().toString().substring(2)}`;
      window.location.href = directAuthUrl;
    } else {
      toast.error("لا توجد معلومات متجر متاحة للاستخدام");
    }
  };

  // Handle retry with direct approach
  const handleRetryDirectly = () => {
    // Try the Remix auth endpoint directly
    const shop = localStorage.getItem('shopify_temp_store') || debug.originalShop || 'bestform-app.myshopify.com';
    if (shop) {
      // Using URL with timestamp to avoid caching
      window.location.href = `/auth?shop=${encodeURIComponent(cleanShopDomain(shop))}&_t=${Date.now()}`;
    } else {
      navigate('/shopify');
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
            
            {/* Recovery options */}
            <div className="mb-6 space-y-3">
              <Button 
                className="w-full"
                onClick={handleDirectAuth}
              >
                محاولة الاتصال مباشرة
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleRetryDirectly}
                className="w-full flex items-center justify-center"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                محاولة الاتصال باستخدام مسار Node.js
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
