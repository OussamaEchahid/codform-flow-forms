
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export interface ShopifyConnectionManagerProps {
  onConnectionSuccess?: () => void;
  variant?: 'card' | 'button' | 'minimal';
  className?: string;
}

/**
 * Component for managing Shopify connection state with reliable connection handling
 */
export const ShopifyConnectionManager: React.FC<ShopifyConnectionManagerProps> = ({ 
  onConnectionSuccess,
  variant = 'card',
  className = ''
}) => {
  const { shopifyConnected, shop, refreshShopifyConnection } = useAuth();
  const { language, t } = useI18n();
  const [isConnecting, setIsConnecting] = useState(false);

  // Guaranteed reliable connection handling
  const handleConnect = () => {
    if (isConnecting) return;
    
    try {
      setIsConnecting(true);
      
      // Clear any existing Shopify data
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_last_connect_time');
      localStorage.removeItem('shopify_temp_store');
      
      // Add timestamp to prevent caching and ensure fresh auth flow
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      
      // Refresh connection state in auth context
      if (refreshShopifyConnection) {
        refreshShopifyConnection();
      }
      
      // Show connecting toast
      toast.info(language === 'ar' 
        ? 'جاري توجيهك للاتصال بـ Shopify...' 
        : 'Redirecting to connect with Shopify...', 
        { duration: 5000 }
      );
      
      // Use direct URL navigation for most reliable redirect
      setTimeout(() => {
        window.location.href = `/shopify?ts=${timestamp}&r=${randomStr}&force=true`;
      }, 500);
    } catch (error) {
      console.error("Error initiating Shopify connection:", error);
      toast.error(language === 'ar'
        ? 'حدث خطأ أثناء توجيهك للاتصال. يرجى المحاولة مرة أخرى.'
        : 'Error during connection redirect. Please try again.');
      setIsConnecting(false);
    }
  };

  if (variant === 'minimal') {
    return (
      <Button 
        onClick={handleConnect}
        className={className}
        disabled={isConnecting}
        variant="outline"
      >
        {isConnecting ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
            {language === 'ar' ? 'جاري التوجيه...' : 'Redirecting...'}
          </div>
        ) : (
          <>
            {language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect Shopify'}
          </>
        )}
      </Button>
    );
  }
  
  if (variant === 'button') {
    return (
      <Button 
        onClick={handleConnect}
        className={`bg-[#5E6EBF] hover:bg-[#4E5EAF] ${className}`}
        disabled={isConnecting}
        size="lg"
      >
        {isConnecting ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
            {language === 'ar' ? 'جاري التوجيه...' : 'Redirecting...'}
          </div>
        ) : (
          <div className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            {language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect to Shopify'}
          </div>
        )}
      </Button>
    );
  }

  return (
    <Card className={`shadow-lg border-yellow-100 ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl">
          {shopifyConnected && shop 
            ? (language === 'ar' ? 'متصل بـ Shopify' : 'Connected to Shopify') 
            : (language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect to Shopify')
          }
        </CardTitle>
        <CardDescription>
          {shopifyConnected && shop 
            ? (language === 'ar' 
              ? `متصل بمتجر: ${shop}` 
              : `Connected to store: ${shop}`) 
            : (language === 'ar' 
              ? 'قم بتوصيل متجر Shopify الخاص بك للاستفادة من جميع المزايا' 
              : 'Connect your Shopify store to access all features')
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!shopifyConnected && (
          <p className="text-sm text-gray-600 mb-4">
            {language === 'ar' 
              ? 'سيتم توجيهك إلى Shopify للتصريح بالوصول. هذه عملية آمنة وموثوقة.'
              : 'You will be redirected to Shopify for authorization. This is a secure and trusted process.'}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleConnect}
          className="w-full bg-[#5E6EBF] hover:bg-[#4E5EAF]"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              {language === 'ar' ? 'جاري التوجيه...' : 'Redirecting...'}
            </div>
          ) : shopifyConnected ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'إعادة الاتصال' : 'Reconnect'}
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'الاتصال الآن' : 'Connect Now'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ShopifyConnectionManager;
