
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

// Props type for the ShopifyConnectionManager component
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
  
  // Handle connect to Shopify
  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Simple approach - redirect to the Shopify auth page
      const shopifyAuthUrl = `/shopify?ts=${Date.now()}`;
      console.log('Redirecting to Shopify auth:', shopifyAuthUrl);
      
      // Add a small delay before redirect to let the user see the loading state
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
  
  // Handle reconnect to Shopify
  const handleReconnect = () => {
    if (forceReconnect) {
      forceReconnect();
    } else {
      handleConnect();
    }
  };
  
  // Handle refresh connection status
  const handleRefresh = async () => {
    if (refreshShopifyConnection) {
      await refreshShopifyConnection();
      toast.success(language === 'ar' 
        ? 'تم تحديث حالة الاتصال' 
        : 'Connection status updated');
    }
  };
  
  // Simple button variant
  if (variant === 'button') {
    return (
      <Button
        onClick={shopifyConnected ? handleReconnect : handleConnect}
        disabled={isConnecting}
        className={shopifyConnected ? "bg-gray-600" : "bg-[#5E8E3E]"}
      >
        {isConnecting ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
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
  
  // Panel variant with more details
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
              <span className="animate-spin mr-2">⏳</span>
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
