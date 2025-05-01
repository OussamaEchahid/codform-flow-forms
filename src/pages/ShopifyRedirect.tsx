
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ExternalLink, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
  const [showTrace, setShowTrace] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  
  // Prevent multiple redirects in the same session
  useEffect(() => {
    // Check if we've tried too many times in this session
    const redirectAttempts = parseInt(sessionStorage.getItem('shopify_redirect_attempts') || '0', 10);
    sessionStorage.setItem('shopify_redirect_attempts', (redirectAttempts + 1).toString());
    
    if (redirectAttempts > 5) {
      setStatus("تم اكتشاف مشكلة تكرار إعادة التوجيه");
      setError("يبدو أننا نواجه حلقة إعادة توجيه. سنوقف العملية مؤقتًا. يرجى العودة إلى لوحة التحكم ومحاولة إعادة الاتصال من هناك.");
      setIsLoading(false);
      return;
    }
  }, []);
  
  useEffect(() => {
    // Prevent executing the redirect logic multiple times
    if (processingComplete) {
      return;
    }
    
    const redirectToAuthEndpoint = async () => {
      try {
        setProcessingComplete(true); // Mark processing as started
        
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        let shopParam = params.get("shop");
        const hmac = params.get("hmac");
        const code = params.get("code");
        const timestamp = params.get("timestamp");
        const state = params.get("state");
        const host = params.get("host");
        const force = params.get("force") === "true";
        
        // Original shop parameter for debugging
        const originalShop = shopParam;
        
        // Update debug info
        const debugInfo = { 
          originalShop,
          hmac, 
          code, 
          timestamp,
          state,
          host,
          force,
          url: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search,
          origin: window.location.origin,
          fullUrl: window.location.href,
          referrer: document.referrer || "none",
          userAgent: navigator.userAgent,
          cookies: document.cookie,
          retryCount,
          localStorageShop: localStorage.getItem('shopify_store'),
          localStorageConnected: localStorage.getItem('shopify_connected'),
          tempShop: localStorage.getItem('shopify_temp_store'),
          sessionStorage: Object.keys(sessionStorage).map(key => `${key}: ${sessionStorage.getItem(key)}`),
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
          
          if (savedShop && savedConnected === 'true' && !force) {
            // If we have stored shop data and not forcing reconnection, redirect directly to dashboard
            console.log("Using stored shop data for redirect...");
            // Reset redirect counter
            sessionStorage.removeItem('shopify_redirect_attempts');
            
            // First verify the token in database
            try {
              const { data: storeData, error: storeError } = await supabase
                .from('shopify_stores')
                .select('access_token, updated_at')
                .eq('shop', savedShop)
                .single();
                
              if (storeError || !storeData || !storeData.access_token) {
                console.log("Stored token not found in database, clearing local storage");
                localStorage.removeItem('shopify_store');
                localStorage.removeItem('shopify_connected');
                // Continue with new auth flow instead of redirecting
              } else {
                // Token exists, redirect to dashboard
                console.log("Token verified in database, redirecting to dashboard");
                navigate(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(savedShop)}&verified=true`);
                return;
              }
            } catch (verifyError) {
              console.error("Error verifying token:", verifyError);
              // Continue with auth flow
            }
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
            // First check if token already exists in database
            const { data: existingToken, error: tokenError } = await supabase
              .from('shopify_stores')
              .select('access_token, updated_at')
              .eq('shop', cleanedShop)
              .single();
              
            if (existingToken?.access_token) {
              console.log("Found existing token in database, skipping callback function");
              
              // Save shop data in localStorage
              localStorage.setItem('shopify_store', cleanedShop);
              localStorage.setItem('shopify_connected', 'true');
              localStorage.removeItem('shopify_temp_store');
              
              // Reset redirect counter
              sessionStorage.removeItem('shopify_redirect_attempts');
              
              toast.success(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
              navigate('/dashboard?shopify_success=true&shop=' + encodeURIComponent(cleanedShop));
              return;
            }
          
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
              // Verify the token is really in the database
              const { data: verifyToken, error: verifyError } = await supabase
                .from('shopify_stores')
                .select('access_token')
                .eq('shop', cleanedShop)
                .single();
                
              if (verifyError || !verifyToken?.access_token) {
                console.error("Token not found in database after callback:", verifyError);
                throw new Error("لم يتم العثور على رمز المتجر في قاعدة البيانات بعد إكمال المصادقة.");
              }
              
              // Save shop data in localStorage
              localStorage.setItem('shopify_store', cleanedShop);
              localStorage.setItem('shopify_connected', 'true');
              localStorage.removeItem('shopify_temp_store');
              
              // Reset redirect counter
              sessionStorage.removeItem('shopify_redirect_attempts');
              
              toast.success(`تم الاتصال بمتجر ${cleanedShop} بنجاح`);
              
              // Navigate to dashboard with parameters indicating success
              navigate('/dashboard?shopify_success=true&shop=' + encodeURIComponent(cleanedShop));
            } else {
              throw new Error(`فشل الاتصال: ${callbackResult.error || "خطأ غير معروف"}`);
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "خطأ غير معروف أثناء عملية المصادقة";
            console.error("Authentication error:", errorMsg);
            toast.error(errorMsg);
            
            // Clear temporary data in case of error
            localStorage.removeItem('shopify_temp_store');
            setStatus("فشلت عملية المصادقة");
            setError(errorMsg);
            setIsLoading(false);
          }
        } else {
          // No code/hmac, initiate OAuth flow
          setStatus(`جاري توجيهك للاتصال بمتجر ${cleanedShop}...`);
          
          try {
            // Call the auth endpoint directly
            const authUrl = `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?shop=${encodeURIComponent(cleanedShop)}&redirect_uri=${encodeURIComponent(window.location.origin + '/shopify-redirect')}`;
            
            console.log("Redirecting to auth URL:", authUrl);
            window.location.href = authUrl;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "خطأ غير معروف أثناء بدء المصادقة";
            setStatus("فشل بدء عملية المصادقة");
            setError(errorMsg);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Unhandled error in redirect process:", error);
        const errorMsg = error instanceof Error ? error.message : "خطأ غير معروف أثناء عملية إعادة التوجيه";
        setStatus("حدث خطأ غير متوقع");
        setError(errorMsg);
        setIsLoading(false);
      }
    };
    
    // Execute redirect logic
    redirectToAuthEndpoint();
  }, [location.search, navigate, retryCount, processingComplete]);
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setError(null);
    setStatus("جاري إعادة المحاولة...");
    setProcessingComplete(false);
  };
  
  const handleManualGoToDashboard = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">
          {error ? "حدثت مشكلة" : "جاري الاتصال بـ Shopify"}
        </h1>
        
        {isLoading ? (
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
        ) : (
          <div className="text-green-500 text-5xl mb-4">✓</div>
        )}
        
        <p className="mb-4 text-gray-700">
          {status}
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 text-sm text-left">
            <p className="font-bold">خطأ:</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="space-y-4 mt-6">
          {error && (
            <>
              <Button 
                onClick={handleRetry}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCcw className="h-4 w-4 mr-2" /> إعادة المحاولة
              </Button>
              
              <Button 
                onClick={handleManualGoToDashboard}
                variant="outline"
                className="w-full"
              >
                العودة للوحة التحكم
              </Button>
            </>
          )}
          
          {!error && !isLoading && (
            <Button 
              onClick={handleManualGoToDashboard}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              الذهاب للوحة التحكم
            </Button>
          )}
          
          <div className="text-xs text-gray-500 mt-2">
            {isLoading ? "يرجى الانتظار، قد تستغرق هذه العملية بضع ثوان..." : ""}
          </div>
        </div>
        
        {/* Debug information toggle */}
        <div className="mt-8 text-left">
          <button 
            onClick={() => setShowTrace(!showTrace)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
          >
            {showTrace ? "إخفاء" : "إظهار"} معلومات التصحيح
          </button>
          
          {showTrace && (
            <pre className="mt-2 bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60 text-left">
              {JSON.stringify(debug, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopifyRedirect;
