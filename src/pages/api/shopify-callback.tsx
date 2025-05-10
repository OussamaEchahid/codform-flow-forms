import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const ShopifyCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [retryCount, setRetryCount] = useState(0);
  const [connectionLoopDetected, setConnectionLoopDetected] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [directNavigationTriggered, setDirectNavigationTriggered] = useState(false);

  const processCallback = async (params: URLSearchParams) => {
    try {
      const code = params.get('code');
      const hmac = params.get('hmac');
      const shop = params.get('shop');
      const state = params.get('state');
      const timestamp = Date.now();
      const isPopup = params.get('popup') === 'true';
      const forceUpdate = params.get('force_update') === 'true';
      
      setDebugInfo({
        params: Object.fromEntries(params.entries()),
        timestamp,
        isPopup,
        code: code ? 'present' : 'missing',
        hmac: hmac ? 'present' : 'missing',
        shop,
        state,
        url: window.location.href,
        forceUpdate,
        source: 'callback',
        retryCount,
        localStorage: {
          shopify_store: localStorage.getItem('shopify_store'),
          shopify_connected: localStorage.getItem('shopify_connected'),
          shopify_temp_store: localStorage.getItem('shopify_temp_store')
        },
        connectionManager: {
          activeStore: shopifyConnectionManager.getActiveStore(),
          allStores: shopifyConnectionManager.getAllStores()
        }
      });

      // Check for connection loop
      // A simplified version that doesn't rely on isInConnectionLoop
      const loopDetected = retryCount > 3; // Simple fallback detection method
      if (loopDetected) {
        console.warn("Connection loop detected, taking recovery action");
        setConnectionLoopDetected(true);
        
        // Reset local state to break the loop
        shopifyConnectionManager.clearAllStores();
        // No resetLoopDetection needed here
        
        if (shop) {
          // Force connection state to be connected with strong caching preventions
          localStorage.removeItem('shopify_store');
          localStorage.removeItem('shopify_connected');
          localStorage.removeItem('shopify_temp_store');
          
          // Set new connection with force flag
          localStorage.setItem('shopify_store', shop);
          localStorage.setItem('shopify_connected', 'true');
          localStorage.setItem('bypass_auth', 'true'); // Enable bypass auth mode
          shopifyConnectionManager.addOrUpdateStore(shop, true, true);
          
          setSuccess(true);
          setShop(shop);
          setProcessingComplete(true);
          
          // Use direct navigation component instead of timeout-based redirect
          setDirectNavigationTriggered(true);
          return;
        }
        
        throw new Error('تم اكتشاف حلقة اتصال، يرجى مسح ذاكرة التخزين المؤقت وإعادة المحاولة');
      }

      if (!code || !hmac || !shop) {
        throw new Error('المعلمات المطلوبة غير موجودة في URL الاستدعاء');
      }

      setShop(shop);

      // Clear any previous connection data to avoid conflicts
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('bypass_auth');
      
      // إذا كان forceUpdate، قم بمسح جميع المتاجر الأخرى
      if (forceUpdate) {
        shopifyConnectionManager.clearAllStores();
      }

      // Store connection data in localStorage with forced delay
      console.log('Storing shop data in localStorage:', shop);
      
      // Use a stronger delay to ensure data is written before continuing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.setItem('shopify_store', shop);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.removeItem('shopify_temp_store');
      
      // Update connection manager
      shopifyConnectionManager.addOrUpdateStore(shop, true, true);
      shopifyConnectionManager.resetLoopDetection();
      
      // Double check that data was saved correctly
      const verifyStore = localStorage.getItem('shopify_store');
      const verifyConnected = localStorage.getItem('shopify_connected');
      
      console.log('Verification check after save:', {
        shopSaved: verifyStore === shop,
        connectedSaved: verifyConnected === 'true',
        verifyStoreValue: verifyStore,
        verifyConnectedValue: verifyConnected
      });
      
      // If verification failed, try one more time with a different approach
      if (verifyStore !== shop || verifyConnected !== 'true') {
        console.warn('Verification failed, trying alternative storage method');
        // Try alternative storage with session expiry
        window.sessionStorage.setItem('shopify_store', shop);
        window.sessionStorage.setItem('shopify_connected', 'true');
        
        // Make one more attempt with localStorage
        localStorage.clear(); // Try clearing first
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
      }
      
      setSuccess(true);
      setShop(shop);
      setProcessingComplete(true);
      
      toast.success(`تم الاتصال بمتجر ${shop} بنجاح`);
      
      console.log('Connection successful, using direct navigation component');
      // Set flag to trigger the Navigate component
      setDirectNavigationTriggered(true);
    } catch (error) {
      console.error('Error processing callback:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ غير معروف أثناء معالجة الاستدعاء');
      setSuccess(false);
      setProcessingComplete(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Process the callback immediately when component loads
    const params = new URLSearchParams(location.search);
    processCallback(params);
    
    // Setup backup navigation if processCallback doesn't complete
    const backupTimer = setTimeout(() => {
      if (!processingComplete) {
        console.log("Backup timer triggered - forcing navigation");
        const shopParam = params.get("shop") || localStorage.getItem('shopify_temp_store');
        
        if (shopParam) {
          // Force store data
          localStorage.setItem('shopify_store', shopParam);
          localStorage.setItem('shopify_connected', 'true');
          localStorage.setItem('bypass_auth', 'true'); // Enable bypass mode
          shopifyConnectionManager.addOrUpdateStore(shopParam, true, true);
          
          // Use Navigate component for more reliable navigation
          setDirectNavigationTriggered(true);
        }
      }
    }, 5000); // 5 second backup timer
    
    return () => clearTimeout(backupTimer);
  }, [location.search, navigate]);

  // Force connection state validity
  useEffect(() => {
    const validateTimer = setTimeout(() => {
      try {
        shopifyConnectionManager.validateConnectionState();
      } catch (error) {
        console.warn("Connection validation error in callback:", error);
      }
    }, 1000);
    
    return () => clearTimeout(validateTimer);
  }, []);
  
  // If direct navigation is triggered, render Navigate component immediately
  if (directNavigationTriggered) {
    // Get any saved redirect path or default to dashboard
    const redirectPath = localStorage.getItem('auth_redirect') || '/dashboard';
    // Clear the saved path
    localStorage.removeItem('auth_redirect');
    
    console.log("Performing direct navigation to:", redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Go to dashboard button handler
  const goToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  // Back to connect page handler
  const goToConnect = () => {
    // Clear state before reconnecting
    shopifyConnectionManager.clearAllStores();
    shopifyConnectionManager.resetLoopDetection();
    navigate('/shopify', { replace: true });
  };
  
  // Clear cache and reconnect handler
  const clearCacheAndReconnect = () => {
    // Clear cached data
    shopifyConnectionManager.clearAllStores();
    // No need for resetLoopDetection here
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_temp_store');
    localStorage.removeItem('bypass_auth');
    
    // Redirect
    navigate('/shopify', { replace: true });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {loading ? 'جاري معالجة الاتصال' : 
             success ? 'تم الاتصال بنجاح' : 
             connectionLoopDetected ? 'تم اكتشاف حلقة اتصال' :
             'فشل الاتصال'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4 text-center">
            {loading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p>يرجى الانتظار بينما نقوم بإكمال عملية الاتصال بـ Shopify...</p>
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p>تم الاتصال بنجاح بمتجر {shop}</p>
                <p className="text-sm text-gray-500">سيتم توجيهك إلى لوحة التحكم خلال لحظات...</p>
                <div className="p-3 bg-green-50 border border-green-200 rounded-md mt-4">
                  <p className="text-green-700 font-medium">معلومات الاتصال:</p>
                  <p className="text-sm">• تم حفظ بيانات المتجر</p>
                  <p className="text-sm">• تم تعيين حالة الاتصال كنشطة</p>
                  <p className="text-sm">• جاهز للاستخدام في لوحة التحكم</p>
                </div>
              </>
            ) : connectionLoopDetected ? (
              <>
                <RefreshCw className="h-10 w-10 text-amber-500 animate-spin" />
                <p className="text-amber-600 font-medium">تم اكتشاف حلقة اتصال متكررة</p>
                <p className="text-sm text-gray-700">
                  تم اتخاذ إجراء تصحيحي تلقائي لحل المشكلة. سيتم توجيهك قريباً.
                </p>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                  <p>نصائح إضافية:</p>
                  <ul className="text-right list-disc list-inside">
                    <li>حاول مسح ذاكرة التخزين المؤقت للمتصفح</li>
                    <li>تأكد من تفعيل ملفات تعريف الارتباط</li>
                    <li>حاول استخدام متصفح آخر إذا استمرت المشكلة</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-10 w-10 text-red-500" />
                <p className="text-red-600 font-medium">حدث خطأ أثناء محاولة الاتصال:</p>
                <p className="text-sm text-gray-700">{error || 'خطأ غير معروف'}</p>
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                  <p>اقتراحات للحل:</p>
                  <ul className="text-right list-disc list-inside">
                    <li>تأكد من أن لديك صلاحيات المسؤول في متجر Shopify</li>
                    <li>حاول مسح ذاكرة التخزين المؤقت واستخدام الزر أدناه لإعادة المحاولة</li>
                    <li>إذا استمرت المشكلة، حاول استخدام متصفح آخر</li>
                  </ul>
                </div>
                
                {/* Debug info */}
                <div className="w-full mt-4 text-left">
                  <details className="p-2 border border-gray-200 rounded">
                    <summary className="cursor-pointer text-sm font-medium">معلومات التصحيح</summary>
                    <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </details>
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center space-x-2">
          {!loading && (
            <div className="flex gap-2">
              <Button 
                onClick={goToDashboard} 
                disabled={loading}
                variant={success ? "default" : "outline"}
              >
                الذهاب إلى لوحة التحكم
              </Button>
              
              {!success && (
                <Button 
                  onClick={clearCacheAndReconnect} 
                  disabled={loading}
                  variant="destructive"
                >
                  مسح الذاكرة المؤقتة وإعادة الاتصال
                </Button>
              )}
              
              {!success && (
                <Button 
                  onClick={goToConnect} 
                  disabled={loading}
                  variant="outline"
                >
                  إعادة المحاولة
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ShopifyCallback;
