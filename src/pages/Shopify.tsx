import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Store, ArrowRight, Info, CircleAlert, ArrowRightCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cleanShopifyDomain } from '@/lib/shopify/types';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';

const Shopify = () => {
  const [shop, setShop] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectedShop, setConnectedShop] = useState<string | null>(null);
  const [lastConnectionCheck, setLastConnectionCheck] = useState<number>(0);
  const navigate = useNavigate();

  // عند تحميل الصفحة، نتحقق ما إذا كان لدينا متجر متصل بالفعل من جميع المصادر المتاحة
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // تحقق من حالة الاتصال المحفوظة محليًا
        const savedShop = localStorage.getItem('shopify_store');
        const savedConnected = localStorage.getItem('shopify_connected') === 'true';
        
        // تحقق من حالة الاتصال من مدير الاتصال
        const activeStore = shopifyConnectionManager.getActiveStore();
        const allStores = shopifyConnectionManager.getAllStores();
        
        console.log("حالة الاتصال عند التحميل:", { 
          savedShop, 
          savedConnected, 
          activeStore,
          allStores,
          timestamp: Date.now()
        });
        
        setLastConnectionCheck(Date.now());
        
        // إذا كان هناك أي مؤشر على اتصال متجر، نعتبره متصلاً
        if ((savedConnected && savedShop) || activeStore || (allStores && allStores.length > 0)) {
          console.log("تم العثور على اتصال سابق، تعيين حالة الاتصال على متصل");
          
          setConnected(true);
          // استخدام أول قيمة متاحة كاسم المتجر المتصل
          const shopToUse = savedShop || activeStore || (allStores[0]?.domain);
          setConnectedShop(shopToUse);
          
          // إذا كانت هناك حاجة، قم بتحديث التخزين المحلي
          if (!savedConnected || !savedShop) {
            console.log("تحديث التخزين المحلي بمعلومات المتجر النشط");
            localStorage.setItem('shopify_connected', 'true');
            if (shopToUse) localStorage.setItem('shopify_store', shopToUse);
          }
          
          // تحديث مدير الاتصال
          if (shopToUse && (!activeStore || activeStore !== shopToUse)) {
            shopifyConnectionManager.addOrUpdateStore(shopToUse, true);
          }
          
          return;
        }
        
        // إذا لم نجد أي اتصال سابق، نتأكد من تنظيف أي بيانات قديمة
        console.log("لم يتم العثور على اتصال سابق، مسح البيانات القديمة");
        setConnected(false);
        setConnectedShop(null);
        
        // مسح أي بيانات من اتصال غير مكتمل
        shopifyConnectionManager.clearAllStores();
        shopifyConnectionManager.resetLoopDetection();
      } catch (error) {
        console.error("خطأ في التحقق من حالة الاتصال:", error);
      }
    };
    
    checkConnection();
    
    // إعادة التحقق من الاتصال بشكل دوري للتأكد من حالة الاتصال محدثة
    const intervalId = setInterval(() => {
      const now = Date.now();
      // التحقق من الاتصال كل 5 ثوانٍ فقط لتجنب التحقق المفرط
      if (now - lastConnectionCheck > 5000) {
        checkConnection();
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [lastConnectionCheck]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shop.trim()) {
      toast.error('يرجى إدخال عنوان متجر Shopify الخاص بك');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // تنظيف عنوان المتجر
      const cleanedShop = cleanShopifyDomain(shop.trim());
      
      if (!cleanedShop.endsWith('.myshopify.com')) {
        toast.error('يرجى إدخال عنوان متجر Shopify صالح (myshopify.com)');
        setIsLoading(false);
        return;
      }
      
      console.log(`بدء الاتصال مع متجر ${cleanedShop}`);
      
      // مسح أي بيانات اتصال قديمة قبل بدء اتصال جديد
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      shopifyConnectionManager.clearAllStores();
      shopifyConnectionManager.resetLoopDetection();
      
      // حفظ متجر مؤقت للاستخدام في حالة توجيه مباشر دون معلمات
      localStorage.setItem('shopify_temp_store', cleanedShop);
      
      // طريقة مباشرة - تجاوز استدعاء الدالة
      const authUrl = `https://${cleanedShop}/admin/oauth/authorize?client_id=7e4608874bbcc38afa1953948da28407&scope=write_products,read_products,read_orders,write_orders,write_script_tags,read_themes,write_themes,read_content,write_content&redirect_uri=https://codform-flow-forms.lovable.app/shopify-callback`;
      
      console.log("توجيه مباشر إلى عنوان URL المصادقة:", authUrl);
      
      // إضافة معلمات منع التخزين المؤقت
      const timestamp = Date.now();
      const finalAuthUrl = `${authUrl}&t=${timestamp}`;
      
      window.location.href = finalAuthUrl;
    } catch (error) {
      console.error("خطأ في عملية الاتصال:", error);
      
      // الوقوع على معلومات أكثر تفصيلاً عن الخطأ
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : 'حدث خطأ غير متوقع أثناء محاولة الاتصال';
      
      toast.error(`فشل الاتصال: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('هل أنت متأكد أنك تريد قطع الاتصال بهذا المتجر؟')) {
      try {
        console.log("قطع الاتصال وإزالة بيانات المتجر");
        
        // حذف بيانات المتجر من التخزين المحلي
        localStorage.removeItem('shopify_store');
        localStorage.removeItem('shopify_connected');
        localStorage.removeItem('shopify_temp_store');
        
        // إعادة ضبط مدير الاتصال
        shopifyConnectionManager.clearAllStores();
        shopifyConnectionManager.resetLoopDetection();
        
        setConnected(false);
        setConnectedShop(null);
        
        toast.success('تم قطع الاتصال بنجاح');
      } catch (error) {
        console.error("خطأ في قطع الاتصال:", error);
        toast.error('حدث خطأ أثناء محاولة قطع الاتصال');
      }
    }
  };

  const handleContinue = () => {
    console.log("متابعة إلى لوحة التحكم مع المتجر:", connectedShop || "غير معروف");
    
    // تأكيد إضافي لحالة الاتصال قبل الانتقال
    if (connectedShop) {
      localStorage.setItem('shopify_store', connectedShop);
      localStorage.setItem('shopify_connected', 'true');
      shopifyConnectionManager.addOrUpdateStore(connectedShop, true);
    }
    
    navigate('/dashboard');
  };
  
  const handleSetup = () => {
    // تحقق من وجود متجر مخزن
    const shopToUse = connectedShop || localStorage.getItem('shopify_store');
    
    console.log("محاولة استخدام اتصال سابق:", shopToUse);
    
    if (shopToUse) {
      // إعادة تعيين حالة الاتصال للتأكد من التحديث الإجباري
      localStorage.setItem('shopify_store', shopToUse);
      localStorage.setItem('shopify_connected', 'true');
      shopifyConnectionManager.addOrUpdateStore(shopToUse, true, true);
      
      navigate('/dashboard');
    } else {
      toast.error('لم يتم العثور على بيانات متجر');
    }
  };
  
  // تجاوز فحص الاتصال والذهاب مباشرة إلى لوحة التحكم
  const handleForceAccess = () => {
    console.log("تجاوز فحص الاتصال والذهاب مباشرة إلى لوحة التحكم");
    
    // ضبط حالة الاتصال ولكن بمتجر افتراضي
    const defaultShop = connectedShop || localStorage.getItem('shopify_store') || 'store.myshopify.com';
    localStorage.setItem('shopify_store', defaultShop);
    localStorage.setItem('shopify_connected', 'true');
    shopifyConnectionManager.addOrUpdateStore(defaultShop, true);
    
    navigate('/dashboard');
  };

  // Add new function for complete reset
  const handleCompleteReset = () => {
    if (window.confirm('هذا سيؤدي إلى مسح جميع بيانات الاتصال بشكل نهائي. هل أنت متأكد؟')) {
      try {
        // Call the complete reset function
        shopifyConnectionManager.clearAllStores();
        shopifyConnectionManager.resetLoopDetection();
        
        // Clear all localStorage items related to Shopify
        localStorage.removeItem('shopify_store');
        localStorage.removeItem('shopify_connected');
        localStorage.removeItem('shopify_temp_store');
        localStorage.removeItem('shopify_last_url_shop');
        localStorage.removeItem('shopify_last_error');
        localStorage.removeItem('shopify_recovery_attempt');
        localStorage.removeItem('shopify_connection_timestamp');
        localStorage.removeItem('shopify_failsafe');
        localStorage.removeItem('bypass_auth');
        localStorage.removeItem('pending_form_syncs');
        
        toast.success('تم إعادة تعيين جميع بيانات الاتصال بنجاح');
        
        // Force page reload to ensure all state is reset
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error("خطأ في إع��دة التعيين الكاملة:", error);
        toast.error('حدث خطأ أثناء إعادة التعيين');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-md w-full p-4">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Store className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <CardTitle className="text-xl">ربط المتجر مع Shopify</CardTitle>
            <CardDescription>
              {connected ? `متجر متصل: ${connectedShop}` : 'قم بإدخال عنوان متجر Shopify الخاص بك للاتصال'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {connected ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 font-medium">متصل بمتجر {connectedShop}</p>
                    <p className="text-sm text-green-700">يمكنك الآن استخدام الميزات المتكاملة مع Shopify</p>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button onClick={handleContinue} variant="default">
                    الذهاب إلى لوحة التحكم
                    <ArrowRightCircle className="mr-2 h-4 w-4" />
                  </Button>
                  
                  <Button onClick={handleDisconnect} variant="outline">
                    قطع الاتصال
                  </Button>
                  
                  <div className="pt-4 border-t border-gray-200 mt-4">
                    <p className="text-sm text-gray-500 mb-3">خيارات متقدمة:</p>
                    
                    <div className="flex flex-col space-y-2">
                      <Button 
                        onClick={handleCompleteReset} 
                        variant="outline"
                        className="border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700"
                      >
                        <RefreshCw className="ml-2 h-4 w-4" />
                        إعادة تعيين كاملة للاتصال
                      </Button>
                      
                      <Button 
                        onClick={handleForceAccess} 
                        variant="outline"
                        className="border-gray-200 text-gray-700"
                      >
                        <ArrowRight className="ml-2 h-4 w-4" />
                        تجاوز فحص الاتصال
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shop">عنوان متجر Shopify</Label>
                  <div className="flex space-x-2 items-center">
                    <Input
                      id="shop"
                      placeholder="your-store.myshopify.com"
                      value={shop}
                      onChange={(e) => setShop(e.target.value)}
                      className="flex-grow ml-2"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-xs text-gray-500">أدخل عنوان متجرك على Shopify (مثال: your-store.myshopify.com)</p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="ml-2">جاري الاتصال...</span>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>الاتصال بـ Shopify</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <p className="text-sm text-gray-500 mb-3">خيارات متقدمة:</p>
                  
                  <div className="flex flex-col space-y-2">
                    <Button 
                      onClick={handleCompleteReset} 
                      variant="outline"
                      type="button"
                      className="border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700"
                    >
                      <RefreshCw className="ml-2 h-4 w-4" />
                      إعادة تعيين كاملة للاتصال
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
        
        <div className="mt-8">
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700 mb-2">معلومات تشخيصية</summary>
            <div className="bg-gray-100 p-4 rounded-md">
              <p className="font-medium mb-2">حالة الاتصال:</p>
              <ul className="list-disc list-inside">
                <li>الاتصال: {connected ? 'متصل' : 'غير متصل'}</li>
                <li>متجر: {connectedShop || 'لا يوجد'}</li>
                <li>localStorage (shopify_store): {localStorage.getItem('shopify_store') || 'لا يوجد'}</li>
                <li>localStorage (shopify_connected): {localStorage.getItem('shopify_connected') || 'لا يوجد'}</li>
                <li>آخر تحديث: {new Date(lastConnectionCheck).toLocaleTimeString()}</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default Shopify;
