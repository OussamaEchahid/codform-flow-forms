
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shop = params.get('shop');
    const code = params.get('code');
    const hmac = params.get('hmac');
    const timestamp = params.get('timestamp');
    const state = params.get('state');
    
    const debug = {
      shop,
      code,
      hmac,
      timestamp,
      state,
      fullUrl: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      origin: window.location.origin,
    };
    
    setDebugInfo(debug);
    console.log('Auth page parameters:', debug);
    
    // تحقق من وجود المعلمات المطلوبة
    if (!shop) {
      setError('معلمة المتجر غير موجودة في عنوان URL');
      setIsProcessing(false);
      return;
    }

    // إذا كان لدينا رمز وhmac، فنحن في استدعاء OAuth 
    if (code && hmac) {
      handleCallback({ shop, code, hmac, state });
    } else {
      // إذا كنا فقط لدينا متجر، فنحن في بداية عملية المصادقة
      startAuthFlow(shop);
    }
  }, [location.search, navigate]);

  // معالجة الاستدعاء بعد مصادقة Shopify
  const handleCallback = async ({ shop, code, hmac, state }: any) => {
    try {
      console.log('Processing OAuth callback with code');
      
      // استدعاء Supabase Edge Function للتحقق من الرمز والحصول على الرمز المميز
      const response = await fetch(
        `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-callback?shop=${encodeURIComponent(shop)}&code=${code}&hmac=${hmac}${state ? `&state=${state}` : ''}`, 
        { method: 'GET' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`فشل التحقق من الرمز: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('Auth callback result:', result);

      if (result.success) {
        // حفظ بيانات المتجر في localStorage
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
        localStorage.removeItem('shopify_temp_store');

        // توجيه إلى لوحة التحكم
        navigate('/dashboard?shopify_success=true&shop=' + encodeURIComponent(shop));
      } else {
        setError(`فشل استكمال المصادقة: ${result.error || 'سبب غير معروف'}`);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error handling callback:', error);
      setError(error instanceof Error ? error.message : 'فشل استكمال المصادقة');
      setIsProcessing(false);
    }
  };

  // بدء تدفق المصادقة مع Shopify
  const startAuthFlow = async (shop: string) => {
    try {
      console.log('Starting auth flow for shop:', shop);
      
      // تخزين معلومات المتجر في localStorage للاستخدام إذا تم قطع تدفق المصادقة
      localStorage.setItem('shopify_temp_store', shop);

      // استخدام Edge Function للحصول على عنوان URL للمصادقة
      const response = await fetch(
        `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?shop=${encodeURIComponent(shop)}`, 
        { method: 'GET' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`فشل بدء عملية المصادقة: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      setDebugInfo(prev => ({ ...prev, authResponse: data }));

      if (data.redirect) {
        console.log('Redirecting to Shopify OAuth:', data.redirect);
        
        // توجيه مباشر إلى عنوان URL للمصادقة
        window.location.href = data.redirect;
      } else {
        throw new Error('لم يتم استلام عنوان URL للمصادقة من الخادم');
      }
    } catch (error) {
      console.error('Error starting auth flow:', error);
      setError(error instanceof Error ? error.message : 'فشل بدء عملية المصادقة');
      setIsProcessing(false);
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
            <h1 className="text-2xl font-bold mb-4">خطأ في المصادقة</h1>
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-60">
              <p className="font-bold mb-2">معلومات التصحيح:</p>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
            <button 
              onClick={() => navigate('/shopify')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              العودة إلى صفحة الاتصال بـ Shopify
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">معالجة المصادقة</h1>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
            <p className="mb-4">الرجاء الانتظار بينما نقوم بمصادقة متجر Shopify الخاص بك...</p>
            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-60">
              <p className="font-bold mb-2">معلومات التصحيح:</p>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
