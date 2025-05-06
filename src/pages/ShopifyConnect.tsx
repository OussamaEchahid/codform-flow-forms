
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ShopifyConnection from '@/components/shopify/ShopifyConnection';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
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
    const checkParams = async () => {
      try {
        setIsLoading(true);
        
        // تحقق من وجود معلمات في URL
        const urlParams = new URLSearchParams(window.location.search);
        const shopParam = urlParams.get('shop');
        
        // حفظ معلمات المتجر في التخزين المحلي إذا كانت موجودة
        if (shopParam) {
          localStorage.setItem('shopify_last_url_shop', shopParam);
          console.log('Shop parameter detected in URL:', shopParam);
          
          // تحقق من صحة المتجر المخزن
          await shopifyConnectionService.syncStoreToDatabase(shopParam, undefined, false);
        }
        
        // تنظيف رموز placeholder من قاعدة البيانات
        await shopifyConnectionService.cleanupPlaceholderTokens();
        console.log('Placeholder tokens cleaned on page load');
        
        setError(null);
      } catch (error) {
        console.error('Error in checkParams:', error);
        setError('حدث خطأ أثناء التحقق من المعلمات');
      } finally {
        setIsLoading(false);
      }
    };

    checkParams();
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
        
        <ShopifyConnection />
      </div>
    </div>
  );
};

export default ShopifyConnect;
