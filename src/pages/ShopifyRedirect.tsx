
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { shopifySupabase } from '@/lib/shopify/supabase-client';

const ShopifyRedirect = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        setIsProcessing(true);
        
        // تحليل معلمات الاستعلام
        const params = new URLSearchParams(location.search);
        const shopParam = params.get('shop');
        const code = params.get('code');
        const hmac = params.get('hmac');
        const timestamp = params.get('timestamp');
        const state = params.get('state');
        const sessionToken = params.get('session_token');

        // Store short-lived session token if present (for future API calls)
        if (sessionToken) {
          try { sessionStorage.setItem('shopify_session_token', sessionToken); } catch {}
        }
        
        console.log('معلمات إعادة التوجيه:', { shop: shopParam, code, hmac, timestamp, state });
        
        if (!shopParam) {
          throw new Error('معلمة المتجر غير موجودة في URL');
        }
        
        // حفظ معلمة المتجر للاسترداد إذا لزم الأمر
        shopifyConnectionService.saveLastUrlShop(shopParam);
        setShop(shopParam);
        
        // إذا كان لدينا رمز، فنحن في استدعاء OAuth
        if (code && hmac) {
          console.log('معالجة استدعاء OAuth');
          
          try {
            // استدعاء دالة shopify-callback في Supabase Edge Functions
            const { data, error } = await shopifySupabase.functions.invoke('shopify-callback', {
              body: { 
                shop: shopParam, 
                code, 
                hmac, 
                timestamp: timestamp || '', 
                state: state || ''
              }
            });
            
            if (error) {
              console.error('خطأ في استدعاء دالة callback:', error);
              throw new Error(`فشل في معالجة الاستدعاء: ${error.message}`);
            }
            
            if (!data || !data.success) {
              throw new Error(data?.error || 'فشل في الحصول على رمز الوصول');
            }
            
            console.log('تم الحصول على رمز الوصول بنجاح:', { shop: data.shop });
            
            // تعيين المتجر كنشط محليًا
            shopifyConnectionService.addOrUpdateStore(shopParam, true);
            
            // تحديث الحالة
            setSuccess(true);
            
            // توجيه المستخدم إلى لوحة التحكم بعد نجاح الاتصال
            setTimeout(() => {
              navigate('/dashboard?shopify_connected=true&shop=' + encodeURIComponent(shopParam));
            }, 1500);
            
          } catch (callbackError) {
            console.error('خطأ في معالجة الاستدعاء:', callbackError);
            setError(callbackError instanceof Error ? callbackError.message : 'حدث خطأ غير متوقع في الاستدعاء');
            setSuccess(false);
            toast.error('فشل في إكمال اتصال Shopify');
          }
        } else {
          // إذا لم يكن لدينا رمز، يجب أن نعيد التوجيه إلى صفحة Shopify لبدء التدفق
          console.log('لا يوجد رمز OAuth، إعادة التوجيه إلى صفحة الاتصال');
          
          // إعادة التوجيه إلى صفحة اتصال Shopify مع معلمة المتجر
          navigate(`/shopify?shop=${encodeURIComponent(shopParam)}`, { replace: true });
        }
      } catch (error) {
        console.error('خطأ في معالج إعادة التوجيه:', error);
        setError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
        setSuccess(false);
        toast.error('فشل في معالجة إعادة التوجيه');
      } finally {
        setIsProcessing(false);
      }
    };

    handleRedirect();
  }, [location, navigate]);

  const handleRetry = () => {
    // الحصول على المتجر من URL أو من localStorage
    const params = new URLSearchParams(location.search);
    const shopParam = params.get('shop') || shopifyConnectionService.getLastUrlShop() || '';
    
    // إعادة التوجيه إلى صفحة اتصال Shopify
    navigate(`/shopify?shop=${encodeURIComponent(shopParam)}`, { replace: true });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isProcessing ? 'جاري معالجة الاتصال' : 
             success ? 'تم الاتصال بنجاح' : 
             'خطأ في الاتصال'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4 text-center">
            {isProcessing ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p>يرجى الانتظار بينما نقوم بمعالجة اتصال Shopify...</p>
                {shop && <p className="text-sm text-gray-500">المتجر: {shop}</p>}
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p>تم الاتصال بنجاح بمتجر {shop}</p>
                <p className="text-sm text-gray-500">سيتم توجيهك إلى لوحة التحكم خلال لحظات...</p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-10 w-10 text-red-500" />
                <p className="text-red-600 font-medium">حدث خطأ أثناء محاولة الاتصال:</p>
                <p className="text-sm text-gray-700">{error}</p>
              </>
            )}
          </div>
        </CardContent>
        {!isProcessing && !success && (
          <CardFooter className="justify-center">
            <Button onClick={handleRetry}>
              إعادة المحاولة
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ShopifyRedirect;
