
import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { useShopify } from '@/hooks/useShopify';

interface ShopifyConnectionBannerProps {
  onReconnect?: () => void;
}

const ShopifyConnectionBanner: React.FC<ShopifyConnectionBannerProps> = ({ onReconnect }) => {
  const { shopifyConnected, shop, refreshShopifyConnection } = useAuth();
  const { verifyShopifyConnection, manualReconnect } = useShopify();
  const { language } = useI18n();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isConnectionWarning, setIsConnectionWarning] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [lastCheckTimestamp, setLastCheckTimestamp] = useState<number>(0);

  // Check connection status when component loads, but not too frequently
  useEffect(() => {
    // Don't check if there's no connected shop
    if (!shop) {
      setIsConnectionWarning(false);
      return;
    }
    
    // Only check if we have a supposedly active connection
    // and the last check was more than 5 minutes ago
    const now = Date.now();
    if (shopifyConnected && (now - lastCheckTimestamp > 300000)) {
      const checkConnection = async () => {
        setIsCheckingConnection(true);
        try {
          const isConnected = await verifyShopifyConnection();
          setIsConnectionWarning(!isConnected);
          setLastCheckTimestamp(now);
        } catch (error) {
          console.error('Error checking Shopify connection:', error);
          setIsConnectionWarning(true);
        } finally {
          setIsCheckingConnection(false);
        }
      };
      
      checkConnection();
    }
  }, [shopifyConnected, shop, verifyShopifyConnection, lastCheckTimestamp]);

  const handleCheckConnection = async () => {
    if (isCheckingConnection) return;
    
    setIsCheckingConnection(true);
    try {
      let result;
      if (refreshShopifyConnection) {
        result = await refreshShopifyConnection();
        setIsConnectionWarning(result !== true);
        
        if (result === true) {
          toast.success(language === 'ar' ? 'تم التحقق من الاتصال بنجاح' : 'Connection verified successfully');
        } else {
          toast.error(language === 'ar' ? 'فشل التحقق من الاتصال' : 'Connection verification failed');
        }
      } else {
        const isConnected = await verifyShopifyConnection();
        setIsConnectionWarning(!isConnected);
        
        if (isConnected) {
          toast.success(language === 'ar' ? 'تم التحقق من الاتصال بنجاح' : 'Connection verified successfully');
        } else {
          toast.error(language === 'ar' ? 'فشل التحقق من الاتصال' : 'Connection verification failed');
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء التحقق من الاتصال' : 'Error checking connection');
      setIsConnectionWarning(true);
    } finally {
      setIsCheckingConnection(false);
      setLastCheckTimestamp(Date.now());
    }
  };

  const handleReconnect = () => {
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    
    try {
      // Clear old connection data
      localStorage.removeItem('shopify_connected');
      localStorage.setItem('shopify_last_reconnect', Date.now().toString());
      
      // Use custom reconnect handler if provided
      if (onReconnect) {
        onReconnect();
        return;
      }
      
      // Use general reconnect function
      if (manualReconnect && typeof manualReconnect === 'function') {
        manualReconnect();
        // Don't check return value, just continue with timeout to handle any case
      } else {
        // Direct redirect if no reconnect function available
        window.location.href = `/shopify?force=true&ts=${Date.now()}`;
      }
    } catch (error) {
      console.error('Error during reconnect:', error);
      toast.error(language === 'ar' ? 'خطأ في إعادة الاتصال' : 'Error reconnecting');
      setIsRedirecting(false);
    }
  };

  // Don't show anything if there's no warning to show
  if (!isConnectionWarning || !shopifyConnected) {
    return null;
  }

  return (
    <Alert className="bg-red-50 text-red-800 border-red-300 shadow-lg p-6 text-center mb-4">
      <div className="flex items-center justify-center gap-2 mb-4">
        <AlertCircle className="h-6 w-6 text-red-600" /> 
        <AlertTitle className="text-xl font-bold text-red-700">{language === 'ar' 
          ? 'تنبيه: مشكلة في الاتصال بـ Shopify' 
          : 'Alert: Shopify Connection Issue'}</AlertTitle>
      </div>
      <AlertDescription className="mb-6 text-lg">
        {language === 'ar' 
          ? 'يبدو أن هناك مشكلة في الاتصال مع متجر Shopify الخاص بك. قد يؤثر هذا على عمل النماذج. يرجى الضغط على الزر أدناه لإعادة الاتصال.' 
          : 'There seems to be an issue with your Shopify store connection. This may affect how forms work. Please click the button below to reconnect.'}
      </AlertDescription>

      <div className="flex flex-wrap justify-center gap-4">
        <Button 
          onClick={handleReconnect}
          size="lg"
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-md text-lg font-medium"
          disabled={isRedirecting}
        >
          {isRedirecting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              {language === 'ar' ? 'جاري إعادة الاتصال...' : 'Reconnecting...'}
            </div>
          ) : (
            <>
              <RefreshCw className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'إعادة الاتصال بـ Shopify الآن' : 'Reconnect to Shopify Now'}
            </>
          )}
        </Button>

        <Button
          onClick={handleCheckConnection}
          size="lg"
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50 px-8 py-3 rounded-md text-lg font-medium"
          disabled={isCheckingConnection}
        >
          {isCheckingConnection ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-700 mr-2"></div>
              {language === 'ar' ? 'جاري التحقق...' : 'Checking...'}
            </div>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'التحقق من الاتصال' : 'Check Connection'}
            </>
          )}
        </Button>
      </div>
    </Alert>
  );
};

export default ShopifyConnectionBanner;
