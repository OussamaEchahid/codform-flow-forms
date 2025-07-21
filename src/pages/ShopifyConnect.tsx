
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ShopifyConnection from '@/components/shopify/ShopifyConnection';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RefreshCcw, Store, ExternalLink } from 'lucide-react';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';
import { toast } from 'sonner';
import { forceCleanShopifyState, cleanupAuthState } from '@/utils/clean-auth-state';
import { supabase } from '@/integrations/supabase/client';

const ShopifyConnect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // تحقق من المعلمات في عنوان URL والربط التلقائي
  useEffect(() => {
    console.log("ShopifyConnect component mounted");
    
    const autoConnectShop = async () => {
      try {
        setIsLoading(true);
        
        // تحقق من وجود معلمات في URL
        const urlParams = new URLSearchParams(window.location.search);
        const shopParam = urlParams.get('shop');
        const embeddedParam = urlParams.get('embedded');
        const hostParam = urlParams.get('host');
        
        console.log("🔍 URL params check:", { 
          shopParam, 
          embeddedParam, 
          hostParam,
          fullUrl: window.location.href 
        });
        
        // إذا كان هناك shop parameter، ابدأ الربط التلقائي
        if (shopParam) {
          console.log('🚀 Auto-connecting to shop:', shopParam);
          
          // تنظيف المعرف وإضافة .myshopify.com إذا لزم الأمر
          let normalizedShop = shopParam.trim().toLowerCase();
          if (!normalizedShop.includes('.myshopify.com')) {
            normalizedShop = `${normalizedShop}.myshopify.com`;
          }
          
          // حفظ في localStorage للمراجع المستقبلية
          localStorage.setItem('shopify_last_url_shop', normalizedShop);
          
          // ابدأ عملية الربط التلقائي
          try {
            console.log(`🔗 Starting automatic OAuth for: ${normalizedShop}`);
            
            // استدعاء edge function للمصادقة
            const { data, error } = await supabase.functions.invoke('shopify-auth', {
              body: { shop: normalizedShop }
            });

            if (error) {
              console.error('❌ Auto-connect error:', error);
              setError(`خطأ في الربط التلقائي: ${error.message}`);
              setIsLoading(false);
              return;
            }

            if (!data || !data.success) {
              console.error('❌ Auto-connect failed:', data);
              setError(data?.error || 'فشل في الربط التلقائي');
              setIsLoading(false);
              return;
            }

            console.log('✅ Auto-connect redirect URL:', data.redirect);
            
            // إعادة توجيه فورية إلى Shopify OAuth
            window.location.href = data.redirect;
            return; // منع باقي التنفيذ
            
          } catch (connectError) {
            console.error('❌ Error in auto-connect:', connectError);
            setError('حدث خطأ أثناء الربط التلقائي');
          }
        }
        
        // تنظيف رموز placeholder من قاعدة البيانات إذا لم يكن هناك shop parameter
        try {
          await shopifyConnectionService.cleanupPlaceholderTokens();
          console.log('🧹 Placeholder tokens cleaned on page load');
        } catch (cleanupError) {
          console.error("Error cleaning placeholder tokens:", cleanupError);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error in autoConnectShop:', error);
        setError('حدث خطأ أثناء التحقق من المعلمات');
      } finally {
        setIsLoading(false);
      }
    };

    autoConnectShop();
    
    // التأكد من أن الصفحة مرئية بالفعل
    document.title = "الاتصال بمتجر Shopify";
    
  }, []); // إزالة location.search من dependency array لمنع إعادة التحميل
  
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

  // إصلاح شامل للحالة
  const handleCompleteFix = async () => {
    try {
      setIsResetting(true);
      
      console.log('🔧 بدء الإصلاح الشامل...');
      
      // تنظيف شامل للحالة المحلية
      cleanupAuthState();
      
      // تنظيف المتاجر من قاعدة البيانات
      console.log('📡 استدعاء edge function لتنظيف المتاجر...');
      
      try {
        const { data, error } = await supabase.functions.invoke('clean-shopify-stores', {
          body: { action: 'clean_all' }
        });
        
        console.log('Edge function response:', { data, error });
        
        if (error) {
          console.error('Error cleaning stores:', error);
          toast.error('فشل في تنظيف المتاجر من قاعدة البيانات');
        } else {
          console.log('✅ تم تنظيف جميع المتاجر بنجاح');
          toast.success('تم تنظيف جميع المتاجر بنجاح');
        }
      } catch (functionError) {
        console.error('Function call error:', functionError);
        toast.error('خطأ في استدعاء function التنظيف');
      }
      
      // توقف loading state
      setIsResetting(false);
      setError(null);
      
      // إظهار رسالة نجاح
      toast.success('تم الإصلاح الشامل! يمكنك الآن الاتصال بمتجر جديد');
      
      console.log('✅ تم الإصلاح الشامل بنجاح');
      
    } catch (error) {
      console.error('Error in complete fix:', error);
      toast.error('فشل في الإصلاح الشامل');
      setIsResetting(false);
    }
  };

  const handleExternalOpen = () => {
    window.open("https://codmagnet.com/shopify-connect", "_blank");
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
        
        {/* زر الإصلاح الشامل */}
        <div className="mb-4 p-4 border border-orange-200 bg-orange-50 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-500 ml-2" />
            <p className="text-orange-700 font-medium">إصلاح شامل للاتصال</p>
          </div>
          <p className="mt-2 text-sm text-orange-600">
            إذا كان لديك مشاكل في اتصال المتاجر أو متاجر قديمة عالقة، استخدم هذا الخيار لتنظيف شامل.
          </p>
          <div className="mt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCompleteFix}
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري التنظيف...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  إصلاح شامل - حذف جميع المتاجر
                </>
              )}
            </Button>
          </div>
        </div>
        
        <ShopifyConnection />
      </div>
    </div>
  );
};

export default ShopifyConnect;
