
import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

const ShopifyConnectionStatus = () => {
  const { shopifyConnected, shop, refreshShopifyConnection } = useAuth();
  const { language } = useI18n();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [lastReconnectAttempt, setLastReconnectAttempt] = useState(0);
  
  useEffect(() => {
    // Check connection status on mount and force show warning
    const initialCheck = () => {
      // Always show warning during initial load until we confirm connection
      setShowWarning(true);
      console.log('ShopifyConnectionStatus initial check:', { shopifyConnected, shop });
      
      // If connected, hide warning after a short delay
      if (shopifyConnected && shop) {
        setTimeout(() => {
          setShowWarning(false);
          console.log('Connection confirmed, hiding warning');
        }, 500);
      }
    };
    
    // Run initial check
    initialCheck();
    
    // Set up interval to check connection status periodically
    const intervalId = setInterval(() => {
      const shouldShowWarning = !shopifyConnected || !shop;
      setShowWarning(shouldShowWarning);
      
      // Log connection state for debugging
      console.log('ShopifyConnectionStatus interval check:', { 
        shopifyConnected, 
        shop,
        shouldShowWarning,
        timeSinceLastReconnect: Date.now() - lastReconnectAttempt
      });
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [shopifyConnected, shop, lastReconnectAttempt]);
  
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
    
    // Clear ALL locally stored data to ensure clean reconnection
    localStorage.clear(); // Clear everything to ensure a fresh start
    sessionStorage.clear(); // Also clear session storage
    
    // Show message to user
    toast.info(language === 'ar' 
      ? 'جاري إعادة توجيهك للاتصال بـ Shopify...'
      : 'Redirecting to connect to Shopify...');
    
    // Use direct path for more reliable navigation, with a short delay
    setTimeout(() => {
      window.location.href = '/shopify?reconnect=true&force=true&ts=' + Date.now() + '&random=' + Math.random();
    }, 500);
  };

  // Don't show anything if we're connected
  if (!showWarning) {
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
