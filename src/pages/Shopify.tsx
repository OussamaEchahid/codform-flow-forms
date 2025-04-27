
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { AlertCircle, ShoppingBag, CheckCircle } from 'lucide-react';

const Shopify = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { shopifyConnected, shop } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // دالة مساعدة لتنظيف عنوان المتجر
  const cleanShopDomain = (domain: string): string => {
    let cleanDomain = domain.trim();
    
    try {
      // إذا كان يحتوي على بروتوكول، نأخذ اسم النطاق فقط
      if (cleanDomain.startsWith('http')) {
        const url = new URL(cleanDomain);
        cleanDomain = url.hostname;
      }
      
      // التأكد من أنه ينتهي بـ myshopify.com
      if (!cleanDomain.endsWith('myshopify.com')) {
        if (!cleanDomain.includes('.')) {
          cleanDomain = `${cleanDomain}.myshopify.com`;
        }
      }
    } catch (e) {
      console.error("Error cleaning domain:", e);
    }
    
    return cleanDomain;
  };

  useEffect(() => {
    // التحقق من وجود معلمات متجر في URL
    const params = new URLSearchParams(location.search);
    const shopParam = params.get("shop");

    if (shopParam) {
      setDebugInfo({ shopParam, shopifyConnected, shop, url: window.location.href });
      console.log("معلمات الصفحة:", { shopParam, shopifyConnected, shop, url: window.location.href });
      
      // لدينا معلمة متجر، نبدأ عملية المصادقة
      setIsProcessing(true);
      console.log("بدء المصادقة للمتجر:", shopParam);
      
      // تنظيف عنوان المتجر
      const cleanedShop = cleanShopDomain(shopParam);
      console.log("عنوان المتجر المنظف:", cleanedShop);
      
      // حفظ المتجر مؤقتاً في localStorage
      localStorage.setItem('shopify_temp_store', cleanedShop);
      
      // تأخير قصير قبل التوجيه
      const redirectTimer = setTimeout(() => {
        // التأكد من ترميز معلمة المتجر بشكل صحيح
        const encodedShop = encodeURIComponent(cleanedShop);
        console.log("التوجيه إلى المصادقة مع متجر:", encodedShop);
        
        // تنسيق عنوان المصادقة بشكل صحيح
        window.location.href = `/auth?shop=${encodedShop}`;
      }, 1000);
      
      return () => clearTimeout(redirectTimer);
    } else if (shopifyConnected && shop) {
      // المتجر متصل بالفعل
      console.log("المتجر متصل بالفعل:", shop);
    } else {
      // لا توجد معلمات متجر ولا اتصال سابق
      console.log("لا توجد معلمات متجر أو اتصال سابق");
    }
  }, [location.search, navigate, shop, shopifyConnected]);

  const handleConnectShopify = () => {
    // عند النقر على زر الاتصال بـ Shopify، نطلب من المستخدم إدخال دومين المتجر
    const shopDomain = window.prompt(language === 'ar' 
      ? "أدخل دومين متجر Shopify الخاص بك (مثال: your-store.myshopify.com)"
      : "Enter your Shopify store domain (example: your-store.myshopify.com)"
    );
    
    if (!shopDomain) return;
    
    // تنظيف عنوان المتجر
    const cleanedDomain = cleanShopDomain(shopDomain);
    
    // التحقق من تنسيق الدومين
    if (!cleanedDomain.endsWith('myshopify.com') && !cleanedDomain.includes('.')) {
      setError(language === 'ar'
        ? "يرجى إدخال دومين متجر Shopify صالح (مثال: your-store.myshopify.com)"
        : "Please enter a valid Shopify store domain (example: your-store.myshopify.com)"
      );
      return;
    }
    
    // حفظ المتجر مؤقتاً وتوجيه المستخدم إلى مسار المصادقة
    localStorage.setItem('shopify_temp_store', cleanedDomain);
    
    // بناء وتوجيه إلى عنوان المصادقة مباشرة
    console.log("التوجيه إلى المصادقة مع متجر:", cleanedDomain);
    window.location.href = `/auth?shop=${encodeURIComponent(cleanedDomain)}`;
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
              <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-40">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
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
            </Card>
          )}
          
          {shopifyConnected && shop ? (
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
                    onClick={() => navigate('/dashboard')}
                  >
                    {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
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
                
                <Button 
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleConnectShopify}
                >
                  {language === 'ar' ? 'اتصل بـ Shopify الآن' : 'Connect to Shopify'}
                </Button>
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
                  ? '1. انقر على زر "اتصل بـ Shopify الآن" أعلاه'
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
        </div>
      </div>
    </div>
  );
};

export default Shopify;
