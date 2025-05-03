
import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { useShopify } from '@/hooks/useShopify';
import { ShopifyConnectionManager } from '@/utils/shopifyConnectionManager';

interface ShopifyConnectionBannerProps {
  onReconnect?: () => void;
}

const ShopifyConnectionBanner: React.FC<ShopifyConnectionBannerProps> = ({ onReconnect }) => {
  const { shopifyConnected, shop } = useAuth();
  const { verifyShopifyConnection, manualReconnect, refreshConnection, lastConnectionAttempt } = useShopify();
  const { language } = useI18n();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isConnectionWarning, setIsConnectionWarning] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [showThrottleMessage, setShowThrottleMessage] = useState(false);
  const [throttleTime, setThrottleTime] = useState(0);
  
  // Check connection status when component loads, with throttling
  useEffect(() => {
    if (!shop) {
      setIsConnectionWarning(false);
      return;
    }
    
    const checkIfNeeded = async () => {
      const lastCheckTime = parseInt(localStorage.getItem('shopify_last_check_time') || '0', 10);
      const now = Date.now();
      
      // Only check if the last check was more than 5 minutes ago
      if (shopifyConnected && (now - lastCheckTime > 300000)) {
        try {
          setIsCheckingConnection(true);
          const isConnected = await verifyShopifyConnection();
          setIsConnectionWarning(!isConnected);
          
          // Update check time
          localStorage.setItem('shopify_last_check_time', now.toString());
        } catch (error) {
          console.error('Error checking Shopify connection:', error);
          setIsConnectionWarning(true);
        } finally {
          setIsCheckingConnection(false);
        }
      } else {
        // Use the cached connection status
        setIsConnectionWarning(!shopifyConnected);
      }
    };
    
    // Delay check to prevent issues during initial render
    const timer = setTimeout(() => {
      checkIfNeeded();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [shopifyConnected, shop, verifyShopifyConnection]);

  // Update throttle message timer
  useEffect(() => {
    if (showThrottleMessage && throttleTime > 0) {
      const intervalId = setInterval(() => {
        const timeLeft = ShopifyConnectionManager.getTimeToWait();
        setThrottleTime(timeLeft);
        
        if (timeLeft <= 0) {
          setShowThrottleMessage(false);
          clearInterval(intervalId);
        }
      }, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [showThrottleMessage, throttleTime]);

  const handleCheckConnection = async () => {
    if (isCheckingConnection) return;
    
    setIsCheckingConnection(true);
    try {
      // Use the refreshConnection method
      if (refreshConnection) {
        const isConnected = await refreshConnection();
        setIsConnectionWarning(!isConnected);
        
        if (isConnected) {
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
    }
  };

  const handleReconnect = () => {
    if (isRedirecting) return;
    
    // Check if we should throttle reconnection attempts
    if (ShopifyConnectionManager.shouldThrottle()) {
      const timeToWait = ShopifyConnectionManager.getTimeToWait();
      setThrottleTime(timeToWait);
      setShowThrottleMessage(true);
      
      toast.info(language === 'ar' 
        ? `يرجى الانتظار ${Math.ceil(timeToWait/1000)} ثوانٍ قبل إعادة المحاولة` 
        : `Please wait ${Math.ceil(timeToWait/1000)} seconds before trying again`);
      return;
    }
    
    setIsRedirecting(true);
    ShopifyConnectionManager.recordAttempt();
    
    try {
      // Clear old connection data
      ShopifyConnectionManager.clearConnectionData();
      
      // Use custom reconnect handler if provided
      if (onReconnect) {
        onReconnect();
        return;
      }
      
      // Use general reconnect function
      if (manualReconnect && typeof manualReconnect === 'function') {
        manualReconnect();
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
        {showThrottleMessage ? (
          language === 'ar' 
            ? `تم إجراء العديد من محاولات الاتصال مؤخرًا. يرجى الانتظار ${Math.ceil(throttleTime/1000)} ثوانٍ قبل المحاولة مرة أخرى.`
            : `Too many connection attempts recently. Please wait ${Math.ceil(throttleTime/1000)} seconds before trying again.`
        ) : (
          language === 'ar' 
            ? 'يبدو أن هناك مشكلة في الاتصال مع متجر Shopify الخاص بك. قد يؤثر هذا على عمل النماذج. يرجى الضغط على الزر أدناه لإعادة الاتصال.' 
            : 'There seems to be an issue with your Shopify store connection. This may affect how forms work. Please click the button below to reconnect.'
        )}
      </AlertDescription>

      <div className="flex flex-wrap justify-center gap-4">
        <Button 
          onClick={handleReconnect}
          size="lg"
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-md text-lg font-medium"
          disabled={isRedirecting || showThrottleMessage}
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
