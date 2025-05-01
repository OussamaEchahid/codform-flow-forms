
import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { useShopify } from '@/hooks/useShopify';

const ShopifyConnectionStatus = () => {
  const { shopifyConnected, shop, refreshShopifyConnection } = useAuth();
  const { isConnected, manualReconnect } = useShopify();
  const { language } = useI18n();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [lastReconnectAttempt, setLastReconnectAttempt] = useState(0);
  
  // Combine all connection indicators to determine real connection status
  const isActuallyConnected = shopifyConnected && shop && isConnected;
  
  useEffect(() => {
    // Check connection status on mount 
    const initialCheck = () => {
      // Log current connection status variables for debugging
      console.log('ShopifyConnectionStatus connection check:', { 
        shopifyConnected, 
        shop,
        isConnected,
        isActuallyConnected: shopifyConnected && shop && isConnected
      });
      
      // Only show warning if any connection indicator is false
      const shouldShowWarning = !shopifyConnected || !shop || !isConnected;
      setShowWarning(shouldShowWarning);
      
      // If connected, ensure warning is hidden
      if (isActuallyConnected) {
        setShowWarning(false);
        console.log('Connection confirmed, hiding warning');
      }
    };
    
    // Run initial check
    initialCheck();
    
    // Set up interval to check connection status periodically - reduced frequency
    const intervalId = setInterval(() => {
      const shouldShowWarning = !shopifyConnected || !shop || !isConnected;
      
      // Only update state if there's a change to avoid unnecessary re-renders
      if (shouldShowWarning !== showWarning) {
        setShowWarning(shouldShowWarning);
        
        // Log only when status changes
        if (!shouldShowWarning) {
          console.log('Connection confirmed, hiding warning');
        } else {
          console.log('Connection issue detected, showing warning');
        }
      }
    }, 10000); // Check less frequently (10 seconds)
    
    return () => clearInterval(intervalId);
  }, [shopifyConnected, shop, isConnected, showWarning]);
  
  // Handle manual connection button click with improved reliability
  const handleConnectShopify = () => {
    // Prevent multiple clicks or reconnects within 10 seconds
    if (isRedirecting) {
      toast.info(language === 'ar' 
        ? 'جاري بالفعل إعادة التوجيه، يرجى الانتظار...' 
        : 'Already redirecting, please wait...');
      return;
    }
    
    // Prevent reconnect attempts if we had one in the last 10 seconds
    const timeSinceLastAttempt = Date.now() - lastReconnectAttempt;
    if (timeSinceLastAttempt < 10000) {
      toast.info(language === 'ar' 
        ? `تم محاولة إعادة الاتصال مؤخرًا، يرجى الانتظار ${Math.ceil((10000 - timeSinceLastAttempt)/1000)} ثواني...` 
        : `Reconnect attempted recently, please wait ${Math.ceil((10000 - timeSinceLastAttempt)/1000)} seconds...`);
      return;
    }
    
    setIsRedirecting(true);
    setLastReconnectAttempt(Date.now());
    
    // Use the manualReconnect function from useShopify if available
    if (manualReconnect && typeof manualReconnect === 'function') {
      manualReconnect();
    } else {
      // Fallback to previous implementation if manualReconnect not available
      // Clear ALL locally stored data to ensure clean reconnection
      localStorage.clear(); 
      sessionStorage.clear(); 
      
      // Show message to user
      toast.info(language === 'ar' 
        ? 'جاري إعادة توجيهك للاتصال بـ Shopify...'
        : 'Redirecting to connect to Shopify...');
      
      // Use direct path for more reliable navigation, with a short delay
      setTimeout(() => {
        window.location.href = '/shopify?reconnect=true&force=true&ts=' + Date.now() + '&random=' + Math.random();
      }, 500);
    }
  };

  // Don't show anything if we're connected or warning is hidden
  if (!showWarning || isActuallyConnected) {
    return null;
  }
  
  return (
    <Alert className="bg-red-50 text-red-800 border-red-300 z-50 shadow-lg p-6 text-center mb-4">
      <div className="flex items-center justify-center gap-2 mb-4">
        <AlertCircle className="h-6 w-6 text-red-600" /> 
        <AlertTitle className="text-xl font-bold text-red-700">{language === 'ar' 
          ? 'تنبيه هام: يوجد مشكلة في الاتصال بـ Shopify' 
          : 'Important Alert: Shopify Connection Issue'}</AlertTitle>
      </div>
      <AlertDescription className="mb-6 text-lg">
        {language === 'ar' 
          ? 'نواجه مشكلة في الاتصال بـ Shopify. هذا قد يمنع تحميل النموذج والعمل بشكل صحيح. يرجى النقر على الزر أدناه لإعادة الاتصال.' 
          : 'We are experiencing an issue with the Shopify connection. This may prevent the form from loading and functioning properly. Please click the button below to reconnect.'}
      </AlertDescription>
      <Button 
        onClick={handleConnectShopify}
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
      <p className="mt-4 text-sm text-red-700">{language === 'ar' 
        ? 'سيؤدي هذا إلى مسح جميع بيانات الجلسة وإعادة الاتصال بالكامل. قد تحتاج إلى إعادة تسجيل الدخول.' 
        : 'This will clear all session data and perform a complete reconnection. You may need to log in again.'}</p>
    </Alert>
  );
};

export default ShopifyConnectionStatus;
