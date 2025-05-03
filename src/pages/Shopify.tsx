
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { AlertCircle, ShoppingBag, CheckCircle, ExternalLink, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cleanShopifyDomain } from '@/lib/shopify/types';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';

// مكوّن لعرض معلومات التصحيح
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

// مكوّن لعرض حالة الاتصال
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

// المكوّن الرئيسي
const Shopify = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shop, setShop] = useState<string | null>(null);
  const [shops, setShops] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [authStarted, setAuthStarted] = useState(false);
  const [shopInput, setShopInput] = useState('');
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);

  // فحص معلمات URL وحالة المتاجر عند التحميل
  useEffect(() => {
    // فحص معلمات URL في الموقع الحالي
    const params = new URLSearchParams(location.search);
    const shopParam = params.get("shop");
    const shopifySuccess = params.get("shopify_success");
    const authError = params.get("auth_error");
    
    // الحصول على حالة المتجر من localStorage
    const storedShop = localStorage.getItem('shopify_store');
    const isConnected = localStorage.getItem('shopify_connected') === 'true';
    
    // الحصول على حالة المتجر من مدير الاتصال
    const activeStore = shopifyConnectionManager.getActiveStore();
    const allStores = shopifyConnectionManager.getAllStores();
    
    if (shopParam) {
      setShopInput(shopParam);
    }
    
    // تعيين حالة الاتصال بـ Shopify
    setShopifyConnected(isConnected);
    setShop(activeStore);
    setShops(allStores.map(store => store.domain));
    
    // بيانات لوحة التصحيح
    setDebugInfo({
      currentLocation: location.pathname,
      searchParams: Object.fromEntries(params.entries()),
      shopParam,
      shopifySuccess,
      authError,
      shopifyConnected: isConnected,
      shop: activeStore,
      shops: allStores.map(store => store.domain),
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: {
        shopify_store: storedShop,
        shopify_connected: isConnected ? 'true' : 'false',
        shopify_temp_store: localStorage.getItem('shopify_temp_store'),
        shopify_emergency_mode: localStorage.getItem('shopify_emergency_mode'),
        shopify_active_store: localStorage.getItem('shopify_active_store'),
        shopify_connected_stores: localStorage.getItem('shopify_connected_stores')
      }
    });

    if (shopifySuccess === "true" && shopParam) {
      toast.success(`تم الاتصال بمتجر ${shopParam} بنجاح`);
      navigate('/dashboard');
    }
    
    if (authError) {
      setError(params.get("error") || "حدث خطأ أثناء عملية المصادقة");
    }

    // إعداد مستمع لرسائل النافذة المنبثقة
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'shopify:auth:success') {
        console.log('Received success message from popup:', event.data);
        toast.success(`تم الاتصال بمتجر ${event.data.shop} بنجاح`);
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [location.search, navigate]);

  // دالة للاتصال باستخدام النافذة المنبثقة
  const connectWithPopup = async () => {
    try {
      const cleanedShop = shopInput ? cleanShopifyDomain(shopInput) : '';
      
      if (!cleanedShop) {
        setError('يرجى إدخال اسم متجر Shopify الخاص بك');
        return;
      }
      
      setIsProcessing(true);
      setError(null);
      
      // تخزين نطاق المتجر مؤقتًا للصفحة المعاد توجيهها
      localStorage.setItem('shopify_temp_store', cleanedShop);
      
      try {
        // استدعاء دالة Supabase Edge Function مباشرة
        const { data, error } = await supabase.functions.invoke('shopify-auth', {
          body: { shop: cleanedShop },
        });
        
        if (error) {
          throw new Error(`خطأ في استدعاء دالة المصادقة: ${error.message}`);
        }
        
        setApiResponse(data);
        console.log('API response:', data);
        
        if (!data?.redirect) {
          throw new Error('لم يتم استلام عنوان URL للمصادقة من الخادم');
        }
        
        // فتح نافذة منبثقة
        const width = 800;
        const height = 600;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        const popup = window.open(
          data.redirect,
          'ShopifyAuth',
          `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
        );
        
        if (popup) {
          setPopupWindow(popup);
          setAuthStarted(true);
          
          // التحقق من إغلاق النافذة المنبثقة
          const checkPopup = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkPopup);
              setIsProcessing(false);
              
              // التحقق مما إذا كان الاتصال ناجحًا بعد إغلاق النافذة المنبثقة
              const connected = localStorage.getItem('shopify_connected');
              const storeUrl = localStorage.getItem('shopify_store');
              
              if (connected === 'true' && storeUrl) {
                toast.success(`تم الاتصال بمتجر ${storeUrl} بنجاح`);
                window.location.reload();
              } else {
                setError('تم إغلاق نافذة المصادقة قبل إكمال العملية');
              }
            }
          }, 500);
        } else {
          setError('تم حظر النوافذ المنبثقة من قبل المتصفح. يرجى السماح بها وإعادة المحاولة.');
          setIsProcessing(false);
        }
      } catch (e) {
        console.error('خطأ في استدعاء API:', e);
        
        // الرجوع إلى استخدام URL المباشر إذا فشل استدعاء الدالة
        try {
          // محاولة استدعاء مباشر
          const authResponse = await fetch(
            `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?shop=${encodeURIComponent(cleanedShop)}&_t=${Date.now()}`, 
            { method: 'GET' }
          );
          
          if (!authResponse.ok) {
            throw new Error(`فشل استدعاء API: ${authResponse.statusText}`);
          }
          
          const authData = await authResponse.json();
          
          if (authData.redirect) {
            const popup = window.open(
              authData.redirect,
              'ShopifyAuth',
              `width=800,height=600,top=${(window.innerHeight - 600) / 2},left=${(window.innerWidth - 800) / 2},resizable=yes,scrollbars=yes,status=yes`
            );
            
            if (popup) {
              setPopupWindow(popup);
              setAuthStarted(true);
              
              // التحقق من إغلاق النافذة المنبثقة
              const checkPopup = setInterval(() => {
                if (popup.closed) {
                  clearInterval(checkPopup);
                  setIsProcessing(false);
                  
                  // التحقق مما إذا كان الاتصال ناجحًا بعد إغلاق النافذة المنبثقة
                  setTimeout(() => {
                    const connected = localStorage.getItem('shopify_connected');
                    const storeUrl = localStorage.getItem('shopify_store');
                    
                    if (connected === 'true' && storeUrl) {
                      toast.success(`تم الاتصال بمتجر ${storeUrl} بنجاح`);
                      window.location.reload();
                    } else {
                      setError('تم إغلاق نافذة المصادقة قبل إكمال العملية');
                    }
                  }, 500);
                }
              }, 500);
            } else {
              setError('تم حظر النوافذ المنبثقة من قبل المتصفح. يرجى السماح بها وإعادة المحاولة.');
              setIsProcessing(false);
            }
          } else {
            throw new Error("لم يتم استلام عنوان URL للمصادقة");
          }
        } catch (directError) {
          console.error("فشل النهج المباشر:", directError);
          
          // استخدام كخطة احتياطية نهائية
          window.location.href = `/shopify-redirect?shop=${encodeURIComponent(cleanedShop)}&_t=${Date.now()}`;
        }
      }
    } catch (e) {
      console.error('خطأ في بدء عملية المصادقة:', e);
      setError(e instanceof Error ? e.message : 'حدث خطأ أثناء بدء عملية المصادقة');
      setIsProcessing(false);
    }
  };
  
  // دالة لإعادة التوجيه إلى صفحة كاملة للمصادقة
  const connectDirectly = () => {
    try {
      const cleanedShop = shopInput ? cleanShopifyDomain(shopInput) : '';
      
      if (!cleanedShop) {
        setError('يرجى إدخال اسم متجر Shopify الخاص بك');
        return;
      }
      
      setIsProcessing(true);
      setError(null);
      
      // تخزين نطاق المتجر مؤقتًا
      localStorage.setItem('shopify_temp_store', cleanedShop);
      
      // التنقل إلى صفحة إعادة التوجيه مع معلمة المتجر
      navigate(`/shopify-redirect?shop=${encodeURIComponent(cleanedShop)}&_t=${Date.now()}`);
    } catch (e) {
      console.error('خطأ في بدء عملية المصادقة:', e);
      setError(e instanceof Error ? e.message : 'حدث خطأ أثناء بدء عملية المصادقة');
      setIsProcessing(false);
    }
  };

  // العودة إلى لوحة التحكم
  const returnToDashboard = () => {
    navigate('/dashboard');
  };
  
  // تجربة المصادقة المباشرة مع نقطة نهاية الخادم
  const tryServerAuth = () => {
    try {
      const cleanedShop = shopInput ? cleanShopifyDomain(shopInput) : '';
      
      if (!cleanedShop) {
        setError('يرجى إدخال اسم متجر Shopify الخاص بك');
        return;
      }
      
      setIsProcessing(true);
      setError(null);
      
      // رابط مباشر إلى نقطة نهاية Remix auth
      window.location.href = `/auth?shop=${encodeURIComponent(cleanedShop)}&timestamp=${Date.now()}`;
    } catch (e) {
      console.error('خطأ في بدء عملية المصادقة المباشرة:', e);
      setError(e instanceof Error ? e.message : 'حدث خطأ أثناء بدء عملية المصادقة');
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4" dir="rtl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {language === 'ar' ? 'تكامل Shopify' : 'Shopify Integration'}
        </h1>
        <p className="text-gray-600">
          {language === 'ar' 
            ? 'قم بربط متجرك على Shopify لاستخدام كافة ميزات النظام' 
            : 'Connect your Shopify store to use all features'}
        </p>
      </div>
      
      <ConnectionStatus 
        isConnected={shopifyConnected} 
        shop={shop} 
        onReturn={returnToDashboard}
      />
      
      <Card className="overflow-hidden">
        <div className="p-6 text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-purple-100 rounded-full">
              <Store className="h-12 w-12 text-purple-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            {language === 'ar' ? 'ربط متجر Shopify' : 'Connect Shopify Store'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {language === 'ar' 
              ? 'قم بربط متجرك على Shopify لاستخدام جميع ميزات تكامل نماذج الدفع عند الاستلام' 
              : 'Connect your Shopify store to use all the Cash on Delivery form integration features'}
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4 mx-auto max-w-md">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 ml-2 text-red-500" />
                <p>{error}</p>
              </div>
            </div>
          )}
          
          <div className="mb-4 mx-auto max-w-md">
            <label className="block text-sm font-medium mb-1 text-right">
              {language === 'ar' ? 'أدخل نطاق متجرك على Shopify' : 'Enter your Shopify store domain'}
            </label>
            <input 
              type="text" 
              value={shopInput}
              onChange={(e) => setShopInput(e.target.value)}
              placeholder="your-store.myshopify.com"
              className="w-full p-3 border border-gray-300 rounded-md mb-4"
              disabled={isProcessing}
            />
          </div>
          
          <div className="space-y-3 mx-auto max-w-md">
            <Button 
              className="w-full" 
              onClick={connectWithPopup}
              disabled={isProcessing || !shopInput}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                </span>
              ) : (
                language === 'ar' ? 'الاتصال بواسطة النافذة المنبثقة' : 'Connect with Popup'
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={connectDirectly}
              disabled={isProcessing || !shopInput}
            >
              {language === 'ar' ? 'الاتصال المباشر (صفحة كاملة)' : 'Direct Connect (Full Page)'}
            </Button>
            
            <div className="pt-2 border-t border-gray-200">
              <Button 
                variant="ghost" 
                onClick={tryServerAuth}
                className="w-full text-blue-600 hover:text-blue-700"
                disabled={isProcessing || !shopInput}
              >
                {language === 'ar' ? 'جرّب الاتصال باستخدام Node.js' : 'Try Connect Using Node.js'}
              </Button>
            </div>
            
            <Button 
              variant="link" 
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Debug information */}
      <DebugPanel data={{
        ...debugInfo,
        apiResponse,
        window: {
          location: window.location.href,
          opener: window.opener ? 'exists' : 'none'
        }
      }} />
    </div>
  );
};

export default Shopify;
