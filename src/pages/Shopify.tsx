
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { AlertCircle, ShoppingBag, CheckCircle } from 'lucide-react';

// إضافة مكون منفصل لعرض بيانات التشخيص
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

// مكون لعرض حالة الاتصال
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

// المكون الرئيسي
const Shopify = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { shopifyConnected, shop } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // وظيفة مساعدة لتنظيف نطاق المتجر
  const cleanShopDomain = (domain: string): string => {
    let cleanDomain = domain.trim();
    
    try {
      // إذا كان يحتوي على بروتوكول، خذ فقط اسم النطاق
      if (cleanDomain.startsWith('http')) {
        const url = new URL(cleanDomain);
        cleanDomain = url.hostname;
      }
      
      // تأكد من أنه ينتهي بـ myshopify.com
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
    // التحقق من معلمات المتجر في عنوان URL
    const params = new URLSearchParams(location.search);
    const shopParam = params.get("shop");

    if (shopParam) {
      const debug = { 
        shopParam, 
        shopifyConnected, 
        shop, 
        url: window.location.href,
        fullUrl: window.location.href,
        origin: window.location.origin,
        search: location.search,
        allParams: Object.fromEntries(params.entries()),
        referrer: document.referrer || "none",
        userAgent: navigator.userAgent,
      };
      setDebugInfo(debug);
      console.log("Shopify page parameters:", debug);
      
      // لدينا معلمة متجر، ابدأ عملية المصادقة
      setIsProcessing(true);
      console.log("Starting authentication for shop:", shopParam);
      
      // تنظيف نطاق المتجر
      const cleanedShop = cleanShopDomain(shopParam);
      console.log("Cleaned shop domain:", cleanedShop);
      
      // حفظ المتجر مؤقتًا في localStorage
      localStorage.setItem('shopify_temp_store', cleanedShop);
      
      // تأخير قصير قبل إعادة التوجيه لتجنب شروط السباق
      const redirectTimer = setTimeout(() => {
        // بناء عنوان URL لمصادقة تطبيق Shopify مباشرة
        const encodedShop = encodeURIComponent(cleanedShop);
        console.log("Redirecting to Shopify OAuth with shop:", encodedShop);
        
        // تنسيق عنوان URL المصادقة بشكل صحيح
        // استخدام عنوان URL مباشر للتعامل من جانب الخادم
        const authUrl = `/auth?shop=${encodedShop}`;
        console.log("Full server auth URL:", window.location.origin + authUrl);
        
        // استخدم استبدال لتجنب إنشاء إدخال محفوظات المتصفح
        window.location.replace(authUrl);
      }, 500);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [location.search, navigate, shop, shopifyConnected]);

  const handleConnectShopify = () => {
    // عند النقر على زر "الاتصال بشوبيفاي"، اطلب من المستخدم إدخال نطاق المتجر
    const shopDomain = window.prompt(language === 'ar' 
      ? "أدخل دومين متجر Shopify الخاص بك (مثال: your-store.myshopify.com)"
      : "Enter your Shopify store domain (example: your-store.myshopify.com)"
    );
    
    if (!shopDomain) return;
    
    // تنظيف نطاق المتجر
    const cleanedDomain = cleanShopDomain(shopDomain);
    
    // التحقق من صحة تنسيق النطاق
    if (!cleanedDomain.includes('.')) {
      setError(language === 'ar'
        ? "يرجى إدخال دومين متجر Shopify صالح (مثال: your-store.myshopify.com)"
        : "Please enter a valid Shopify store domain (example: your-store.myshopify.com)"
      );
      return;
    }
    
    // حفظ المتجر مؤقتًا وإعادة توجيه المستخدم مباشرة إلى OAuth
    localStorage.setItem('shopify_temp_store', cleanedDomain);
    
    console.log("Starting OAuth for shop:", cleanedDomain);
    setIsProcessing(true);
    
    // تنسيق عنوان URL المصادقة بشكل صحيح
    const authUrl = `/auth?shop=${encodeURIComponent(cleanedDomain)}`;
    console.log("Full auth URL:", window.location.origin + authUrl);
    window.location.href = authUrl;
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
                    ? 'تحقق من تكوين عناوين إعادة التوجيه في حساب شركاء Shopify الخاص بك'
                    : 'Check redirect URL configuration in your Shopify Partners account'}
                </li>
                <li>
                  {language === 'ar'
                    ? 'حاول مسح ذاكرة التخزين المؤقت للمتصفح وملفات تعريف الارتباط'
                    : 'Try clearing your browser cache and cookies'}
                </li>
                <li>
                  {language === 'ar'
                    ? 'تأكد من السماح بالنوافذ المنبثقة في متصفحك'
                    : 'Ensure popups are allowed in your browser'}
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
