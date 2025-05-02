
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function ShopifyCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("جاري معالجة طلب المصادقة...");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [shop, setShop] = useState<string | null>(null);
  const { refreshShopifyConnection } = useAuth();
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const shopParam = params.get('shop');
        const code = params.get('code');
        const hmac = params.get('hmac');
        const state = params.get('state');
        const timestamp = Date.now();
        
        setShop(shopParam);
        
        console.log("Shopify callback received with params:", { 
          shop: shopParam, 
          code: code ? 'present' : 'missing', 
          hmac: hmac ? 'present' : 'missing',
          state
        });
        
        setDebugInfo({
          params: {
            shop: shopParam,
            code: code ? 'present' : 'missing',
            hmac: hmac ? 'present' : 'missing',
            state
          },
          timestamp: new Date().toISOString(),
          url: window.location.href,
          localStorage: {
            shopify_temp_store: localStorage.getItem('shopify_temp_store'),
            shopify_store: localStorage.getItem('shopify_store'),
            shopify_connected: localStorage.getItem('shopify_connected')
          }
        });
        
        // Make sure we have required params
        if (!shopParam || !code || !hmac) {
          setStatus('error');
          setError("معلمات المصادقة مفقودة");
          return;
        }
        
        // Call our Supabase Edge Function to complete OAuth
        setMessage("جاري التحقق من المصادقة مع Shopify...");
        
        // Add retry logic with multiple callback URLs
        const tryCallbackWithUrl = async (baseUrl: string): Promise<Response> => {
          const callbackUrl = `${baseUrl}/shopify-callback?${location.search.substring(1)}&client=${encodeURIComponent(window.location.origin)}&t=${timestamp}`;
          console.log("Calling callback function:", callbackUrl);
          
          try {
            const response = await fetch(callbackUrl, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            
            return response;
          } catch (error) {
            console.error("Error calling callback URL:", error);
            throw error;
          }
        };
        
        let response: Response | null = null;
        let errorMessage = "";
        
        // Try with first URL
        try {
          response = await tryCallbackWithUrl("https://nhqrngdzuatdnfkihtud.functions.supabase.co");
        } catch (error1) {
          errorMessage = `First endpoint failed: ${error1}`;
          console.error("First endpoint failed:", error1);
          
          // Try with second URL if first fails
          try {
            response = await tryCallbackWithUrl("https://edge-runtime.supabase.com");
          } catch (error2) {
            errorMessage = `Both endpoints failed: ${error1}, then ${error2}`;
            console.error("Second endpoint failed:", error2);
          }
        }
        
        if (!response || !response.ok) {
          const errorText = response ? await response.text() : "No response";
          console.error("Callback error response:", errorText);
          
          setStatus('error');
          setError(`فشل إكمال المصادقة: ${response ? response.status : 'No response'} ${errorMessage}`);
          return;
        }
        
        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          setStatus('error');
          setError(`خطأ في تحليل استجابة الخادم: ${parseError}`);
          return;
        }
        
        console.log("Callback result:", result);
        
        if (result.success) {
          setStatus('success');
          setMessage(`تم الاتصال بمتجر ${shopParam} بنجاح! جاري التوجيه...`);
          
          // Store connection data with clean values
          localStorage.setItem('shopify_store', shopParam);
          localStorage.setItem('shopify_connected', 'true');
          localStorage.setItem('shopify_last_connect_time', timestamp.toString());
          localStorage.removeItem('shopify_temp_store');
          
          // Reset connection attempts counter
          localStorage.setItem('shopify_connection_attempts', '0');
          
          // Refresh connection in auth context if available
          if (refreshShopifyConnection) {
            refreshShopifyConnection();
          }
          
          // Show success toast
          toast.success(`تم الاتصال بمتجر ${shopParam} بنجاح`);
          
          // Redirect with delay to allow state to be saved
          setTimeout(() => {
            navigate('/dashboard', { 
              replace: true, 
              state: { 
                shopify_success: true, 
                shop: shopParam, 
                connected: true,
                timestamp
              } 
            });
          }, 1500);
        } else {
          setStatus('error');
          setError(result.error || "فشل الاتصال لسبب غير معروف");
        }
      } catch (error) {
        console.error("Error processing callback:", error);
        setStatus('error');
        setError(error instanceof Error ? error.message : "حدث خطأ أثناء معالجة المصادقة");
      }
    };
    
    handleCallback();
  }, [location.search, navigate, refreshShopifyConnection]);
  
  const handleRetry = () => {
    // Navigate to Shopify connection page with shop parameter if available
    if (shop) {
      window.location.href = `/shopify?shop=${encodeURIComponent(shop)}&retry=true&ts=${Date.now()}`;
    } else {
      window.location.href = `/shopify?retry=true&ts=${Date.now()}`;
    }
  };
  
  const handleGoToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };
  
  return (
    <div className="flex min-h-screen justify-center items-center bg-gray-50" dir="rtl">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">
          {status === 'loading' && "جاري الاتصال بـ Shopify"}
          {status === 'success' && "تم الاتصال بنجاح!"}
          {status === 'error' && "حدث خطأ في الاتصال"}
        </h1>
        
        <div className="mb-6">
          {status === 'loading' && (
            <Loader className="w-16 h-16 mx-auto text-purple-600 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="w-16 h-16 mx-auto text-red-500" />
          )}
        </div>
        
        <p className="mb-6 text-lg">{message}</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 text-right">
            <p className="font-bold">خطأ:</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="space-y-3">
          {status === 'error' && (
            <>
              <Button onClick={handleRetry} className="w-full bg-purple-600 hover:bg-purple-700">
                إعادة المحاولة
              </Button>
              <Button onClick={handleGoToDashboard} variant="outline" className="w-full">
                الذهاب إلى لوحة التحكم
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
