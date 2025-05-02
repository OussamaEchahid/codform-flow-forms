
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

// نوع خصائص مكون ShopifyConnectionManager
export interface ShopifyConnectionManagerProps {
  variant?: 'button' | 'panel';
  showStatus?: boolean;
  onComplete?: () => void;
}

export const ShopifyConnectionManager: React.FC<ShopifyConnectionManagerProps> = ({ 
  variant = 'button',
  showStatus = true,
  onComplete
}) => {
  const { shopifyConnected, shop, forceReconnect, refreshShopifyConnection } = useAuth();
  const { language } = useI18n();
  const [isConnecting, setIsConnecting] = useState(false);
  const [callbackTriggered, setCallbackTriggered] = useState<number>(0);
  
  // تتبع حالة الاتصال
  useEffect(() => {
    // التحقق من حالة الاتصال مع Shopify عند تحميل المكون
    const verifyConnection = async () => {
      try {
        if (refreshShopifyConnection) {
          await refreshShopifyConnection();
        }
        
        // إذا كان الاتصال ناجحًا وتم تعيين معالج الاكتمال، قم باستدعائه
        if (shopifyConnected && onComplete) {
          onComplete();
        }
      } catch (error) {
        console.error('Error verifying Shopify connection:', error);
      }
    };
    
    verifyConnection();
  }, [refreshShopifyConnection, shopifyConnected, onComplete, callbackTriggered]);
  
  // معالج الاتصال بـ Shopify - تحسين لإضافة أمان إضافي
  const handleConnect = async () => {
    if (isConnecting) {
      toast.info(language === 'ar' 
        ? 'جاري بالفعل محاولة الاتصال، يرجى الانتظار...' 
        : 'Connection attempt in progress, please wait...');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // تسجيل محاولة الاتصال
      const attemptCount = parseInt(localStorage.getItem('shopify_connect_attempts') || '0', 10) + 1;
      localStorage.setItem('shopify_connect_attempts', attemptCount.toString());
      localStorage.setItem('shopify_connecting', 'true');
      localStorage.setItem('shopify_connect_timestamp', Date.now().toString());
      
      // إنشاء حالة عشوائية للمساعدة في التحقق
      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('shopify_auth_state', state);
      
      // إضافة معلومات الموقع الحالي لإعادة التوجيه بعد المصادقة
      const currentUrl = encodeURIComponent(window.location.href);
      
      // نهج بسيط - إعادة توجيه إلى صفحة مصادقة Shopify
      const clientUrl = window.location.origin;
      const shopifyAuthUrl = `/shopify?ts=${Date.now()}&r=${Math.random().toString(36).substring(2,8)}&client=${encodeURIComponent(clientUrl)}&state=${state}&return=${currentUrl}&debug=true`;
      console.log('Redirecting to Shopify auth:', shopifyAuthUrl);
      
      // إضافة تأخير صغير قبل إعادة التوجيه للسماح للمستخدم برؤية حالة التحميل
      setTimeout(() => {
        window.location.href = shopifyAuthUrl;
      }, 500);
      
    } catch (error) {
      console.error('Error connecting to Shopify:', error);
      toast.error(language === 'ar' 
        ? 'خطأ في الاتصال بـ Shopify' 
        : 'Error connecting to Shopify');
      setIsConnecting(false);
      localStorage.removeItem('shopify_connecting');
    }
  };
  
  // معالج إعادة الاتصال بـ Shopify
  const handleReconnect = () => {
    if (forceReconnect) {
      const result = forceReconnect();
      // لا نحتاج إلى التحقق من النتيجة لأن forceReconnect تقوم بإعادة توجيه المتصفح
    } else {
      handleConnect();
    }
  };
  
  // معالج تحديث حالة الاتصال
  const handleRefresh = async () => {
    if (refreshShopifyConnection) {
      try {
        const result = await refreshShopifyConnection();
        
        if (result) {
          toast.success(language === 'ar' 
            ? 'تم تحديث حالة الاتصال بنجاح' 
            : 'Connection status updated successfully');
          
          setCallbackTriggered(Date.now());
        } else {
          toast.error(language === 'ar'
            ? 'فشل التحقق من الاتصال - رمز الوصول غير صالح'
            : 'Connection verification failed - invalid access token');
        }
      } catch (error) {
        console.error('Error refreshing connection:', error);
        toast.error(language === 'ar'
          ? 'خطأ في تحديث حالة الاتصال'
          : 'Error updating connection status');
      }
    }
  };
  
  // التحقق من معلمات URL للاتصال
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get('shop');
    const shopifyConnectedParam = params.get('shopify_connected');
    
    if (shopParam && shopifyConnectedParam === 'true') {
      // تم اتصال Shopify بنجاح
      localStorage.setItem('shopify_store', shopParam);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.removeItem('shopify_connecting');
      
      setCallbackTriggered(Date.now());
      
      // إزالة معلمات URL دون إعادة تحميل الصفحة
      const url = new URL(window.location.href);
      url.searchParams.delete('shop');
      url.searchParams.delete('shopify_connected');
      url.searchParams.delete('auth_success');
      url.searchParams.delete('timestamp');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);
  
  // النسخة البسيطة (زر)
  if (variant === 'button') {
    return (
      <Button
        onClick={shopifyConnected ? handleReconnect : handleConnect}
        disabled={isConnecting}
        className={shopifyConnected ? "bg-gray-600" : "bg-[#5E8E3E]"}
      >
        {isConnecting ? (
          <>
            <span className="inline-block animate-spin mr-2">⏳</span>
            {language === 'ar' ? 'جاري الاتصال...' : 'Connecting...'}
          </>
        ) : shopifyConnected ? (
          language === 'ar' ? 'إعادة الاتصال بـ Shopify' : 'Reconnect Shopify'
        ) : (
          language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect to Shopify'
        )}
      </Button>
    );
  }
  
  // النسخة الموسعة (لوحة)
  return (
    <div className="border rounded-md p-4 bg-white shadow-sm">
      <h3 className="text-lg font-medium mb-2">
        {language === 'ar' ? 'اتصال Shopify' : 'Shopify Connection'}
      </h3>
      
      {showStatus && (
        <div className="mb-4">
          <div className={`px-3 py-2 rounded-md ${shopifyConnected ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <span className="font-medium">
              {shopifyConnected 
                ? (language === 'ar' ? '✓ متصل' : '✓ Connected') 
                : (language === 'ar' ? '⚠️ غير متصل' : '⚠️ Not Connected')}
            </span>
            
            {shopifyConnected && shop && (
              <div className="text-sm mt-1 text-gray-600">
                {language === 'ar' ? 'المتجر:' : 'Shop:'} {shop}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Button
          onClick={shopifyConnected ? handleReconnect : handleConnect}
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              {language === 'ar' ? 'جاري الاتصال...' : 'Connecting...'}
            </>
          ) : shopifyConnected ? (
            language === 'ar' ? 'إعادة الاتصال بـ Shopify' : 'Reconnect Shopify'
          ) : (
            language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect to Shopify'
          )}
        </Button>
        
        {shopifyConnected && (
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="w-full"
          >
            {language === 'ar' ? 'تحديث حالة الاتصال' : 'Refresh Connection Status'}
          </Button>
        )}
      </div>
    </div>
  );
};
