
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ShopifyConnection from '@/components/shopify/ShopifyConnection';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RefreshCcw, Store, ExternalLink } from 'lucide-react';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';
import { toast } from 'sonner';

const ShopifyConnect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // تحقق من المعلمات في عنوان URL والتخزين المحلي
  useEffect(() => {
    console.log("ShopifyConnect component mounted");
    
    const checkParams = async () => {
      try {
        setIsLoading(true);
        
        // تحقق من وجود معلمات في URL
        const urlParams = new URLSearchParams(window.location.search);
        const shopParam = urlParams.get('shop');
        
        console.log("URL params check:", { shopParam, fullUrl: window.location.href });
        
        // حفظ معلمات المتجر في التخزين المحلي إذا كانت موجودة
        if (shopParam) {
          localStorage.setItem('shopify_last_url_shop', shopParam);
          console.log('Shop parameter detected in URL:', shopParam);
          
          // تحقق من صحة المتجر المخزن
          try {
            await shopifyConnectionService.syncStoreToDatabase(shopParam, undefined, false);
            console.log("Store synced to database:", shopParam);
          } catch (syncError) {
            console.error("Error syncing store:", syncError);
          }
        }
        
        // تنظيف رموز placeholder من قاعدة البيانات
        try {
          await shopifyConnectionService.cleanupPlaceholderTokens();
          console.log('Placeholder tokens cleaned on page load');
        } catch (cleanupError) {
          console.error("Error cleaning placeholder tokens:", cleanupError);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error in checkParams:', error);
        setError('حدث خطأ أثناء التحقق من المعلمات');
      } finally {
        setIsLoading(false);
      }
    };

    checkParams();
    
    // التأكد من أن الصفحة مرئية بالفعل - إصلاح محتمل للمشكلة
    document.title = "الاتصال بمتجر Shopify";
    
  }, [location.search]);
  
  // Reset connection state
  const handleReset = async () => {
    try {
      setIsResetting(true);
      await shopifyConnectionService.forceResetConnection();
      toast.success('تم إعادة تعيين حالة الاتصال بنجاح');
      
      // إعادة تحميل الصفحة بعد إعادة التعيين
      window.location.reload();
    } catch (error) {
      console.error('Error resetting connection:', error);
      toast.error('فشل في إعادة تعيين حالة الاتصال');
      setIsResetting(false);
    }
  };

  const handleExternalOpen = () => {
    window.open("https://codform-flow-forms.lovable.app/shopify-connect", "_blank");
  };

  // إذا كان التحميل جاريًا، عرض حالة التحميل
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">جاري التحميل...</h2>
            <p className="text-gray-600">يرجى الانتظار بينما نجهز صفحة الاتصال</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <div className="w-full max-w-md px-4">
        {error && (
          <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 ml-2" />
              <p className="text-red-700">{error}</p>
            </div>
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-red-300 hover:bg-red-100"
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري إعادة التعيين...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    إعادة تعيين حالة الاتصال
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        <div className="mb-4 p-4 border border-blue-200 bg-blue-50 rounded-md">
          <div className="flex items-center">
            <Store className="h-5 w-5 text-blue-500 ml-2" />
            <p className="text-blue-700 font-medium">صفحة الاتصال بمتجر Shopify</p>
          </div>
          <p className="mt-2 text-sm text-blue-600">
            أنت الآن على صفحة الاتصال بمتجر Shopify. إذا كنت تواجه مشكلة في الاتصال، جرب إعادة تعيين حالة الاتصال أدناه.
          </p>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              className="border-blue-300 hover:bg-blue-100"
              onClick={handleExternalOpen}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              فتح في نافذة جديدة
            </Button>
          </div>
        </div>
        
        <ShopifyConnection />
      </div>
    </div>
  );
};

export default ShopifyConnect;
