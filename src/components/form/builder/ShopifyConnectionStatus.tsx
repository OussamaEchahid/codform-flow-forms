
import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { useShopify } from '@/hooks/useShopify';
import { supabase } from '@/integrations/supabase/client';

const ShopifyConnectionStatus = () => {
  const { shopifyConnected, shop, refreshShopifyConnection } = useAuth();
  const { manualReconnect, verifyShopifyConnection, refreshConnection } = useShopify();
  const { language } = useI18n();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [lastReconnectAttempt, setLastReconnectAttempt] = useState(0);
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  
  // Function to check connection with Shopify
  const checkConnection = async () => {
    if (!shop) {
      console.log('ShopifyConnectionStatus: No shop to verify');
      setShowWarning(true);
      setConnectionChecked(true);
      return;
    }

    setIsVerifying(true);
    console.log(`ShopifyConnectionStatus: Verifying connection for shop: ${shop}`);
    
    try {
      // 1. Check if there's a valid access token in the database
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shop)
        .maybeSingle();
      
      if (storeError || !storeData || !storeData.access_token) {
        console.log('ShopifyConnectionStatus: No valid token found in database');
        setShowWarning(true);
        setConnectionChecked(true);
        setIsVerifying(false);
        return;
      }
      
      console.log('ShopifyConnectionStatus: Found token in database');
      
      // Use the verification function from useShopify if available
      if (refreshConnection) {
        const isConnected = await refreshConnection();
        console.log('ShopifyConnectionStatus: Connection check result:', isConnected);
        setShowWarning(isConnected !== true);
      } else {
        // Use current interface verification if refreshConnection is not available
        const isConnected = await verifyShopifyConnection();
        console.log('ShopifyConnectionStatus: Legacy connection check result:', isConnected);
        setShowWarning(!isConnected);
      }
      
      setConnectionChecked(true);
      setIsVerifying(false);
    } catch (error) {
      console.error('ShopifyConnectionStatus: Error during connection check:', error);
      setShowWarning(true);
      setConnectionChecked(true);
      setIsVerifying(false);
    }
  };
  
  // Check connection on startup while preventing frequent checks
  useEffect(() => {
    // Check the last check time to prevent frequent checks
    const lastCheck = parseInt(localStorage.getItem('shopify_connection_status_check') || '0', 10);
    const now = Date.now();
    
    if ((now - lastCheck) > 60000 || !localStorage.getItem('shopify_connection_status')) {
      // Delay to allow components to load first
      const timer = setTimeout(() => {
        checkConnection().then(() => {
          // Store check result and time
          localStorage.setItem('shopify_connection_status', showWarning ? 'warning' : 'ok');
          localStorage.setItem('shopify_connection_status_check', now.toString());
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Use stored result
      const savedStatus = localStorage.getItem('shopify_connection_status');
      setShowWarning(savedStatus === 'warning');
      setConnectionChecked(true);
    }
  }, [shop, shopifyConnected]);
  
  // Add function for manual connection check
  const handleCheckNow = async () => {
    if (isCheckingConnection) return;
    
    setIsCheckingConnection(true);
    
    try {
      await checkConnection();
      
      // Update connection status in the UI
      if (!showWarning) {
        toast.success(language === 'ar' 
          ? 'تم التحقق من الاتصال بنجاح' 
          : 'Connection verified successfully');
      }
    } finally {
      setIsCheckingConnection(false);
    }
  };
  
  // Handle reconnect button click - use improved approach
  const handleConnectShopify = () => {
    // Prevent multiple clicks or reconnection within 10 seconds
    if (isRedirecting) {
      toast.info(language === 'ar' 
        ? 'جاري بالفعل إعادة التوجيه، يرجى الانتظار...' 
        : 'Already redirecting, please wait...');
      return;
    }
    
    // Prevent reconnection attempts if we have one in the last 10 seconds
    const timeSinceLastAttempt = Date.now() - lastReconnectAttempt;
    if (timeSinceLastAttempt < 10000) {
      toast.info(language === 'ar' 
        ? `تم محاولة إعادة الاتصال مؤخرًا، يرجى الانتظار ${Math.ceil((10000 - timeSinceLastAttempt)/1000)} ثواني...` 
        : `Reconnect attempted recently, please wait ${Math.ceil((10000 - timeSinceLastAttempt)/1000)} seconds...`);
      return;
    }
    
    setIsRedirecting(true);
    setLastReconnectAttempt(Date.now());
    
    // Clear all storage data first
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_temp_store');
    localStorage.removeItem('shopify_connection_verified');
    localStorage.removeItem('shopify_last_connection_check');
    localStorage.removeItem('shopify_connection_status');
    localStorage.removeItem('shopify_connection_status_check');
    sessionStorage.removeItem('shopify_redirect_attempts');
    sessionStorage.removeItem('shopify_connecting');
    sessionStorage.removeItem('shopify_callback_attempts');
    
    // Reset connection flags in auth context
    if (refreshShopifyConnection) {
      refreshShopifyConnection();
    }
    
    // Use the manual reconnect function from useShopify if available
    if (manualReconnect && typeof manualReconnect === 'function') {
      console.log('Using manualReconnect function from useShopify');
      manualReconnect();
      
      // Set a timeout to use fallback in case manualReconnect doesn't redirect
      setTimeout(() => {
        if (!document.hidden) { // If we're still on the page
          fallbackReconnect();
        }
      }, 2000);
    } else {
      console.log('Using fallback reconnect implementation');
      fallbackReconnect();
    }
  };
  
  // Fallback reconnect method
  const fallbackReconnect = () => {
    // Show message to user
    toast.info(language === 'ar' 
      ? 'جاري إعادة توجيهك للاتصال بـ Shopify...'
      : 'Redirecting to connect to Shopify...');
    
    // Use direct path for more reliable navigation, with short delay
    setTimeout(() => {
      window.location.href = `/shopify?reconnect=true&force=true&ts=${Date.now()}&random=${Math.random().toString(36).substring(7)}`;
    }, 500);
  };

  // Don't show anything if we're connected or haven't checked connection yet
  if ((connectionChecked && !showWarning) || isVerifying || !connectionChecked) {
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

      <div className="flex flex-wrap justify-center gap-4">
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

        <Button
          onClick={handleCheckNow}
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

      <p className="mt-4 text-sm text-red-700">{language === 'ar' 
        ? 'سيؤدي هذا إلى مسح جميع بيانات الجلسة وإعادة الاتصال بالكامل. قد تحتاج إلى إعادة تسجيل الدخول.' 
        : 'This will clear all session data and perform a complete reconnection. You may need to log in again.'}</p>
    </Alert>
  );
};

export default ShopifyConnectionStatus;
