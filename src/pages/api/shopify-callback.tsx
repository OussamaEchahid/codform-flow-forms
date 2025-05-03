import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function ShopifyCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("جاري إكمال المصادقة...");
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const shopParam = params.get('shop');
        const code = params.get('code');
        const hmac = params.get('hmac');
        const state = params.get('state');
        
        // Set debug info
        const debug = {
          shopParam,
          code: code ? "present" : "missing",
          hmac: hmac ? "present" : "missing",
          state,
          search: location.search,
          url: window.location.href,
          referrer: document.referrer || "none",
          timestamp: new Date().toISOString()
        };
        
        setDebugInfo(debug);
        
        if (!shopParam || !code || !hmac) {
          setError("معلمات المصادقة مفقودة");
          setIsProcessing(false);
          return;
        }
        
        setShop(shopParam);
        
        try {
          // Call Supabase Edge Function to complete the auth
          // Include popup=true to get HTML response if this is in a popup
          const isPopup = window.opener != null;
          const popupParam = isPopup ? "&popup=true" : "";
          
          const response = await fetch(
            `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-callback?${location.search.substring(1)}${popupParam}`,
            { method: 'GET' }
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`فشل إكمال المصادقة: ${errorData.error || response.statusText}`);
          }
          
          // We could get HTML or JSON depending on popup parameter
          const contentType = response.headers.get("content-type") || "";
          
          if (contentType.includes("text/html")) {
            // For popup flow, let the HTML handle the closing
            document.open();
            document.write(await response.text());
            document.close();
            return;
          }
          
          // Otherwise handle JSON response for full page flow
          const result = await response.json();
          
          // Store shop information in localStorage
          localStorage.setItem('shopify_store', shopParam);
          localStorage.setItem('shopify_connected', 'true');
          
          // Remove temporary data
          localStorage.removeItem('shopify_temp_store');
          
          toast.success(`تم الاتصال بمتجر ${shopParam} بنجاح`);
          
          // Close popup window or redirect based on context
          if (isPopup) {
            window.close();
          } else if (result.redirect) {
            window.location.href = result.redirect;
          } else {
            navigate('/dashboard', { replace: true });
          }
        } catch (error) {
          console.error("Error handling callback:", error);
          setError("فشل إكمال عملية المصادقة");
          setIsProcessing(false);
        }
      } catch (error) {
        console.error("Unexpected error in callback:", error);
        setError(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
        setIsProcessing(false);
      }
    };
    
    handleCallback();
  }, [location.search, navigate]);
  
  const retryAuth = () => {
    if (shop) {
      navigate(`/shopify?shop=${encodeURIComponent(shop)}`);
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
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4">فشل إكمال المصادقة</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button className="mr-2" onClick={retryAuth}>
              إعادة المحاولة
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              العودة إلى لوحة التحكم
            </Button>
            
            {/* Debug information */}
            <div className="mt-6 p-4 bg-gray-100 text-xs text-left rounded-md">
              <details>
                <summary className="cursor-pointer font-bold mb-2">معلومات التصحيح</summary>
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
          </>
        )}
      </div>
    </div>
  );
}
