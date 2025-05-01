
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
    // Check connection status on mount
    const initialCheck = () => {
      const shouldShowWarning = !shopifyConnected || !shop;
      setShowWarning(shouldShowWarning);
      console.log('ShopifyConnectionStatus initial check:', { shopifyConnected, shop, shouldShowWarning });
    };
    
    initialCheck();
    
    // Re-check every 10 seconds, but don't show too many warnings in succession
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
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [shopifyConnected, shop, lastReconnectAttempt]);
  
  // Handle manual connection button click
  const handleConnectShopify = () => {
    // Prevent multiple clicks or reconnects within 30 seconds
    if (isRedirecting) {
      toast.info(language === 'ar' 
        ? 'جاري بالفعل إعادة التوجيه، يرجى الانتظار...' 
        : 'Already redirecting, please wait...');
      return;
    }
    
    // Prevent reconnect attempts if we had one in the last 30 seconds
    const timeSinceLastAttempt = Date.now() - lastReconnectAttempt;
    if (timeSinceLastAttempt < 30000) {
      toast.info(language === 'ar' 
        ? `تم محاولة إعادة الاتصال مؤخرًا، يرجى الانتظار ${Math.ceil((30000 - timeSinceLastAttempt)/1000)} ثواني...` 
        : `Reconnect attempted recently, please wait ${Math.ceil((30000 - timeSinceLastAttempt)/1000)} seconds...`);
      return;
    }
    
    setIsRedirecting(true);
    setLastReconnectAttempt(Date.now());
    
    // Clear all locally stored data to ensure clean reconnection
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_reconnect_attempts');
    localStorage.removeItem('shopify_last_connect_time');
    localStorage.removeItem('shopify_last_redirect_time');
    localStorage.removeItem('shopify_temp_store');
    
    // Update auth context if available
    if (refreshShopifyConnection) {
      refreshShopifyConnection();
    }
    
    // Show message to user
    toast.info(language === 'ar' 
      ? 'جاري إعادة توجيهك للاتصال بـ Shopify...'
      : 'Redirecting to connect to Shopify...');
    
    // Add a longer delay to prevent rapid redirections
    setTimeout(() => {
      // Use direct path for more reliable navigation
      window.location.href = '/shopify?reconnect=true&ts=' + Date.now();
      
      // Reset redirect state after a timeout in case navigation fails
      setTimeout(() => {
        setIsRedirecting(false);
      }, 5000);
    }, 1500);
  };
  
  if (!showWarning) {
    return null;
  }
  
  return (
    <Alert className="bg-yellow-100 text-yellow-800 z-50 shadow-lg p-6 text-center mb-4 border-yellow-300">
      <div className="flex items-center justify-center gap-2 mb-4">
        <AlertCircle className="h-6 w-6" /> 
        <AlertTitle className="text-xl font-bold">{language === 'ar' 
          ? 'تنبيه: هناك مشكلة في الاتصال بـ Shopify' 
          : 'Alert: Shopify Connection Issue'}</AlertTitle>
      </div>
      <AlertDescription className="mb-4 text-lg">
        {language === 'ar' 
          ? 'هناك مشكلة في الاتصال بـ Shopify. يرجى النقر على الزر أدناه لإعادة الاتصال يدويًا.' 
          : 'There is an issue with your Shopify connection. Please click the button below to reconnect manually.'}
      </AlertDescription>
      <Button 
        onClick={handleConnectShopify}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-md text-lg font-medium"
        size="lg"
        disabled={isRedirecting}
      >
        {isRedirecting ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
            {language === 'ar' ? 'جاري التوجيه...' : 'Redirecting...'}
          </div>
        ) : (
          <>
            <RefreshCw className="h-5 w-5 mr-2" />
            {language === 'ar' ? 'إعادة الاتصال بـ Shopify' : 'Reconnect to Shopify'}
          </>
        )}
      </Button>
      <p className="mt-4 text-sm">{language === 'ar' 
        ? 'سيتم مسح بيانات الاتصال السابقة وتوجيهك إلى صفحة Shopify للبدء من جديد' 
        : 'Previous connection data will be cleared and you will be redirected to Shopify page to start fresh'}</p>
    </Alert>
  );
};

export default ShopifyConnectionStatus;
