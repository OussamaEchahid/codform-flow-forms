
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, ShoppingBag, RefreshCw, ExternalLink } from 'lucide-react';
import { ShopifyDebugPanel } from '@/components/shopify/ShopifyDebugPanel';
import { supabase } from '@/integrations/supabase/client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

const Shopify = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [shopInput, setShopInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV !== 'production');
  const { user, shop: connectedShop, shopifyConnected } = useAuth();
  
  // تحقق من وجود إعادة توجيه بعد الاتصال
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopifyConnected = params.get('shopify_connected') === 'true';
    const shopDomain = params.get('shop');
    const authSuccess = params.get('auth_success') === 'true';
    const authError = params.get('auth_error') === 'true';
    const errorMessage = params.get('error');
    
    if (shopifyConnected && shopDomain) {
      // إذا كان هناك اتصال ناجح، حفظ متجر Shopify في الحالة المحلية
      localStorage.setItem('shopify_store', shopDomain);
      localStorage.setItem('shopify_connected', 'true');
      shopifyConnectionManager.addOrUpdateStore(shopDomain, true);
      toast.success('تم الاتصال بمتجر Shopify بنجاح');
      
      // إعادة التوجيه إلى لوحة التحكم
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
    
    if (authError && errorMessage) {
      toast.error(`خطأ في المصادقة: ${errorMessage}`);
    }
  }, [navigate]);

  // استخلاص معلمة متجر من URL إن وجدت
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get('shop');
    
    if (shopParam) {
      setShopInput(shopParam);
      
      // تخزين المتجر مؤقتاً للاستخدام لاحقاً
      localStorage.setItem('shopify_temp_store', shopParam);
    } else {
      // استرجاع المتجر المحفوظ إذا كان موجوداً
      const activeStore = shopifyConnectionManager.getActiveStore();
      if (activeStore) {
        setShopInput(activeStore);
      }
    }
  }, []);

  const handleConnectShopify = async () => {
    // التحقق من وجود عنوان متجر
    let shop = shopInput.trim();
    
    if (!shop) {
      setErrorMessage('يرجى إدخال عنوان متجر Shopify الخاص بك');
      return;
    }
    
    // تنظيف عنوان المتجر وإضافة .myshopify.com إذا لزم الأمر
    if (!shop.includes('.myshopify.com')) {
      shop = `${shop}.myshopify.com`;
    }
    
    // إزالة البروتوكول إذا كان موجوداً
    shop = shop.replace(/^https?:\/\//, '');
    
    setIsConnecting(true);
    setErrorMessage(null);
    
    try {
      // تخزين المتجر مؤقتًا للاستخدام أثناء عملية المصادقة
      localStorage.setItem('shopify_temp_store', shop);
      shopifyConnectionManager.saveLastUrlShop(shop);
      
      // استدعاء وظيفة Supabase Edge Function لبدء المصادقة
      const { data, error } = await supabase.functions.invoke('shopify-auth', {
        body: { 
          shop,
          // إعادة المصادقة إذا كان المستخدم يحاول إعادة الاتصال بمتجر موجود بالفعل
          forceUpdate: shopifyConnected && connectedShop === shop
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
    
    setIsConnecting(true);
    
    try {
      // تعيين علامة لتحديث الاتصال
      localStorage.setItem('shopify_force_refresh', 'true');
      
      // توجيه المستخدم إلى صفحة إعادة التوجيه مع معلمة تحديث إجباري
      navigate(`/shopify-redirect?shop=${encodeURIComponent(shop)}&force_update=true`);
    } catch (error) {
      console.error("خطأ في إعادة الاتصال:", error);
      toast.error('فشل إعادة الاتصال. يرجى المحاولة مرة أخرى.');
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
                  تحديث الاتصال
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
                {isConnecting ? 'جاري الاتصال...' : 'الاتصال بـ Shopify'}
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
