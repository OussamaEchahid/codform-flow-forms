
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { shopifyStores } from '@/lib/shopify/supabase-client';
import { toast } from 'sonner';

const ShopifyCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'waiting' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('جاري معالجة الاتصال...');
  const [shop, setShop] = useState<string>('');
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const MAX_VERIFICATION_ATTEMPTS = 15;
  const VERIFICATION_INTERVAL = 2000;

  // دالة للتحقق من وجود المتجر في قاعدة البيانات
  const verifyStoreInDatabase = async (shopParam: string): Promise<boolean> => {
    try {
      console.log(`🔍 Verifying store ${shopParam} in database (attempt ${verificationAttempts + 1})`);
      
      const { data, error } = await shopifyStores()
        .select('*')
        .eq('shop', shopParam)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.error(`❌ Database verification error:`, error);
        return false;
      }
      
      if (data && data.access_token && data.access_token !== 'placeholder_token') {
        console.log(`✅ Store ${shopParam} found in database with valid token`);
        return true;
      }
      
      console.log(`⏳ Store ${shopParam} not yet found in database`);
      return false;
    } catch (error) {
      console.error(`❌ Verification exception:`, error);
      return false;
    }
  };

  // دالة التحقق المستمر
  const startVerificationLoop = async (shopParam: string) => {
    setStatus('waiting');
    setMessage('جاري التحقق من حفظ المتجر في قاعدة البيانات...');
    
    const checkInterval = setInterval(async () => {
      const currentAttempt = verificationAttempts + 1;
      setVerificationAttempts(currentAttempt);
      
      console.log(`🔄 Verification attempt ${currentAttempt}/${MAX_VERIFICATION_ATTEMPTS}`);
      
      const isStoreVerified = await verifyStoreInDatabase(shopParam);
      
      if (isStoreVerified) {
        clearInterval(checkInterval);
        
        // حفظ بيانات الاتصال محلياً
        localStorage.setItem('shopify_store', shopParam);
        localStorage.setItem('shopify_connected', 'true');
        localStorage.setItem('shopify_active_store', shopParam);
        
        setStatus('success');
        setMessage('تم الاتصال بنجاح! سيتم توجيهك إلى لوحة التحكم...');
        
        toast.success(`تم ربط المتجر ${shopParam} بنجاح`);
        
        // التوجيه بعد 2 ثانية
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
        
        return;
      }
      
      // إذا انتهت المحاولات
      if (currentAttempt >= MAX_VERIFICATION_ATTEMPTS) {
        clearInterval(checkInterval);
        setStatus('error');
        setMessage(`فشل في التحقق من حفظ المتجر بعد ${MAX_VERIFICATION_ATTEMPTS} محاولة`);
        
        toast.error('فشل في التحقق من حفظ المتجر في قاعدة البيانات');
      }
    }, VERIFICATION_INTERVAL);
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const shopParam = searchParams.get('shop');
        const code = searchParams.get('code');
        const hmac = searchParams.get('hmac');
        const state = searchParams.get('state');

        console.log(`🚀 Callback started for shop: ${shopParam}`);
        
        setDebugInfo({
          shop: shopParam,
          code: code ? 'present' : 'missing',
          hmac: hmac ? 'present' : 'missing',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });

        if (!shopParam) {
          throw new Error('معامل shop مطلوب');
        }

        if (!code) {
          throw new Error('معامل code مطلوب');
        }

        setShop(shopParam);
        setMessage('تم استلام callback من Shopify، جاري التحقق من العملية...');

        console.log(`✅ Callback received for shop: ${shopParam}`);
        console.log(`📡 Edge Function should have processed this automatically`);
        
        // بدء حلقة التحقق المستمر
        await startVerificationLoop(shopParam);

      } catch (error) {
        console.error(`❌ Callback error:`, error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
        toast.error('فشل في ربط المتجر');
      }
    };

    handleCallback();
  }, [searchParams]);

  const goToConnect = () => {
    navigate('/shopify-connect');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const retryVerification = async () => {
    if (shop) {
      setVerificationAttempts(0);
      await startVerificationLoop(shop);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'waiting' && <Clock className="h-5 w-5 text-blue-500" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            ربط متجر Shopify
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {shop && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-800">
                المتجر: {shop}
              </p>
            </div>
          )}
          
          <p className="text-center">{message}</p>
          
          {status === 'waiting' && (
            <div className="space-y-2">
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
              <p className="text-sm text-gray-600">
                محاولة التحقق: {verificationAttempts}/{MAX_VERIFICATION_ATTEMPTS}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(verificationAttempts / MAX_VERIFICATION_ATTEMPTS) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {status === 'loading' && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 font-medium">تم الربط بنجاح!</p>
                <p className="text-sm text-green-600">• تم حفظ المتجر في قاعدة البيانات</p>
                <p className="text-sm text-green-600">• تم التحقق من صحة الرمز</p>
                <p className="text-sm text-green-600">• المتجر جاهز للاستخدام</p>
              </div>
              <Button onClick={goToDashboard} className="w-full">
                الذهاب إلى لوحة التحكم
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-2">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 font-medium">خطأ في الربط</p>
                <p className="text-sm text-red-600">
                  {verificationAttempts > 0 ? 
                    `فشل التحقق بعد ${verificationAttempts} محاولة` : 
                    'فشل في معالجة الطلب'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={retryVerification} variant="outline" className="flex-1">
                  إعادة التحقق
                </Button>
                <Button onClick={goToConnect} className="flex-1">
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          )}
          
          {/* معلومات التصحيح */}
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">معلومات التصحيح</summary>
            <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyCallback;
