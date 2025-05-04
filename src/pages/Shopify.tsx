
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Store, ArrowRight, Info, CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { cleanShopifyDomain } from '@/lib/shopify/types';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';

const Shopify = () => {
  const [shop, setShop] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectedShop, setConnectedShop] = useState<string | null>(null);
  const navigate = useNavigate();

  // عند تحميل الصفحة، نتحقق ما إذا كان لدينا متجر متصل بالفعل
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // تحقق من حالة الاتصال المحفوظة محليًا
        const savedShop = localStorage.getItem('shopify_store');
        const savedConnected = localStorage.getItem('shopify_connected') === 'true';
        
        // تحقق من حالة الاتصال من مدير الاتصال
        const activeStore = shopifyConnectionManager.getActiveStore();
        
        console.log("حالة الاتصال:", { 
          savedShop, 
          savedConnected, 
          activeStore,
          allStores: shopifyConnectionManager.getAllStores() 
        });
        
        if ((savedConnected && savedShop) || activeStore) {
          setConnected(true);
          setConnectedShop(savedShop || activeStore?.shop || null);
        }
      } catch (error) {
        console.error("خطأ في التحقق من حالة الاتصال:", error);
      }
    };
    
    checkConnection();
  }, []);

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
      
      // حفظ متجر مؤقت للاستخدام في حالة توجيه مباشر دون معلمات
      localStorage.setItem('shopify_temp_store', cleanedShop);
      
      // طريقة مباشرة - تجاوز استدعاء الدالة
      const authUrl = `https://${cleanedShop}/admin/oauth/authorize?client_id=7e4608874bbcc38afa1953948da28407&scope=write_products,read_products,read_orders,write_orders,write_script_tags,read_themes,write_themes,read_content,write_content&redirect_uri=https://codform-flow-forms.lovable.app/shopify-callback`;
      
      console.log("توجيه مباشر إلى عنوان URL المصادقة:", authUrl);
      
      window.location.href = authUrl;
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
    navigate('/dashboard');
  };
  
  const handleSetup = () => {
    // تحقق من وجود متجر مخزن
    const shopToUse = connectedShop || localStorage.getItem('shopify_store');
    
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
            <CardTitle className="text-2xl">اتصال Shopify</CardTitle>
            <CardDescription>
              {connected 
                ? `متصل بنجاح بمتجر ${connectedShop}`
                : 'قم بتوصيل تطبيقك بمتجر Shopify الخاص بك'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {connected ? (
              <div className="space-y-4 text-center">
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-700">
                    تم الاتصال بنجاح بمتجر {connectedShop}
                  </p>
                </div>
                
                <p className="text-gray-600">
                  يمكنك الآن استخدام جميع ميزات التطبيق مع متجر Shopify الخاص بك.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shop">عنوان متجر Shopify الخاص بك</Label>
                  <Input
                    id="shop"
                    placeholder="متجرك.myshopify.com"
                    value={shop}
                    onChange={(e) => setShop(e.target.value)}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-500">
                    أدخل عنوان URL الكامل لمتجر Shopify الخاص بك، على سبيل المثال: store.myshopify.com
                  </p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="flex">
                    <Info className="h-5 w-5 text-blue-500 mr-2" />
                    <p className="text-sm text-blue-700">
                      سيتم توجيهك إلى Shopify للموافقة على الاتصال، ثم ستتم إعادتك إلى هنا بعد الانتهاء.
                    </p>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !shop.trim()}>
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                      جاري الاتصال...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      توصيل المتجر
                      <ArrowRight className="h-4 w-4 mr-2" />
                    </div>
                  )}
                </Button>
              </form>
            )}
            
            {!connected && (
              <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <CircleAlert className="h-5 w-5 text-yellow-500 ml-2" />
                  <p className="text-sm text-yellow-700">
                    تأكد من أن لديك صلاحيات الوصول كمسؤول لمتجرك على Shopify لإكمال الاتصال بنجاح.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center">
            {connected ? (
              <div className="flex gap-2">
                <Button onClick={handleContinue} variant="default">
                  متابعة إلى لوحة التحكم
                </Button>
                <Button onClick={handleDisconnect} variant="outline">
                  قطع الاتصال
                </Button>
              </div>
            ) : (
              <div className="flex flex-col w-full gap-2">
                <Button 
                  onClick={handleSetup} 
                  variant="outline" 
                  className="w-full"
                  disabled={!connectedShop && !localStorage.getItem('shopify_store')}>
                  استخدام اتصال سابق
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Shopify;
