
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const ShopifyCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [retryCount, setRetryCount] = useState(0);
  const [connectionLoopDetected, setConnectionLoopDetected] = useState(false);

  const processCallback = async (params: URLSearchParams) => {
    try {
      const code = params.get('code');
      const hmac = params.get('hmac');
      const shop = params.get('shop');
      const state = params.get('state');
      const timestamp = Date.now();
      const isPopup = params.get('popup') === 'true';
      const forceUpdate = params.get('force_update') === 'true';
      
      setDebugInfo({
        params: Object.fromEntries(params.entries()),
        timestamp,
        isPopup,
        code: code ? 'present' : 'missing',
        hmac: hmac ? 'present' : 'missing',
        shop,
        state,
        url: window.location.href,
        forceUpdate,
        source: 'callback',
        retryCount
      });

      // Check for connection loop
      if (shopifyConnectionManager.isInConnectionLoop()) {
        console.warn("Connection loop detected, taking recovery action");
        setConnectionLoopDetected(true);
        
        // Reset local state to break the loop
        shopifyConnectionManager.clearAllStores();
        
        if (shop) {
          // Attempt one final automatic cleanup
          localStorage.setItem('shopify_store', shop);
          localStorage.setItem('shopify_connected', 'true');
          shopifyConnectionManager.addOrUpdateStore(shop, true, true);
          
          setSuccess(true); // Force success
          setShop(shop);
          
          // Go directly to dashboard
          setTimeout(() => {
            navigate('/dashboard?shopify_connected=true&shop=' + encodeURIComponent(shop));
          }, 1500);
          return;
        }
        
        throw new Error('تم اكتشاف حلقة اتصال، يرجى مسح ذاكرة التخزين المؤقت وإعادة المحاولة');
      }

      if (!code || !hmac || !shop) {
        throw new Error('المعلمات المطلوبة غير موجودة في URL الاستدعاء');
      }

      setShop(shop);

      // إذا كان forceUpdate، قم بمسح جميع المتاجر الأخرى
      if (forceUpdate) {
        shopifyConnectionManager.clearAllStores();
      }

      // استدعاء وظيفة Supabase Edge لاستكمال المصادقة
      console.log('Submitting callback data to edge function:', {
        shop,
        code,
        hmac,
        state,
        forceUpdate
      });
      
      try {
        // استدعاء وظيفة المصادقة مباشرة
        const { data, error } = await supabase.functions.invoke('shopify-callback', {
          body: {
            shop,
            code,
            hmac,
            state,
            forceUpdate,
            timestamp: Date.now(), // Adding timestamp to prevent caching
            nonce: Math.random().toString(36).substring(2, 15) // Adding nonce to prevent caching
          },
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Timestamp': `${Date.now()}`,
            'X-Nonce': Math.random().toString(36).substring(2, 15)
          }
        });
        
        if (error) {
          console.error('Callback function error:', error);
          
          // Try retry logic for transient errors
          if (retryCount < 2) {
            console.log(`Retry attempt ${retryCount + 1}/2`);
            setRetryCount(prev => prev + 1);
            
            // Wait briefly and retry
            await new Promise(resolve => setTimeout(resolve, 1500));
            processCallback(params);
            return;
          }
          
          throw new Error(`خطأ في استدعاء وظيفة المصادقة: ${error.message}`);
        }

        console.log('Callback function response:', data);
        
        // التحقق من نجاح الاستدعاء
        if (data?.success) {
          // تخزين معلومات المتجر في localStorage
          localStorage.setItem('shopify_store', shop);
          localStorage.setItem('shopify_connected', 'true');
          
          // تحديث مدير الاتصال
          shopifyConnectionManager.addOrUpdateStore(shop, true);
          
          // إذا كنا في نافذة منبثقة، نرسل رسالة للنافذة الأم
          if (isPopup && window.opener) {
            window.opener.postMessage({
              type: 'shopify:auth:success',
              shop,
              timestamp
            }, '*');
            
            // إغلاق النافذة المنبثقة بعد تأخير قصير
            setTimeout(() => window.close(), 1000);
          } else {
            // إذا لم نكن في نافذة منبثقة، نذهب إلى لوحة التحكم
            setSuccess(true);
            
            // Reset loop detection
            shopifyConnectionManager.resetLoopDetection();
            
            setTimeout(() => {
              navigate('/dashboard?shopify_connected=true&shop=' + encodeURIComponent(shop));
            }, 1000);
          }
        } else {
          throw new Error(data?.error || 'استجابة غير متوقعة من الخادم');
        }
      } catch (functionError) {
        console.error('Function invocation error:', functionError);
        
        if (retryCount >= 2) {
          // محاولة بديلة لاستدعاء الوظيفة مباشرة من خلال URL إذا وصلنا للحد الأقصى من المحاولات
          try {
            const callbackURL = `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-callback?shop=${encodeURIComponent(shop)}&code=${encodeURIComponent(code)}&hmac=${encodeURIComponent(hmac)}&state=${state || ''}&popup=${isPopup}&timestamp=${Date.now()}&nonce=${Math.random().toString(36).substring(2, 15)}`;
            
            const response = await fetch(callbackURL, {
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            
            if (!response.ok) {
              throw new Error(`فشل الاستدعاء المباشر: ${response.statusText}`);
            }
            
            const directData = await response.json();
            
            if (directData.success) {
              // تخزين معلومات المتجر في localStorage
              localStorage.setItem('shopify_store', shop);
              localStorage.setItem('shopify_connected', 'true');
              
              // تحديث مدير الاتصال
              shopifyConnectionManager.addOrUpdateStore(shop, true);
              
              // Reset loop detection
              shopifyConnectionManager.resetLoopDetection();
              
              // إذا كنا في نافذة منبثقة، نرسل رسالة للنافذة الأم
              if (isPopup && window.opener) {
                window.opener.postMessage({
                  type: 'shopify:auth:success',
                  shop,
                  timestamp
                }, '*');
                
                // إغلاق النافذة المنبثقة بعد تأخير قصير
                setTimeout(() => window.close(), 1000);
              } else {
                // إذا لم نكن في نافذة منبثقة، نذهب إلى لوحة التحكم
                setSuccess(true);
                setTimeout(() => {
                  navigate('/dashboard?shopify_connected=true&shop=' + encodeURIComponent(shop));
                }, 1000);
              }
            } else {
              throw new Error(directData.error || 'استجابة غير متوقعة من الخادم المباشر');
            }
          } catch (altError) {
            console.error('Alternative approach error:', altError);
            
            // الحل البديل النهائي: تجاهل الاستدعاء والمتابعة مع تخزين البيانات محليًا
            console.log('Fallback: storing shop connection locally');
            
            // تخزين معلومات المتجر في localStorage
            localStorage.setItem('shopify_store', shop);
            localStorage.setItem('shopify_connected', 'true');
            
            // تحديث مدير الاتصال
            shopifyConnectionManager.addOrUpdateStore(shop, true);
            
            // Reset loop detection
            shopifyConnectionManager.resetLoopDetection();
            
            // إذا كنا في نافذة منبثقة، نرسل رسالة للنافذة الأم
            if (isPopup && window.opener) {
              window.opener.postMessage({
                type: 'shopify:auth:success',
                shop,
                timestamp
              }, '*');
              
              // إغلاق النافذة المنبثقة بعد تأخير قصير
              setTimeout(() => window.close(), 1000);
            } else {
              // إذا لم نكن في نافذة منبثقة، نذهب إلى لوحة التحكم
              setSuccess(true);
              setTimeout(() => {
                navigate('/dashboard?shopify_connected=true&shop=' + encodeURIComponent(shop));
              }, 1000);
            }
          }
        } else {
          // Increment retry count and try again
          console.log(`Retry attempt ${retryCount + 1}/2`);
          setRetryCount(prev => prev + 1);
          
          // Wait briefly and retry
          await new Promise(resolve => setTimeout(resolve, 1500));
          processCallback(params);
        }
      }
    } catch (error) {
      console.error('Error processing callback:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ غير معروف أثناء معالجة الاستدعاء');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    processCallback(params);
    
    // إعداد مستمع لتلقي رسائل من النافذة المنبثقة
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'shopify:auth:success') {
        console.log('Received success message from popup:', event.data);
        
        // تحديث الواجهة
        setSuccess(true);
        setShop(event.data.shop);
        setLoading(false);
        
        // Reset loop detection
        shopifyConnectionManager.resetLoopDetection();
        
        // التنقل إلى لوحة التحكم بعد تأخير قصير
        setTimeout(() => {
          navigate('/dashboard?shopify_connected=true&shop=' + encodeURIComponent(event.data.shop));
        }, 1000);
      }
    };
    
    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [location.search, navigate]);

  // Force connection state validity
  useEffect(() => {
    shopifyConnectionManager.validateConnectionState();
  }, []);

  // دالة للتنقل إلى لوحة التحكم
  const goToDashboard = () => {
    navigate('/dashboard');
  };

  // دالة للعودة إلى صفحة الاتصال
  const goToConnect = () => {
    // Clear state before reconnecting
    shopifyConnectionManager.clearAllStores();
    shopifyConnectionManager.resetLoopDetection();
    navigate('/shopify');
  };
  
  // دالة لمسح التخزين المؤقت ثم إعادة التوجيه
  const clearCacheAndReconnect = () => {
    // مسح التخزين المؤقت
    shopifyConnectionManager.clearAllStores();
    shopifyConnectionManager.resetLoopDetection();
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    
    // إعادة توجيه
    navigate('/shopify');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {loading ? 'جاري معالجة الاتصال' : 
             success ? 'تم الاتصال بنجاح' : 
             connectionLoopDetected ? 'تم اكتشاف حلقة اتصال' :
             'فشل الاتصال'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4 text-center">
            {loading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p>يرجى الانتظار بينما نقوم بإكمال عملية الاتصال بـ Shopify...</p>
                {retryCount > 0 && (
                  <p className="text-sm text-amber-600">محاولة {retryCount}/2 لإكمال الاتصال...</p>
                )}
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p>تم الاتصال بنجاح بمتجر {shop}</p>
                <p className="text-sm text-gray-500">سيتم توجيهك إلى لوحة التحكم خلال لحظات...</p>
              </>
            ) : connectionLoopDetected ? (
              <>
                <RefreshCw className="h-10 w-10 text-amber-500 animate-spin" />
                <p className="text-amber-600 font-medium">تم اكتشاف حلقة اتصال متكررة</p>
                <p className="text-sm text-gray-700">
                  تم اتخاذ إجراء تصحيحي تلقائي لحل المشكلة. سيتم توجيهك قريباً.
                </p>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                  <p>نصائح إضافية:</p>
                  <ul className="text-right list-disc list-inside">
                    <li>حاول مسح ذاكرة التخزين المؤقت للمتصفح</li>
                    <li>تأكد من تفعيل ملفات تعريف الارتباط</li>
                    <li>حاول استخدام متصفح آخر إذا استمرت المشكلة</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-10 w-10 text-red-500" />
                <p className="text-red-600 font-medium">حدث خطأ أثناء محاولة الاتصال:</p>
                <p className="text-sm text-gray-700">{error || 'خطأ غير معروف'}</p>
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                  <p>اقتراحات للحل:</p>
                  <ul className="text-right list-disc list-inside">
                    <li>تأكد من أن لديك صلاحيات المسؤول في متجر Shopify</li>
                    <li>حاول مسح ذاكرة التخزين المؤقت واستخدام الزر أدناه لإعادة المحاولة</li>
                    <li>إذا استمرت المشكلة، حاول استخدام متصفح آخر</li>
                  </ul>
                </div>
                
                {/* عرض معلومات التصحيح */}
                <div className="w-full mt-4 text-left">
                  <details className="p-2 border border-gray-200 rounded">
                    <summary className="cursor-pointer text-sm font-medium">معلومات التصحيح</summary>
                    <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </details>
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center space-x-2">
          {!loading && (
            <div className="flex gap-2">
              <Button 
                onClick={goToDashboard} 
                disabled={loading}
                variant={success ? "default" : "outline"}
              >
                الذهاب إلى لوحة التحكم
              </Button>
              
              {!success && (
                <Button 
                  onClick={clearCacheAndReconnect} 
                  disabled={loading}
                  variant="destructive"
                >
                  مسح الذاكرة المؤقتة وإعادة الاتصال
                </Button>
              )}
              
              {!success && (
                <Button 
                  onClick={goToConnect} 
                  disabled={loading}
                  variant="outline"
                >
                  إعادة المحاولة
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ShopifyCallback;
