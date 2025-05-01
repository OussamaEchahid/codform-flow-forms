
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function ShopifyCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("جاري معالجة طلب المصادقة...");
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const shop = params.get('shop');
        const code = params.get('code');
        const hmac = params.get('hmac');
        const state = params.get('state');
        
        console.log("Shopify callback received with params:", { 
          shop, 
          code: code ? 'present' : 'missing', 
          hmac: hmac ? 'present' : 'missing',
          state
        });
        
        if (!shop || !code || !hmac) {
          setStatus('error');
          setError("معلمات المصادقة مفقودة");
          return;
        }
        
        // Call our Supabase Edge Function to complete OAuth
        setMessage("جاري التحقق من المصادقة مع Shopify...");
        const callbackUrl = `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-callback?${location.search.substring(1)}&client=${encodeURIComponent(window.location.origin)}`;
        
        console.log("Calling callback function:", callbackUrl);
        
        const response = await fetch(callbackUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Callback error response:", errorText);
          
          setStatus('error');
          setError(`فشل إكمال المصادقة: ${response.status} ${response.statusText}`);
          return;
        }
        
        const result = await response.json();
        console.log("Callback result:", result);
        
        if (result.success) {
          setStatus('success');
          setMessage(`تم الاتصال بمتجر ${shop} بنجاح! جاري التوجيه...`);
          
          // حفظ معلومات المتجر في التخزين المحلي
          localStorage.setItem('shopify_store', shop);
          localStorage.setItem('shopify_connected', 'true');
          localStorage.removeItem('shopify_temp_store');
          
          // إظهار رسالة نجاح
          toast.success(`تم الاتصال بمتجر ${shop} بنجاح`);
          
          // تأخير بسيط ثم التوجيه إلى لوحة التحكم
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
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
  }, [location.search, navigate]);
  
  const handleRetry = () => {
    window.location.href = '/shopify';
  };
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
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
