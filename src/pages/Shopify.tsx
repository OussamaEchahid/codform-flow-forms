
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, ShoppingBag, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { ShopifyDebugPanel } from '@/components/shopify/ShopifyDebugPanel';
import { supabase } from '@/integrations/supabase/client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

const Shopify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnecting, setIsConnecting] = useState(false);
  const [shopInput, setShopInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV !== 'production');
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState<number>(0);
  const { user, shop: connectedShop, shopifyConnected, setShop } = useAuth();
  const [tokenRenewalRequired, setTokenRenewalRequired] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  
  // حفظ عنوان URL للعودة إذا كان قادماً من صفحة أخرى
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const returnTo = params.get('returnTo');
    
    if (returnTo) {
      setReturnUrl(returnTo);
      
      // تخزين عنوان العودة في localStorage للاستخدام بعد المصادقة
      localStorage.setItem('shopify_return_url', returnTo);
    } else {
      // استرجاع عنوان العودة من localStorage إذا كان موجوداً
      const savedReturnUrl = localStorage.getItem('shopify_return_url');
      if (savedReturnUrl) {
        setReturnUrl(savedReturnUrl);
      }
    }
    
    // التحقق من وجود طلب تجديد الرمز
    const tokenRenewal = params.get('token_renewal') === 'required';
    if (tokenRenewal) {
      setTokenRenewalRequired(true);
      toast.warning('يجب تجديد اتصال متجر Shopify للمتابعة');
    }
  }, [location.search]);

  // تحقق من وجود إعادة توجيه بعد الاتصال
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopifyConnected = params.get('shopify_connected') === 'true';
    const shopDomain = params.get('shop');
    const authSuccess = params.get('auth_success') === 'true';
    const authError = params.get('auth_error') === 'true';
    const errorMessage = params.get('error');
    const tokenRenewed = params.get('token_renewed') === 'true';
    
    if (shopifyConnected && shopDomain) {
      // حفظ متجر Shopify في localStorage لضمان الاتساق
      localStorage.setItem('shopify_store', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.setItem('shopify_last_connected', Date.now().toString());
      
      // إضافة المتجر إلى مدير الاتصال
      shopifyConnectionManager.addOrUpdateStore(shopDomain, true);
      
      // تعيين المتجر في سياق المصادقة
      if (setShop) {
        setShop(shopDomain);
      }
      
      // عرض رسالة نجاح
      if (tokenRenewed) {
        toast.success('تم تجديد اتصال متجر Shopify بنجاح');
      } else {
        toast.success('تم الاتصال بمتجر Shopify بنجاح');
      }
      
      // التحقق من وجود عنوان URL للعودة
      const returnTo = localStorage.getItem('shopify_return_url');
      if (returnTo) {
        // إزالة عنوان العودة من localStorage
        localStorage.removeItem('shopify_return_url');
        
        // إضافة معلمة نجاح الاتصال إلى عنوان العودة
        const returnUrl = new URL(returnTo, window.location.origin);
        returnUrl.searchParams.append('shopify_connected', 'true');
        returnUrl.searchParams.append('shop', shopDomain);
        
        // العودة إلى الصفحة الأصلية
        setTimeout(() => {
          navigate(returnUrl.pathname + returnUrl.search);
        }, 500);
      } else {
        // إعادة التوجيه إلى لوحة التحكم
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      }
    }
    
    if (authError && errorMessage) {
      toast.error(`خطأ في المصادقة: ${errorMessage}`);
    }
  }, [navigate, setShop]);

  // استخلاص معلمة متجر من URL إن وجدت
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get('shop');
    
    if (shopParam) {
      setShopInput(shopParam);
      
      // تخزين المتجر مؤقتاً للاستخدام لاحقاً
      localStorage.setItem('shopify_temp_store', shopParam);
    } else if (connectedShop) {
      // استخدام المتجر المتصل حالياً إذا كان موجوداً
      setShopInput(connectedShop);
    } else {
      // استرجاع المتجر المحفوظ إذا كان موجوداً
      const activeStore = shopifyConnectionManager.getActiveStore();
      if (activeStore) {
        setShopInput(activeStore);
      }
    }
  }, [connectedShop]);

  const handleConnectShopify = async () => {
    // التحقق من وجود عنوان متجر
    let shop = shopInput.trim();
    
    if (!shop) {
      setErrorMessage('يرجى إدخال عنوان متجر Shopify الخاص بك');
      return;
    }
    
    // تجنب المحاولات المتكررة في فترة قصيرة
    const now = Date.now();
    if (now - lastConnectionAttempt < 5000) {
      toast.warning('يرجى الانتظار قليلاً قبل المحاولة مرة أخرى');
      return;
    }
    
    setLastConnectionAttempt(now);
    
    // تنظيف عنوان المتجر وإضافة .myshopify.com إذا لزم الأمر
    if (!shop.includes('.myshopify.com')) {
      shop = `${shop}.myshopify.com`;
    }
    
    // إزالة البروتوكول إذا كان موجوداً
    shop = shop.replace(/^https?:\/\//, '');
    
    setIsConnecting(true);
    setErrorMessage(null);
    
    try {
      // مسح البيانات القديمة لضمان تجربة اتصال نظيفة
      localStorage.removeItem('shopify_force_refresh');
      localStorage.removeItem('shopify_last_token_check');
      
      // تخزين المتجر مؤقتًا للاستخدام أثناء عملية المصادقة
      localStorage.setItem('shopify_temp_store', shop);
      shopifyConnectionManager.saveLastUrlShop(shop);
      
      // استدعاء وظيفة Supabase Edge Function لبدء المصادقة
      const { data, error } = await supabase.functions.invoke('shopify-auth', {
        body: { 
          shop,
          // إعادة المصادقة إذا كان المستخدم يحاول إعادة الاتصال بمتجر موجود بالفعل
          forceUpdate: shopifyConnected && connectedShop === shop,
          timestamp: Date.now(),
          returnUrl: returnUrl || undefined
        },
      });
      
      if (error) {
        throw new Error(`فشل بدء المصادقة: ${error.message}`);
      }
      
      if (data?.redirect) {
        // توجيه المستخدم إلى صفحة مصادقة Shopify
        window.location.href = data.redirect;
      } else {
        setErrorMessage('لم يتم استلام عنوان URL للمصادقة من الخادم');
      }
    } catch (error) {
      console.error("خطأ في الاتصال بـ Shopify:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      setErrorMessage(errorMessage);
      
      toast.error(`فشل الاتصال: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // إعادة تعيين الاتصال وإعادة المصادقة
  const handleForceReconnect = async () => {
    // تحقق من وجود متجر متصل
    const shop = connectedShop || shopifyConnectionManager.getActiveStore();
    
    if (!shop) {
      toast.error('لا يوجد متجر متصل حاليًا');
      return;
    }
    
    // تجنب المحاولات المتكررة في فترة قصيرة
    const now = Date.now();
    if (now - lastConnectionAttempt < 5000) {
      toast.warning('يرجى الانتظار قليلاً قبل المحاولة مرة أخرى');
      return;
    }
    
    setLastConnectionAttempt(now);
    setIsConnecting(true);
    
    try {
      // مسح بيانات المتصفح القديمة
      localStorage.removeItem('shopify_force_refresh');
      localStorage.removeItem('shopify_last_token_check');
      
      // تعيين علامة لتحديث الاتصال
      localStorage.setItem('shopify_force_refresh', 'true');
      
      // حفظ عنوان العودة إذا كان موجوداً
      if (returnUrl) {
        localStorage.setItem('shopify_return_url', returnUrl);
      }
      
      // استدعاء وظيفة المصادقة مباشرة مع علامة التحديث الإجباري
      const { data, error } = await supabase.functions.invoke('shopify-auth', {
        body: { 
          shop,
          forceUpdate: true,
          timestamp: Date.now(),
          returnUrl: returnUrl || undefined
        },
      });
      
      if (error) {
        throw new Error(`فشل بدء إعادة المصادقة: ${error.message}`);
      }
      
      if (data?.redirect) {
        // توجيه المستخدم إلى صفحة مصادقة Shopify
        window.location.href = data.redirect;
      } else {
        throw new Error('لم يتم استلام عنوان URL للمصادقة من الخادم');
      }
    } catch (error) {
      console.error("خطأ في إعادة الاتصال:", error);
      
      // طريقة احتياطية - إعادة توجيه مباشرة
      navigate(`/shopify-redirect?shop=${encodeURIComponent(shop)}&force_update=true&t=${Date.now()}`);
      
      toast.error('حدثت مشكلة أثناء إعادة الاتصال. جاري المحاولة بطريقة بديلة...');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="container py-8 mx-auto" dir="rtl">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">اتصال متجر Shopify</h1>
          <p className="text-gray-600 mb-8">
            قم بربط متجر Shopify الخاص بك لاستخدام جميع ميزات نماذج الدفع عند الاستلام
          </p>
        </div>
        
        {/* رسالة تجديد الرمز */}
        {tokenRenewalRequired && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">تجديد اتصال متجر Shopify مطلوب</h3>
                <p className="mt-2 text-sm text-amber-700">
                  انتهت صلاحية رمز الوصول الخاص بمتجرك. يرجى إعادة الاتصال للاستمرار في استخدام الميزات المتكاملة مع Shopify.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* حالة الاتصال الحالية */}
        {shopifyConnected && connectedShop && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-green-700">
                <Store className="h-5 w-5 mr-2" />
                متصل بمتجر Shopify
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-800 mb-4">أنت متصل حاليًا بالمتجر: <strong>{connectedShop}</strong></p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  className="flex items-center" 
                  onClick={() => navigate('/forms')}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  الذهاب إلى النماذج
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center text-orange-600" 
                  onClick={handleForceReconnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {tokenRenewalRequired ? 'تجديد الاتصال' : 'تحديث الاتصال'}
                </Button>
                
                <Button 
                  variant="link" 
                  className="flex items-center" 
                  onClick={() => window.open(`https://${connectedShop}/admin`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  فتح لوحة تحكم Shopify
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* نموذج الاتصال */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{shopifyConnected ? 'اتصال بمتجر آخر' : 'اتصال بمتجر Shopify'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="shop" className="block text-sm font-medium text-gray-700 mb-1">
                  أدخل عنوان متجر Shopify الخاص بك
                </label>
                <div className="flex">
                  <input
                    id="shop"
                    type="text"
                    value={shopInput}
                    onChange={(e) => setShopInput(e.target.value)}
                    placeholder="متجرك"
                    className="flex-1 rounded-r-none border border-gray-300 p-2 rounded-md"
                  />
                  <div className="bg-gray-100 border border-r border-gray-300 p-2 rounded-l-md border-l-0 text-gray-500 whitespace-nowrap">
                    .myshopify.com
                  </div>
                </div>
                {errorMessage && (
                  <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  أدخل اسم متجرك Shopify فقط، على سبيل المثال "متجرك" بدلاً من "متجرك.myshopify.com"
                </p>
              </div>
              
              <Button
                onClick={handleConnectShopify}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Store className="mr-2 h-4 w-4" />
                )}
                {isConnecting ? 'جاري الاتصال...' : tokenRenewalRequired ? 'تجديد الاتصال' : 'الاتصال بـ Shopify'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* معلومات المصادقة */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h3 className="text-sm font-medium mb-2">معلومات هامة</h3>
          <p className="text-xs text-gray-600 mb-2">
            سيؤدي الاتصال بمتجر Shopify إلى السماح لهذا التطبيق بالوصول إلى متجرك لإضافة نماذج الدفع عند الاستلام.
            لن نقوم بتخزين أو استخدام أي من بيانات عملائك أو طلباتك إلا بموافقتك الصريحة.
          </p>
          <p className="text-xs text-gray-600">
            <strong>ملاحظة:</strong> يجب أن تكون مالك المتجر أو لديك صلاحيات الوصول إلى تثبيت التطبيقات.
          </p>
        </div>
        
        {/* زر تبديل إظهار معلومات التصحيح */}
        <div className="text-center">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            {showDebug ? 'إخفاء' : 'إظهار'} معلومات التصحيح
          </button>
        </div>
        
        {/* لوحة معلومات التصحيح */}
        {showDebug && <ShopifyDebugPanel />}
      </div>
    </div>
  );
};

export default Shopify;
