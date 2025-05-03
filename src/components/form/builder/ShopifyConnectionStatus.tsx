
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
  
  // وظيفة للتحقق من الاتصال بـ Shopify
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
      // 1. التحقق من وجود رمز وصول صالح في قاعدة البيانات
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
      
      // استخدام دالة التحقق من useShopify إذا كانت متاحة
      if (refreshConnection) {
        const isConnected = await refreshConnection();
        console.log('ShopifyConnectionStatus: Connection check result:', isConnected);
        setShowWarning(isConnected !== true);
      } else {
        // استخدام التحقق من الواجهة الحالية إذا كان refreshConnection غير متاح
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
  
  // فحص الاتصال عند بدء التشغيل مع منع التحقق المتكرر
  useEffect(() => {
    // تحقق من وقت آخر فحص لمنع الفحوصات المتكررة
    const lastCheck = parseInt(localStorage.getItem('shopify_connection_status_check') || '0', 10);
    const now = Date.now();
    
    if ((now - lastCheck) > 60000 || !localStorage.getItem('shopify_connection_status')) {
      // تأخير للسماح بتحميل المكونات أولاً
      const timer = setTimeout(() => {
        checkConnection().then(() => {
          // تخزين نتيجة الفحص ووقت الفحص
          localStorage.setItem('shopify_connection_status', showWarning ? 'warning' : 'ok');
          localStorage.setItem('shopify_connection_status_check', now.toString());
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // استخدام النتيجة المخزنة
      const savedStatus = localStorage.getItem('shopify_connection_status');
      setShowWarning(savedStatus === 'warning');
      setConnectionChecked(true);
    }
  }, [shop, shopifyConnected]);
  
  // إضافة دالة للتحقق اليدوي من الاتصال
  const handleCheckNow = async () => {
    if (isCheckingConnection) return;
    
    setIsCheckingConnection(true);
    
    try {
      await checkConnection();
      
      // تحديث حالة الاتصال في العارض
      if (!showWarning) {
        toast.success(language === 'ar' 
          ? 'تم التحقق من الاتصال بنجاح' 
          : 'Connection verified successfully');
      }
    } finally {
      setIsCheckingConnection(false);
    }
  };
  
  // معالجة نقرة زر إعادة الاتصال - نستخدم منهجًا محسنًا
  const handleConnectShopify = () => {
    // منع النقرات المتعددة أو إعادة الاتصال خلال 10 ثوان
    if (isRedirecting) {
      toast.info(language === 'ar' 
        ? 'جاري بالفعل إعادة التوجيه، يرجى الانتظار...' 
        : 'Already redirecting, please wait...');
      return;
    }
    
    // منع محاولات إعادة الاتصال إذا كان لدينا واحدة في آخر 10 ثوان
    const timeSinceLastAttempt = Date.now() - lastReconnectAttempt;
    if (timeSinceLastAttempt < 10000) {
      toast.info(language === 'ar' 
        ? `تم محاولة إعادة الاتصال مؤخرًا، يرجى الانتظار ${Math.ceil((10000 - timeSinceLastAttempt)/1000)} ثواني...` 
        : `Reconnect attempted recently, please wait ${Math.ceil((10000 - timeSinceLastAttempt)/1000)} seconds...`);
      return;
    }
    
    setIsRedirecting(true);
    setLastReconnectAttempt(Date.now());
    
    // مسح جميع بيانات التخزين أولاً
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
    
    // إعادة تعيين علامات الاتصال في سياق المصادقة
    if (refreshShopifyConnection) {
      const result = refreshShopifyConnection();
      console.log('Result from refreshShopifyConnection:', result);
    }
    
    // استخدام وظيفة إعادة الاتصال اليدوية من useShopify إذا كانت متاحة
    if (manualReconnect && typeof manualReconnect === 'function') {
      console.log('Using manualReconnect function from useShopify');
      const success = manualReconnect();
      console.log('Manual reconnect result:', success);
      
      // If manual reconnect failed, use fallback
      if (!success) {
        console.log('Manual reconnect failed, using fallback');
        fallbackReconnect();
      }
    } else {
      console.log('Using fallback reconnect implementation');
      fallbackReconnect();
    }
  };
  
  // Fallback reconnect method
  const fallbackReconnect = () => {
    // عرض رسالة للمستخدم
    toast.info(language === 'ar' 
      ? 'جاري إعادة توجيهك للاتصال بـ Shopify...'
      : 'Redirecting to connect to Shopify...');
    
    // استخدام المسار المباشر لتنقل أكثر موثوقية، مع تأخير قصير
    setTimeout(() => {
      window.location.href = `/shopify?reconnect=true&force=true&ts=${Date.now()}&random=${Math.random().toString(36).substring(7)}`;
    }, 500);
  };

  // لا تظهر أي شيء إذا كنا متصلين أو لم يتم فحص الاتصال بعد
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
