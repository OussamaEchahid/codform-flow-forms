import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { AlertCircle, ShoppingBag, CheckCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Store } from 'lucide-react';

// تنظيف نطاق المتجر
function cleanShopDomain(shop: string): string {
  let cleanedShop = shop.trim();
  
  // إزالة البروتوكول إذا كان موجودًا
  if (cleanedShop.startsWith('http')) {
    try {
      const url = new URL(cleanedShop);
      cleanedShop = url.hostname;
      console.log("تنظيف عنوان متجر:", cleanedShop);
    } catch (e) {
      console.error("خطأ في تنظيف عنوان URL للمتجر:", e);
    }
  }
  
  // التأكد من أنه ينتهي بـ myshopify.com
  if (!cleanedShop.endsWith('myshopify.com')) {
    if (!cleanedShop.includes('.')) {
      cleanedShop = `${cleanedShop}.myshopify.com`;
      console.log("إضافة .myshopify.com للمتجر:", cleanedShop);
    }
  }
  
  return cleanedShop;
}

const DebugPanel = ({ data }: { data: any }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="mt-4 border rounded-md overflow-hidden">
      <div 
        className="bg-gray-100 p-2 flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <p className="text-sm font-bold">معلومات التصحيح</p>
        <Button variant="ghost" size="sm">{expanded ? 'إخفاء' : 'عرض'}</Button>
      </div>
      {expanded && (
        <div className="p-4 bg-gray-50 text-xs overflow-auto max-h-72">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

const ConnectionStatus = ({ 
  isConnected, 
  shop, 
  onReturn 
}: { 
  isConnected: boolean, 
  shop?: string, 
  onReturn: () => void 
}) => {
  const { language } = useI18n();
  
  if (isConnected && shop) {
    return (
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">
              {language === 'ar' ? 'متصل بنجاح' : 'Successfully Connected'}
            </h3>
            <p className="text-gray-700 mb-2">
              {language === 'ar' 
                ? `أنت متصل بمتجر: ${shop}` 
                : `You are connected to store: ${shop}`}
            </p>
            <Button 
              variant="outline" 
              onClick={onReturn}
            >
              {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }
  
  return null;
};

const Shopify = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { shopifyConnected, shop, shops } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [authStarted, setAuthStarted] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // التحقق من وجود متجر Shopify في Supabase
        const { data: shopifyStore, error } = await supabase
          .rpc('get_user_shop')
          .single();

        if (shopifyStore) {
          // تم العثور على المتجر، تحديث localStorage
          localStorage.setItem('shopify_store', shopifyStore);
          localStorage.setItem('shopify_connected', 'true');
          setDebugInfo(prev => ({ ...prev, shopifyStore }));
        }

        // التحقق من معلمات URL
        const params = new URLSearchParams(location.search);
        const shopParam = params.get("shop");
        const shopifySuccess = params.get("shopify_success");

        if (shopifySuccess === "true" && shopParam) {
          toast.success(`تم الاتصال بمتجر ${shopParam} بنجاح`);
          localStorage.setItem('shopify_store', shopParam);
          localStorage.setItem('shopify_connected', 'true');
          navigate('/dashboard');
        }
      } catch (err) {
        console.error("خطأ في التحقق من المصادقة:", err);
      }
    };

    checkAuth();
  }, [location.search, navigate]);

  // إضافة تحقق للنافذة المنبثقة
  useEffect(() => {
    if (popupWindow && popupWindow.closed) {
      console.log("تم إغلاق النافذة المنبثقة");
      setIsProcessing(false);
      
      // تحقق من localStorage بعد إغلاق النافذة المنبثقة
      const connected = localStorage.getItem('shopify_connected');
      const storeUrl = localStorage.getItem('shopify_store');
      
      if (connected === 'true' && storeUrl) {
        toast.success(`تم الاتصال بمتجر ${storeUrl} بنجاح`);
        navigate('/dashboard');
      } else {
        setError('تم إغلاق نافذة المصادقة قبل إكمال العملية. يرجى المحاولة مرة أخرى.');
      }
      
      setPopupWindow(null);
    }
    
    // تحقق كل ثانية من حالة النافذة المنبثقة
    const checkPopupInterval = popupWindow ? setInterval(() => {
      if (popupWindow.closed) {
        clearInterval(checkPopupInterval);
        setIsProcessing(false);
        setPopupWindow(null);
        
        // تحقق من localStorage مرة أخرى
        const connected = localStorage.getItem('shopify_connected');
        const storeUrl = localStorage.getItem('shopify_store');
        
        if (connected === 'true' && storeUrl) {
          toast.success(`تم الاتصال بمتجر ${storeUrl} بنجاح`);
          navigate('/dashboard');
        }
      }
    }, 1000) : null;
    
    return () => {
      if (checkPopupInterval) clearInterval(checkPopupInterval);
    };
  }, [popupWindow, navigate]);

  const handleConnectShopify = async () => {
    // طلب تحسين: استخدام طريقة عارض بدلاً من prompt 
    let shopDomain = window.prompt(
      language === 'ar' 
        ? "أدخل دومين متجر Shopify الخاص بك (مثال: your-store.myshopify.com)"
        : "Enter your Shopify store domain (example: your-store.myshopify.com)"
    );
    
    if (!shopDomain) return;
    
    try {
      setIsProcessing(true);
      setAuthStarted(true);
      setError(null);
      
      // تنظيف عنوان URL للمتجر من أي بروتوكولات
      shopDomain = cleanShopDomain(shopDomain);
      
      const response = await fetch(
        `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?shop=${encodeURIComponent(shopDomain)}`, 
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error(`فشل الطلب برمز الحالة ${response.status}`);
      }
      
      const data = await response.json();
      setDebugInfo({ response: data, shopDomain });
      
      if (data.redirect) {
        // تخزين المعلومات المؤقتة
        localStorage.setItem('shopify_temp_store', shopDomain);
        
        console.log("إعادة التوجيه إلى مصادقة Shopify:", data.redirect);
        
        // تحسين فتح النافذة المنبثقة
        const width = 1000;
        const height = 800;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        // فتح النافذة المنبثقة مع المزيد من الخيارات
        const popup = window.open(
          data.redirect,
          "ShopifyAuth", 
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
        );
        
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // فشل في فتح النافذة المنبثقة
          setError("تم حظر النوافذ المنبثقة. الرجاء السماح بالنوافذ المنبثقة وإعادة المحاولة.");
          setIsProcessing(false);
          
          // يمكن محاولة الفتح التلقائي مرة أخرى بعد إخبار المستخدم
          setTimeout(() => {
            const confirmRetry = window.confirm("تم حظر النوافذ المنبثقة. هل تريد المحاولة مرة أخرى؟ تأكد من السماح بالنوافذ المنبثقة في متصفحك.");
            if (confirmRetry) {
              // محاولة فتح النافذة مرة أخرى
              const retryPopup = window.open(
                data.redirect,
                "ShopifyAuth", 
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
              );
              
              if (retryPopup) {
                setPopupWindow(retryPopup);
                retryPopup.focus();
              } else {
                // إذا فشلت المحاولة الثانية، اقترح الاتصال المباشر
                setError("لا يزال يتم حظر النوافذ المنبثقة. يرجى استخدام خيار 'الاتصال المباشر' بدلاً من ذلك.");
              }
            }
          }, 500);
        } else {
          // تم فتح النافذة المنبثقة بنجاح
          setPopupWindow(popup);
          // محاولة تركيز النافذة المنبثقة
          popup.focus();
        }
      } else if (data.error) {
        setError(data.error);
        toast.error(data.error);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("خطأ في بدء مصادقة Shopify:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الاتصال بـ Shopify");
      toast.error("فشل الاتصال بـ Shopify. يرجى المحاولة مرة أخرى.");
      setIsProcessing(false);
    }
  };

  // طريقة بديلة للاتصال بدون نافذة منبثقة
  const handleDirectConnect = () => {
    let shopDomain = window.prompt(
      language === 'ar' 
        ? "أدخل دومين متجر Shopify الخاص بك (مثال: your-store.myshopify.com)"
        : "Enter your Shopify store domain (example: your-store.myshopify.com)"
    );
    
    if (!shopDomain) return;
    
    try {
      setIsProcessing(true);
      setAuthStarted(true);
      setError(null);
      
      // تنظيف عنوان URL للمتجر
      shopDomain = cleanShopDomain(shopDomain);
      console.log("تم تنظيف عنوان المتجر:", shopDomain);
      
      // تخزين معلومات المتجر مؤقتًا
      localStorage.setItem('shopify_temp_store', shopDomain);
      
      // توجيه مباشر إلى ShopifyRedirect بدلاً من Auth مباشرة
      const redirectUrl = `/shopify-redirect?shop=${encodeURIComponent(shopDomain)}&_t=${Date.now()}`;
      console.log("التوجيه مباشرة إلى:", redirectUrl);
      
      // توجيه مباشر بدون نافذة منبثقة
      navigate(redirectUrl);
    } catch (err) {
      console.error("خطأ أثناء الاتصال المباشر:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الاتصال المباشر");
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex-1 p-8">
        <div className="max-w-[800px] mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => navigate('/dashboard')}
          >
            {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
          </Button>
          
          <h1 className="text-3xl font-bold mb-6">
            {language === 'ar' ? 'تكامل متجر Shopify' : 'Shopify Integration'}
          </h1>
          
          {/* إضافة زر للوصول إلى صفحة إدارة المتاجر إذا كان لديه متاجر متصلة */}
          {shops && shops.length > 0 && (
            <div className="mb-6">
              <Button 
                variant="outline"
                onClick={() => navigate('/shopify-stores')}
                className="flex items-center gap-1"
              >
                <Store className="h-4 w-4" />
                {language === 'ar' ? 'إدارة المتاجر المتصلة' : 'Manage Connected Stores'}
                <span className="inline-flex items-center justify-center rounded-full bg-purple-100 text-purple-800 px-2 py-1 text-xs ml-2">
                  {shops.length}
                </span>
              </Button>
            </div>
          )}
          
          {isProcessing && (
            <Card className="p-6 mb-6 border-purple-300 bg-purple-50">
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
                <div>
                  <h3 className="text-xl font-bold">
                    {language === 'ar' ? 'جاري التوجيه...' : 'Redirecting...'}
                  </h3>
                  <p className="text-gray-600">
                    {language === 'ar' ? 'جاري بدء عملية المصادقة مع متجر Shopify...' : 'Starting authentication process with Shopify...'}
                  </p>
                </div>
              </div>
              <DebugPanel data={debugInfo} />
            </Card>
          )}
          
          {error && (
            <Card className="p-6 mb-6 border-red-300 bg-red-50">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="text-xl font-bold">
                    {language === 'ar' ? 'خطأ' : 'Error'}
                  </h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
              <DebugPanel data={debugInfo} />
            </Card>
          )}
          
          <ConnectionStatus 
            isConnected={!!shopifyConnected} 
            shop={shop} 
            onReturn={() => navigate('/dashboard')}
          />
          
          {!shopifyConnected && (
            <Card className="p-6">
              <div className="flex flex-col items-center text-center p-4">
                <div className="p-4 bg-[#F4F1FE] rounded-full mb-4">
                  <ShoppingBag className="h-12 w-12 text-purple-600" />
                </div>
                
                <h2 className="text-2xl font-bold mb-2">
                  {language === 'ar' ? 'اتصل بمتجر Shopify' : 'Connect Shopify Store'}
                </h2>
                
                <p className="text-gray-600 mb-6 max-w-md">
                  {language === 'ar' 
                    ? 'قم بتوصيل متجر Shopify الخاص بك للاستفادة من ميزات تكامل نماذج الدفع عند الاستلام'
                    : 'Connect your Shopify store to use all the features of the COD form integration'
                  }
                </p>
                
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <Button 
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleConnectShopify}
                    disabled={isProcessing}
                  >
                    {isProcessing 
                      ? (language === 'ar' ? 'جارٍ الاتصال...' : 'Connecting...') 
                      : (language === 'ar' ? 'اتصل بـ Shopify (نافذة منبثقة)' : 'Connect with Popup')}
                  </Button>
                  
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-purple-300"
                    onClick={handleDirectConnect}
                    disabled={isProcessing}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'اتصل مباشرة (صفحة كاملة)' : 'Direct Connect (Full Page)'}
                  </Button>
                </div>
                
                {authStarted && !isProcessing && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-amber-700">
                      {language === 'ar'
                        ? 'تم بدء عملية المصادقة. إذا لم يتم إعادة توجيهك تلقائيًا، يرجى التحقق من النافذة المنبثقة أو تجربة خيار الاتصال المباشر.'
                        : 'Authentication process started. If you were not redirected automatically, please check for popup windows or try the direct connect option.'}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
          
          <Card className="p-6 mt-8">
            <h3 className="text-xl font-bold mb-4">
              {language === 'ar' ? 'تعليمات الاتصال' : 'Connection Instructions'}
            </h3>
            
            <div className="space-y-4 text-gray-700">
              <p>
                {language === 'ar' 
                  ? '1. انقر على زر "اتصل بـ Shopify" أعلاه'
                  : '1. Click the "Connect to Shopify" button above'
                }
              </p>
              <p>
                {language === 'ar'
                  ? '2. أدخل دومين متجر Shopify الخاص بك (مثال: your-store.myshopify.com)'
                  : '2. Enter your Shopify store domain (example: your-store.myshopify.com)'
                }
              </p>
              <p>
                {language === 'ar'
                  ? '3. قم بتسجيل الدخول إلى حسابك في Shopify إذا طُلب منك ذلك'
                  : '3. Log in to your Shopify account if prompted'
                }
              </p>
              <p>
                {language === 'ar'
                  ? '4. وافق على أذونات التطبيق للسماح بالوصول إلى متجرك'
                  : '4. Approve the app permissions to allow access to your store'
                }
              </p>
              <p>
                {language === 'ar'
                  ? '5. ستتم إعادة توجيهك تلقائياً إلى لوحة التحكم'
                  : '5. You will be automatically redirected back to the dashboard'
                }
              </p>
            </div>
          </Card>
          
          <Card className="p-6 mt-8 bg-yellow-50 border-yellow-200">
            <h3 className="text-xl font-bold mb-4">
              {language === 'ar' ? 'استكشاف الأخطاء وإصلاحها' : 'Troubleshooting'}
            </h3>
            
            <div className="space-y-4 text-gray-700">
              <p>
                {language === 'ar' 
                  ? 'إذا واجهت مشكلات في الاتصال، تحقق مما يلي:'
                  : 'If you encounter connection issues, check the following:'}
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  {language === 'ar'
                    ? 'تأكد من أن متجر Shopify الخاص بك نشط ومتاح'
                    : 'Make sure your Shopify store is active and accessible'}
                </li>
                <li>
                  {language === 'ar'
                    ? 'تحقق من السماح بالنوافذ المنبثقة في متصفحك'
                    : 'Ensure popups are allowed in your browser'}
                </li>
                <li>
                  {language === 'ar'
                    ? 'إذا لم تعمل النافذة المنبثقة، جرب خيار "الاتصال المباشر" بدلاً من ذلك'
                    : 'If popup windows do not work, try the "Direct Connect" option instead'}
                </li>
                <li>
                  {language === 'ar'
                    ? 'حاول مسح ذاكرة التخزين المؤقت للمتصفح وملفات تعريف الارتباط'
                    : 'Try clearing your browser cache and cookies'}
                </li>
                <li>
                  {language === 'ar'
                    ? 'تحقق من سجل وحدة التحكم في المتصفح للحصول على أي أخطاء'
                    : 'Check your browser console for any errors'}
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Shopify;
