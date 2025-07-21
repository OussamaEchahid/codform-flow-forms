import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { toast } from '@/hooks/use-toast';

const ShopifyCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('جاري معالجة الاتصال...');
  const [shop, setShop] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // استخراج المعلمات من URL
        const shopParam = searchParams.get('shop');
        const code = searchParams.get('code');
        const hmac = searchParams.get('hmac');
        const timestamp = searchParams.get('timestamp');
        const state = searchParams.get('state');

        console.log('Shopify callback received:', {
          shop: shopParam,
          code: code ? 'Present' : 'Missing',
          hmac: hmac ? 'Present' : 'Missing',
          state,
          timestamp
        });

        if (!shopParam || !code) {
          throw new Error('معلمات OAuth غير صحيحة');
        }

        // التحقق من state parameter
        const storedState = localStorage.getItem('shopify_oauth_state');
        if (state && storedState && state !== storedState) {
          throw new Error('State parameter مختلف - محاولة هجوم محتملة');
        }

        // تنظيف state
        localStorage.removeItem('shopify_oauth_state');

        setShop(shopParam);
        setMessage('جاري تأكيد الاتصال مع Shopify...');

        // استدعاء edge function للمعالجة
        console.log('Calling shopify-callback edge function...');
        const { data, error } = await shopifySupabase.functions.invoke('shopify-callback', {
          body: {
            shop: shopParam,
            code,
            hmac: hmac || '',
            timestamp: timestamp || '',
            state: state || ''
          }
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(`خطأ في edge function: ${error.message}`);
        }

        if (!data || !data.success) {
          console.error('Invalid response from edge function:', data);
          throw new Error(data?.error || 'فشل في تأكيد الاتصال');
        }

        console.log('Callback successful:', data);

        // حفظ بيانات الاتصال في localStorage
        localStorage.setItem('shopify_store', shopParam);
        localStorage.setItem('shopify_connected', 'true');
        localStorage.setItem('shopify_active_store', shopParam);
        
        // حفظ التوكن كنسخة احتياطية
        if (data.access_token) {
          localStorage.setItem(`shopify_token_${shopParam}`, data.access_token);
        }

        setStatus('success');
        setMessage('تم الاتصال بنجاح! سيتم توجيهك إلى لوحة التحكم...');
        
        toast.success('تم ربط المتجر بنجاح');

        // التوجيه بعد 2 ثانية
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
        toast.error('فشل في ربط المتجر');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const goToConnect = () => {
    navigate('/shopify-connect');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            ربط متجر Shopify
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {shop && (
            <p className="text-sm text-muted-foreground">
              المتجر: {shop}
            </p>
          )}
          
          <p className="text-center">{message}</p>
          
          {status === 'loading' && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <Button onClick={goToDashboard} className="w-full">
                الذهاب إلى لوحة التحكم
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-2">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <Button onClick={goToConnect} className="w-full">
                إعادة المحاولة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyCallback;