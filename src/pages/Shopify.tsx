
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
  const [shopInput, setShopInput] = useState('');
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  useEffect(() => {
    // Check for URL parameters in the current location
    const params = new URLSearchParams(location.search);
    const shopParam = params.get("shop");
    const shopifySuccess = params.get("shopify_success");
    const authError = params.get("auth_error");
    
    if (shopParam) {
      setShopInput(shopParam);
    }
    
    // Data for debug panel
    setDebugInfo({
      currentLocation: location.pathname,
      searchParams: Object.fromEntries(params.entries()),
      shopParam,
      shopifySuccess,
      authError,
      shopifyConnected,
      shop,
      shops: shops || [],
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    if (shopifySuccess === "true" && shopParam) {
      toast.success(`تم الاتصال بمتجر ${shopParam} بنجاح`);
      navigate('/dashboard');
    }
    
    if (authError) {
      setError(params.get("error") || "حدث خطأ أثناء عملية المصادقة");
    }
  }, [location.search, navigate, shop, shopifyConnected, shops]);

  // Function to handle popup-based connection
  const connectWithPopup = async () => {
    try {
      const cleanedShop = shopInput ? cleanShopDomain(shopInput) : '';
      
      if (!cleanedShop) {
        setError('يرجى إدخال اسم متجر Shopify الخاص بك');
        return;
      }
      
      setIsProcessing(true);
      setError(null);
      
      // Store the shop domain temporarily for the redirect page to use
      localStorage.setItem('shopify_temp_store', cleanedShop);
      
      // Call the edge function directly
      const authUrl = `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?shop=${encodeURIComponent(cleanedShop)}&_t=${Date.now()}`;
      
      // Open popup window
      const width = 800;
      const height = 600;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'ShopifyAuth',
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
      );
      
      if (popup) {
        setPopupWindow(popup);
        setAuthStarted(true);
        
        // Check if the popup was closed
        const checkPopup = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopup);
            setIsProcessing(false);
            
            // Check if connection was successful after popup is closed
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
      console.error('خطأ في بدء عملية المصادقة:', e);
      setError(e instanceof Error ? e.message : 'حدث خطأ أثناء بدء عملية المصادقة');
      setIsProcessing(false);
    }
  };
  
  // Function to redirect to full page for authentication
  const connectDirectly = () => {
    try {
      const cleanedShop = shopInput ? cleanShopDomain(shopInput) : '';
      
      if (!cleanedShop) {
        setError('يرجى إدخال اسم متجر Shopify الخاص بك');
        return;
      }
      
      setIsProcessing(true);
      setError(null);
      
      // Store the shop domain temporarily
      localStorage.setItem('shopify_temp_store', cleanedShop);
      
      // Navigate to the redirect page with the shop parameter
      navigate(`/shopify-redirect?shop=${encodeURIComponent(cleanedShop)}&_t=${Date.now()}`);
    } catch (e) {
      console.error('خطأ في بدء عملية المصادقة:', e);
      setError(e instanceof Error ? e.message : 'حدث خطأ أثناء بدء عملية المصادقة');
      setIsProcessing(false);
    }
  };

  // Go back to the dashboard
  const returnToDashboard = () => {
    navigate('/dashboard');
  };
  
  // Try direct auth with server endpoint
  const tryServerAuth = () => {
    try {
      const cleanedShop = shopInput ? cleanShopDomain(shopInput) : '';
      
      if (!cleanedShop) {
        setError('يرجى إدخال اسم متجر Shopify الخاص بك');
        return;
      }
      
      setIsProcessing(true);
      setError(null);
      
      // Direct link to the Remix auth endpoint
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
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                <p>{error}</p>
              </div>
            </div>
          )}
          
          <div className="mb-4">
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
          
          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={connectWithPopup}
              disabled={isProcessing || !shopInput}
            >
              {isProcessing ? (
                <span className="flex items-center">
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
      {process.env.NODE_ENV !== 'production' && (
        <DebugPanel data={debugInfo} />
      )}
    </div>
  );
};

export default Shopify;
