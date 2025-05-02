
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, ArrowRight, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ShopifyRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopData, setShopData] = useState<any>(null);
  const [edgeResponse, setEdgeResponse] = useState<any>(null);
  
  // تتبع محاولات إعادة التوجيه
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shop = params.get('shop');
    const client = params.get('client') || window.location.origin;
    const force = params.get('force') === 'true';
    const returnUrl = params.get('return') || '/dashboard';
    
    // منع حلقات إعادة التوجيه
    const attempts = parseInt(sessionStorage.getItem('shopify_redirect_attempts') || '0', 10);
    sessionStorage.setItem('shopify_redirect_attempts', (attempts + 1).toString());
    setRedirectAttempts(attempts + 1);
    
    if (attempts > 5) {
      setError('تم اكتشاف الكثير من محاولات إعادة التوجيه. يرجى العودة إلى لوحة التحكم والمحاولة مرة أخرى.');
      setIsLoading(false);
      return;
    }
    
    const initiateAuth = async () => {
      if (!shop) {
        setError('معلمة المتجر مطلوبة');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Initiating Shopify authentication for shop:', shop);
        
        // تأكد من أن المتجر مخزن في localStorage
        localStorage.setItem('shopify_store', shop);
        
        // استخدام Edge Function لبدء عملية المصادقة
        const authEndpoint = `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?shop=${encodeURIComponent(shop)}&client=${encodeURIComponent(client)}&force=${force}&debug=true&timestamp=${Date.now()}&random=${Math.random().toString(36).substring(7)}`;
        
        console.log('Calling auth endpoint:', authEndpoint);
        
        const response = await fetch(authEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Auth endpoint returned ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        setEdgeResponse(data);
        console.log('Auth endpoint response:', data);
        
        if (data.success && data.redirect) {
          // إذا كان لدينا بالفعل رمز وصول، يمكننا العودة مباشرة
          if (data.hasExistingToken) {
            console.log('Using existing token, redirecting to:', returnUrl);
            
            // تحديث حالة الاتصال المحلية
            localStorage.setItem('shopify_connected', 'true');
            localStorage.setItem('shopify_last_connect_time', Date.now().toString());
            
            // العودة إلى عنوان URL المحدد
            setTimeout(() => {
              navigate(returnUrl, { 
                state: { 
                  shopifyConnected: true, 
                  shop, 
                  timestamp: Date.now()
                }
              });
            }, 1000);
            
            return;
          }
          
          // بدء المصادقة من خلال توجيه المستخدم إلى مصادقة Shopify
          console.log('Redirecting to Shopify OAuth:', data.redirect);
          
          // تخزين الحالة في Supabase للتحقق لاحقًا
          if (data.state) {
            try {
              const { error: saveError } = await supabase.from('shopify_auth').insert({
                shop: shop,
                state: data.state
              });
              
              if (saveError) {
                console.error('Error saving auth state:', saveError);
              }
            } catch (insertError) {
              console.error('Error inserting auth state:', insertError);
            }
          }
          
          // تسجيل معلومات توجيه المستخدم
          sessionStorage.setItem('shopify_auth_redirect', JSON.stringify({
            timestamp: Date.now(),
            shop: shop,
            clientUrl: client,
            returnUrl: returnUrl,
            state: data.state
          }));
          
          // إعادة توجيه المستخدم إلى مصادقة Shopify
          window.location.href = data.redirect;
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error('استجابة غير معروفة من نقطة نهاية المصادقة');
        }
      } catch (error) {
        console.error('Error during Shopify authentication:', error);
        setError(error instanceof Error ? error.message : 'حدث خطأ أثناء المصادقة مع Shopify');
        setIsLoading(false);
      }
    };
    
    initiateAuth();
  }, [navigate, location.search]);
  
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    
    const params = new URLSearchParams(location.search);
    const shop = params.get('shop');
    
    // إعادة توجيه إلى عنوان URL أصلي مع معلمة إضافية للتجنب التخزين المؤقت
    const authUrl = `/auth?shop=${shop}&force=true&ts=${Date.now()}&r=${Math.random().toString(36).substring(2,8)}`;
    navigate(authUrl);
  };
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4">خطأ في توجيه Shopify</h1>
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              className="w-full"
            >
              إعادة المحاولة
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleBackToDashboard}
              className="w-full"
            >
              العودة إلى لوحة التحكم
            </Button>
          </div>
          
          {edgeResponse && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-40">
              <p className="font-bold mb-2">استجابة الخادم:</p>
              <pre>{JSON.stringify(edgeResponse, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">جاري توجيهك إلى مصادقة Shopify</h1>
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <p className="mb-2">يرجى الانتظار، سيتم إعادة توجيهك تلقائيًا خلال لحظات...</p>
        <div className="flex items-center justify-center my-4">
          <div className="h-8 w-8 text-gray-400">
            <Loader className="animate-spin" />
          </div>
          <ArrowRight className="mx-4 text-gray-400" />
          <div className="h-8 w-8 text-blue-500">
            <svg viewBox="0 0 109.5 124" xmlns="http://www.w3.org/2000/svg">
              <path fill="#5E8E3E" d="M74.7,14.8l-1.4,4c-.6-.2-1.1-.3-1.7-.3-4.6,0-7.6,3.5-7.6,9.3v1.9h6.2l-.9,3.9h-5.3V63h-4.5V33.5h-4.2v-3.9h4.2V25c0-7.3,4.4-11.5,10.8-11.5C71.9,13.6,73.4,14,74.7,14.8z"/>
              <path fill="#5E8E3E" d="M96.5,62.9V13.9h4.5V63L96.5,62.9L96.5,62.9z"/>
              <path fill="#5E8E3E" d="M109.5,33.5h-4.3l.1-3.9h4.3v-7.7l4.3-1.4v9h8.5v3.9h-8.5v19.1c0,7.8,5,8.6,7.9,8.6c.3,0,.5,0,.5,0v4.2c0,0-.3,0-.7,0C116,65.4,109.5,62.5,109.5,52V33.5L109.5,33.5z"/>
              <path fill="#5E8E3E" d="M74.9,49.3c0,8.2-5.9,14.9-13.9,14.9S47.1,57.5,47.1,49.4v-.1c0-8.2,5.9-14.9,13.9-14.9C69,34.5,74.9,41.2,74.9,49.3L74.9,49.3z M70.5,49.4c0-6.1-4-10.7-9.5-10.7s-9.4,4.6-9.4,10.6v.1c0,6.1,4,10.7,9.5,10.7S70.5,55.5,70.5,49.4L70.5,49.4z"/>
            </svg>
          </div>
        </div>
        
        {redirectAttempts > 1 && (
          <div className="mt-4">
            <Button 
              variant="outline"
              onClick={handleBackToDashboard}
              className="w-full"
            >
              إلغاء والعودة إلى لوحة التحكم
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopifyRedirect;
