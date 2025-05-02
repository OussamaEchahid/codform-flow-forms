
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { RefreshCw, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface ShopifyConnectionManagerProps {
  onConnectionSuccess?: () => void;
  variant?: 'card' | 'button' | 'minimal';
  className?: string;
  showErrors?: boolean;
}

/**
 * مكون محسّن لإدارة حالة اتصال Shopify مع معالجة اتصال أكثر موثوقية
 * نسخة v2.1 مع تحسينات للتعامل مع مشكلات الاتصال
 */
export const ShopifyConnectionManager: React.FC<ShopifyConnectionManagerProps> = ({ 
  onConnectionSuccess,
  variant = 'card',
  className = '',
  showErrors = true
}) => {
  const { shopifyConnected, shop, refreshShopifyConnection, forceReconnect } = useAuth();
  const { language, t } = useI18n();
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectionTime, setLastConnectionTime] = useState<number | null>(null);
  const [connectionCheckInProgress, setConnectionCheckInProgress] = useState(false);
  
  // تسجيل محاولات الاتصال
  useEffect(() => {
    const attempts = parseInt(localStorage.getItem('shopify_connection_attempts') || '0', 10);
    setConnectionAttempts(attempts);
    
    const lastTime = parseInt(localStorage.getItem('shopify_last_connection_attempt') || '0', 10);
    setLastConnectionTime(lastTime || null);
    
    // إذا كنا متصلين بالفعل، تحقق من صحة الاتصال
    if (shopifyConnected && shop && !connectionCheckInProgress) {
      verifyConnectionStatus();
    }
  }, [shopifyConnected, shop]);
  
  // التحقق من حالة الاتصال
  const verifyConnectionStatus = async () => {
    if (connectionCheckInProgress || !shop) return;
    
    setConnectionCheckInProgress(true);
    try {
      console.log("ShopifyConnectionManager: Verifying connection status for shop", shop);
      const { data, error } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shop)
        .maybeSingle();
      
      if (error) {
        console.error("ShopifyConnectionManager: Error verifying token:", error);
      }
      
      if (!data || !data.access_token) {
        console.log("ShopifyConnectionManager: No valid token found for shop", shop);
        
        // فحص إذا كان المتصفح حديثًا معاد تحميله، اترك فرصة للتحقق من الاتصال
        const pageLoadTime = parseInt(sessionStorage.getItem('page_load_time') || '0', 10);
        const timeSincePageLoad = Date.now() - pageLoadTime;
        
        if (timeSincePageLoad > 5000) {
          // تم تحميل الصفحة منذ أكثر من 5 ثوان، من المرجح أن يكون الاتصال غير صالح
          localStorage.removeItem('shopify_connected');
          localStorage.removeItem('shopify_store');
          
          if (refreshShopifyConnection) {
            refreshShopifyConnection();
          }
          
          console.log("ShopifyConnectionManager: Removed invalid connection data");
        }
      } else {
        console.log("ShopifyConnectionManager: Token verified for shop", shop);
      }
    } catch (e) {
      console.error("ShopifyConnectionManager: Error during connection verification:", e);
    } finally {
      setConnectionCheckInProgress(false);
    }
  };
  
  // تسجيل وقت تحميل الصفحة لمساعدة في تتبع حالة الاتصال
  useEffect(() => {
    // تسجيل وقت تحميل الصفحة لاستخدامه في التحقق من الاتصال
    if (!sessionStorage.getItem('page_load_time')) {
      sessionStorage.setItem('page_load_time', Date.now().toString());
    }
  }, []);
  
  // إعادة ضبط حالة الاتصال إذا لزم الأمر عند تركيب المكون
  useEffect(() => {
    // إذا اكتشفنا محاولات متعددة حديثة، تحقق مما إذا كان الرمز المميز صالحًا بالفعل
    if (shopifyConnected && shop && connectionAttempts > 2) {
      const verifyConnection = async () => {
        try {
          const { data, error } = await supabase
            .from('shopify_stores')
            .select('access_token')
            .eq('shop', shop)
            .maybeSingle();
            
          if (error || !data?.access_token) {
            console.log("ShopifyConnectionManager: Token verification failed, clearing connection state");
            localStorage.removeItem('shopify_store');
            localStorage.removeItem('shopify_connected');
            localStorage.removeItem('shopify_last_connect_time');
            if (refreshShopifyConnection) {
              refreshShopifyConnection();
            }
          } else {
            console.log("ShopifyConnectionManager: Token verified, connection is valid");
          }
        } catch (e) {
          console.error("ShopifyConnectionManager: Error verifying token:", e);
        }
      };
      
      verifyConnection();
    }
  }, [shop, shopifyConnected, connectionAttempts, refreshShopifyConnection]);

  // استخدام مسار مباشر للمصادقة
  const useDirectAuthPath = () => {
    if (lastConnectionTime && Date.now() - lastConnectionTime < 30000) {
      // إذا كانت هناك محاولة اتصال حديثة، استخدم طريقة مختلفة
      return connectionAttempts % 2 === 0;
    }
    
    // التناوب بين الطرق المختلفة بناءً على عدد محاولات الاتصال
    return connectionAttempts % 3 === 0;
  };
  
  // معالجة اتصال مباشر وموثوق
  const handleConnect = useCallback(async () => {
    if (isConnecting) {
      console.log("ShopifyConnectionManager: Already attempting to connect, ignoring duplicate request");
      return;
    }
    
    try {
      setIsConnecting(true);
      setErrorDetails(null);
      
      // تحديث عداد محاولات الاتصال
      const attempts = parseInt(localStorage.getItem('shopify_connection_attempts') || '0', 10);
      localStorage.setItem('shopify_connection_attempts', (attempts + 1).toString());
      localStorage.setItem('shopify_last_connection_attempt', Date.now().toString());
      setConnectionAttempts(attempts + 1);
      setLastConnectionTime(Date.now());
      
      // مسح أي بيانات Shopify موجودة
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_last_connect_time');
      localStorage.removeItem('shopify_temp_store');
      
      // إضافة طابع زمني لمنع التخزين المؤقت وضمان تدفق مصادقة جديد
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      
      // تحديث حالة الاتصال في سياق المصادقة
      if (forceReconnect) {
        forceReconnect();
      } else if (refreshShopifyConnection) {
        refreshShopifyConnection();
      }
      
      // إظهار نخبة الاتصال
      toast.info(language === 'ar' 
        ? 'جاري توجيهك للاتصال بـ Shopify...' 
        : 'Redirecting to connect with Shopify...', 
        { duration: 5000 }
      );
      
      // قبل استدعاء واجهة برمجة التطبيقات، تأكد من عدم وجود توجيهات متعددة
      if (sessionStorage.getItem('shopify_connecting') === 'true' && 
          Date.now() - parseInt(sessionStorage.getItem('shopify_connecting_time') || '0', 10) < 10000) {
        console.log("ShopifyConnectionManager: Ongoing connection attempt detected, ignoring");
        setTimeout(() => setIsConnecting(false), 3000);
        return;
      }
      
      // وضع علامة على الاتصال الجاري
      sessionStorage.setItem('shopify_connecting', 'true');
      sessionStorage.setItem('shopify_connecting_time', Date.now().toString());
      
      // اتخاذ القرار بشأن مسار المصادقة بناءً على محاولات الاتصال السابقة
      const useDirectPath = useDirectAuthPath();
      console.log(`ShopifyConnectionManager: Using ${useDirectPath ? 'direct auth path' : 'edge function'} (attempts: ${attempts})`);
      
      if (useDirectPath) {
        // الطريقة 1: توجيه مباشر إلى مسار المصادقة الخاص بنا
        const authPath = `/auth?ts=${timestamp}&r=${randomStr}&force=true`;
        console.log("ShopifyConnectionManager: Using direct auth path:", authPath);
        window.location.href = authPath;
      } else {
        // الطريقة 2: استدعاء دالة حافة Edge Function
        const apiUrl = `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?ts=${timestamp}&r=${randomStr}&client=${encodeURIComponent(window.location.origin)}&debug=true`;
        console.log("ShopifyConnectionManager: Calling authentication endpoint:", apiUrl);
        
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocXJuZ2R6dWF0ZG5ma2lodHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDM2MTgsImV4cCI6MjA2MTE3OTYxOH0.bebH8nV_6W0DpwjmS_vYFB2P9xVU-txCRvQc6Jt5DdA'
            }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`ShopifyConnectionManager: API error: ${response.status} - ${errorText}`);
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.redirect) {
            console.log("ShopifyConnectionManager: Redirecting to Shopify authentication URL:", data.redirect);
            window.location.href = data.redirect;
          } else if (data.success && data.shop && data.hasExistingToken) {
            console.log("ShopifyConnectionManager: Connection already established with store:", data.shop);
            localStorage.setItem('shopify_store', data.shop);
            localStorage.setItem('shopify_connected', 'true');
            localStorage.setItem('shopify_last_connect_time', Date.now().toString());
            
            // إزالة علامة الاتصال الجاري
            sessionStorage.removeItem('shopify_connecting');
            
            // تحديث حالة الاتصال
            if (refreshShopifyConnection) {
              refreshShopifyConnection();
            }
            
            // استدعاء رد الاتصال عند النجاح
            if (onConnectionSuccess) {
              onConnectionSuccess();
            }
            
            // عرض نخبة نجاح
            toast.success(language === 'ar'
              ? `تم الاتصال بنجاح بمتجر ${data.shop}`
              : `Successfully connected to ${data.shop}`
            );
            
            // التنقل إلى لوحة التحكم بمعلمات النجاح
            if (data.redirect) {
              window.location.href = data.redirect;
            } else {
              window.location.href = `/dashboard?shopify_connected=true&shop=${encodeURIComponent(data.shop)}&reconnected=true`;
            }
          } else {
            throw new Error("Invalid response from authentication endpoint");
          }
        } catch (error) {
          console.error("ShopifyConnectionManager: API error:", error);
          setErrorDetails(error instanceof Error ? error.message : "Error during connection");
          
          // احتياطي: التنقل المباشر إلى مسار المصادقة الخاص بنا
          console.log("ShopifyConnectionManager: Using fallback authentication navigation");
          
          // اعط بعض الوقت لظهور الخطأ ثم قم بإعادة التوجيه
          setTimeout(() => {
            const authPath = `/auth?ts=${timestamp}&r=${randomStr}&fallback=true&force=true`;
            window.location.href = authPath;
          }, 1500);
        }
      }
    } catch (error) {
      console.error("ShopifyConnectionManager: Error initiating Shopify connection:", error);
      setErrorDetails(error instanceof Error ? error.message : "Error during connection attempt");
      toast.error(language === 'ar'
        ? 'حدث خطأ أثناء توجيهك للاتصال. يرجى المحاولة مرة أخرى.'
        : 'Error during connection redirect. Please try again.');
    } finally {
      // إعادة تعيين حالة الاتصال بعد فترة زمنية في حالة عدم حدوث إعادة توجيه
      setTimeout(() => {
        setIsConnecting(false);
        // إزالة علامة الاتصال الجاري بعد فترة زمنية كافية
        sessionStorage.removeItem('shopify_connecting'); 
      }, 10000);
    }
  }, [shop, isConnecting, language, onConnectionSuccess, refreshShopifyConnection, forceReconnect, useDirectAuthPath]);

  // استدعاء إعادة توجيه الاتصال مرة واحدة في حالة إعادة التحميل السريع - منع حلقات إعادة التوجيه
  useEffect(() => {
    // فحص ما إذا كان هناك علامة إعادة اتصال في URL
    const urlParams = new URLSearchParams(window.location.search);
    const reconnect = urlParams.get('reconnect');
    const shouldReconnect = urlParams.get('force') === 'true';
    
    // إذا تم تحديد reconnect وتم تحميل الصفحة للتو، ولكن لا تقم بتشغيله إذا كان قد تم ذلك حديثًا
    if ((reconnect || shouldReconnect) && !isConnecting && 
        (!lastConnectionTime || Date.now() - lastConnectionTime > 10000)) {
      console.log("ShopifyConnectionManager: Reconnect parameter detected, initiating automatic connection");
      // تأخير قصير للسماح بتحميل المكونات
      setTimeout(() => {
        handleConnect();
      }, 800);
      
      // تنظيف معلمات URL
      if (window.history.replaceState && !shouldReconnect) {
        const cleanUrl = window.location.pathname + 
          window.location.search.replace(/[?&]reconnect=[^&]+/, '') + 
          window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, [handleConnect, isConnecting, lastConnectionTime]);

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
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
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
        {!shopifyConnected && !errorDetails && (
          <p className="text-sm text-gray-600 mb-4">
            {language === 'ar' 
              ? 'سيتم توجيهك إلى Shopify للتصريح بالوصول. هذه عملية آمنة وموثوقة.'
              : 'You will be redirected to Shopify for authorization. This is a secure and trusted process.'}
          </p>
        )}
        
        {errorDetails && showErrors && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="text-sm">
              {language === 'ar' 
                ? `حدثت مشكلة أثناء محاولة الاتصال: ${errorDetails}` 
                : `Connection problem: ${errorDetails}`}
            </AlertDescription>
          </Alert>
        )}
        
        {errorDetails && showErrors && (
          <div className="text-sm text-gray-600 mb-4">
            <p className="mb-2 font-medium">
              {language === 'ar' 
                ? 'جرب هذه الخطوات:' 
                : 'Try these steps:'}
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                {language === 'ar' 
                  ? 'تأكد من أن متصفحك محدّث' 
                  : 'Ensure your browser is updated'}
              </li>
              <li>
                {language === 'ar' 
                  ? 'تأكد من تفعيل الكوكيز والسماح بالنوافذ المنبثقة' 
                  : 'Make sure cookies and pop-ups are enabled'}
              </li>
              <li>
                {language === 'ar' 
                  ? 'استخدم زر "اتصال مباشر" أدناه للاتصال بطريقة بديلة' 
                  : 'Use the "Direct Connect" button below to connect with an alternative method'}
              </li>
            </ol>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col space-y-2">
        <Button 
          onClick={handleConnect}
          className="w-full bg-[#5E6EBF] hover:bg-[#4E5EAF]"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
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
        
        {errorDetails && (
          <Button
            variant="outline"
            className="w-full text-sm"
            onClick={() => {
              const authPath = `/auth?ts=${Date.now()}&r=${Math.random().toString(36).substring(7)}&direct=true&force=true`;
              window.location.href = authPath;
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'اتصال مباشر (بديل)' : 'Direct Connect (Alternative)'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ShopifyConnectionManager;
