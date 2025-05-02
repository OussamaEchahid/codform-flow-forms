
import React, { useState } from 'react';
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
  
  // معالج الاتصال بـ Shopify
  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // نهج بسيط - إعادة توجيه إلى صفحة مصادقة Shopify
      const shopifyAuthUrl = `/shopify?ts=${Date.now()}`;
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
    }
  };
  
  // معالج إعادة الاتصال بـ Shopify
  const handleReconnect = () => {
    if (forceReconnect) {
      forceReconnect();
    } else {
      handleConnect();
    }
  };
  
  // معالج تحديث حالة الاتصال
  const handleRefresh = async () => {
    if (refreshShopifyConnection) {
      try {
        const isConnected = await refreshShopifyConnection();
        
        if (isConnected) {
          toast.success(language === 'ar' 
            ? 'تم تحديث حالة الاتصال' 
            : 'Connection status updated');
        } else {
          toast.error(language === 'ar'
            ? 'فشل التحقق من الاتصال'
            : 'Failed to verify connection');
        }
      } catch (error) {
        console.error('Error refreshing connection:', error);
        toast.error(language === 'ar'
          ? 'خطأ في تحديث حالة الاتصال'
          : 'Error updating connection status');
      }
    }
  };
  
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
