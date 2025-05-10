
import React, { useEffect, useState, useCallback } from 'react';
import FormsPage from './FormsPage';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, Store, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { clearShopifyCache } from '@/hooks/useShopify';

// Test store configuration for development
const DEV_TEST_STORE = 'astrem.myshopify.com';

const Forms = () => {
  const navigate = useNavigate();
  const { 
    isConnected, 
    shopDomain, 
    isLoading,
    isValidating, 
    error,
    syncState,
    testConnection,
    reload,
    isDevMode // Use the isDevMode flag from context
  } = useShopifyConnection();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [retries, setRetries] = useState(0);
  const [hasRedirected, setHasRedirected] = useState(false); // Prevent infinite redirects
  const [manualRetryAttempted, setManualRetryAttempted] = useState(false);
  const maxRetries = 3; // Max retries
  
  // Enhanced debug mode
  const [debugInfo, setDebugInfo] = useState<{
    connectionState: string;
    retryAttempts: number;
    lastTestResult: boolean | null;
    lastTestTime: string | null;
    devModeEnabled?: boolean;
    testStoreActive?: boolean;
  }>({
    connectionState: 'unknown',
    retryAttempts: 0,
    lastTestResult: null,
    lastTestTime: null,
    devModeEnabled: isDevMode,
    testStoreActive: shopDomain === DEV_TEST_STORE
  });
  
  // Update debug info when relevant props change
  useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      devModeEnabled: isDevMode,
      testStoreActive: shopDomain === DEV_TEST_STORE
    }));
  }, [isDevMode, shopDomain]);
  
  // Reset cached connection data
  const resetConnectionCache = useCallback(() => {
    // Clear all Shopify-related localStorage items
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_token');
    localStorage.removeItem('shopify_failsafe');
    
    // Call our cache clearing function
    clearShopifyCache();
    
    toast.success('تم مسح البيانات المخزنة مؤقتًا، جاري إعادة التحقق من الاتصال');
    
    // Reload the page to ensure fresh state
    window.location.reload();
  }, []);
  
  // Try API-based connection check first
  const checkConnectionViaApi = useCallback(async (shopName: string): Promise<boolean> => {
    // Dev mode bypass for test store
    if (isDevMode && shopName === DEV_TEST_STORE) {
      console.log(`[DEV MODE] Bypassing API connection check for test store: ${shopName}`);
      return true;
    }
    
    try {
      console.log(`Checking connection via API for shop: ${shopName}`);
      
      // Try POST first
      try {
        const postResponse = await fetch(`/api/shopify-test-connection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            shop: shopName, 
            force: true,
            requestId: `api_check_${Math.random().toString(36).substring(2, 8)}`
          })
        });
        
        if (postResponse.ok) {
          const result = await postResponse.json();
          console.log('API POST connection check result:', result);
          return result.success === true;
        }
        
        // Fallback to GET if POST fails
        throw new Error('POST request failed');
      } catch (postError) {
        console.log('Falling back to GET request:', postError);
        const response = await fetch(`/api/shopify-test-connection?shop=${encodeURIComponent(shopName)}&force=true`);
        
        if (!response.ok) {
          console.error('API connection check failed:', await response.text());
          return false;
        }
        
        const result = await response.json();
        console.log('API GET connection check result:', result);
        return result.success === true;
      }
    } catch (error) {
      console.error('Error in API connection check:', error);
      return false;
    }
  }, [isDevMode]);
  
  // Manual connection check - with retries and clear validation
  const manualConnectionCheck = useCallback(async () => {
    // Dev mode bypass for test store
    if (isDevMode && shopDomain === DEV_TEST_STORE) {
      console.log('[DEV MODE] Bypassing manual connection check for test store');
      toast.success('متجر الاختبار متصل في وضع التطوير');
      return true;
    }
    
    setManualRetryAttempted(true);
    setIsVerifying(true);
    
    try {
      // Clear cached data first
      clearShopifyCache();
      
      // Hard refresh the state
      await syncState();
      await reload();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the current shop domain
      const currentShop = shopDomain || localStorage.getItem('shopify_store');
      
      if (!currentShop) {
        toast.error('لم يتم العثور على معلومات المتجر. الرجاء الاتصال بمتجرك أولاً.');
        navigate('/shopify');
        return;
      }
      
      // Try API check first
      const apiCheckSuccessful = await checkConnectionViaApi(currentShop);
      
      if (apiCheckSuccessful) {
        toast.success('تم التحقق من الاتصال بنجاح عبر API');
        await reload();
        return true;
      }
      
      // If API check fails, fall back to direct check
      console.log("API check failed, falling back to direct connection test");
      
      // Force refresh the connection test - try multiple times
      let isValid = false;
      let attempts = 0;
      
      while (!isValid && attempts < 3) {
        attempts++;
        setDebugInfo(prev => ({
          ...prev,
          retryAttempts: attempts,
          lastTestTime: new Date().toISOString()
        }));
        
        // Test with forced refresh
        isValid = await testConnection(true);
        
        if (isValid) {
          toast.success('تم التحقق من الاتصال بنجاح');
          setDebugInfo(prev => ({
            ...prev,
            connectionState: 'connected',
            lastTestResult: true
          }));
          return true;
        }
        
        if (attempts < 3) {
          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
        }
      }
      
      if (!isValid) {
        toast.error('فشل اختبار الاتصال بعد عدة محاولات. يرجى تحديث رمز الوصول.');
        setDebugInfo(prev => ({
          ...prev,
          connectionState: 'failed',
          lastTestResult: false
        }));
        
        // Navigate to settings if all attempts fail
        navigate('/settings');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error during manual connection check:', error);
      toast.error('حدث خطأ أثناء التحقق من الاتصال');
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [navigate, syncState, testConnection, reload, shopDomain, checkConnectionViaApi, isDevMode]);
  
  // Advanced check connection function with better retry mechanism
  const checkConnection = useCallback(async () => {
    // Dev mode bypass - don't check connection for test store
    if (isDevMode && shopDomain === DEV_TEST_STORE) {
      console.log('[DEV MODE] Skipping connection check for test store');
      setDebugInfo(prev => ({
        ...prev,
        connectionState: 'dev_mode_bypass',
        lastTestResult: true,
        lastTestTime: new Date().toISOString()
      }));
      return;
    }
    
    // Skip check if we're already loading/validating or have redirected
    if (isLoading || isValidating || isVerifying || hasRedirected) {
      console.log(`Skipping connection check, status:`, { 
        isLoading, isValidating, isVerifying, hasRedirected 
      });
      return;
    }
    
    // Generate a unique request ID for this connection check
    const requestId = `check_${Math.random().toString(36).substring(2, 10)}`;
    
    try {
      console.log(`[${requestId}] Starting connection verification`);
      setIsVerifying(true);
      
      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        connectionState: isConnected ? 'connected' : 'disconnected',
        retryAttempts: retries
      }));
      
      // If there's no shop domain, redirect to connection page
      if (!shopDomain) {
        console.log(`[${requestId}] No shop domain found, redirecting to shopify connection page`);
        toast.error('لا يوجد اتصال بمتجر Shopify. الرجاء الاتصال بمتجرك أولاً.');
        setHasRedirected(true);
        navigate('/shopify');
        return;
      }
      
      // Try API-based check first
      const apiCheckSuccessful = await checkConnectionViaApi(shopDomain);
      
      if (apiCheckSuccessful) {
        console.log(`[${requestId}] API connection check successful`);
        setRetries(0);
        return;
      }
      
      // If API check fails, sync connection state and try direct check
      console.log(`[${requestId}] API check failed, syncing state`);
      await syncState();
      
      // If still not connected after syncState, redirect
      if (!isConnected) {
        console.log(`[${requestId}] Connection state sync complete but still not connected`);
        toast.error('لا يوجد اتصال بمتجر Shopify. الرجاء الاتصال بمتجرك أولاً.');
        setHasRedirected(true);
        navigate('/shopify');
        return;
      }
      
      // Test the connection to make sure token is valid
      console.log(`[${requestId}] Testing connection`);
      const testStartTime = new Date().toISOString();
      const isValid = await testConnection(true); // Force refresh to ensure we have current state
      
      // Update debug info after test
      setDebugInfo(prev => ({
        ...prev,
        lastTestResult: isValid,
        lastTestTime: testStartTime
      }));
      
      if (!isValid && retries < maxRetries) {
        // Try again after increasing retry count
        console.log(`[${requestId}] Connection test failed, retrying (${retries + 1}/${maxRetries})`);
        setRetries(prev => prev + 1);
        
        // Wait with exponential backoff
        const waitTime = 1000 * Math.pow(2, retries);
        console.log(`[${requestId}] Waiting ${waitTime}ms before next retry`);
        
        // Wait a moment before retrying
        setTimeout(checkConnection, waitTime);
        return;
      }
      
      if (!isValid) {
        console.log(`[${requestId}] Connection test failed after all retries, redirecting to settings`);
        toast.error('رمز الوصول إلى Shopify غير صالح أو منتهي الصلاحية. الرجاء تحديث رمز الوصول.');
        setHasRedirected(true);
        navigate('/settings');
      } else {
        // Connection is valid, reset retries and proceed
        setRetries(0);
        console.log(`[${requestId}] Connection verified successfully`);
        setDebugInfo(prev => ({
          ...prev,
          connectionState: 'verified',
          retryAttempts: 0,
          lastTestResult: true
        }));
      }
    } catch (error) {
      console.error(`[${requestId}] Error verifying connection:`, error);
      toast.error('حدث خطأ أثناء التحقق من الاتصال');
    } finally {
      setIsVerifying(false);
    }
  }, [isConnected, shopDomain, isLoading, isValidating, navigate, syncState, testConnection, retries, hasRedirected, isVerifying, checkConnectionViaApi, isDevMode]);
  
  // Check connection once on load with improved reliability
  useEffect(() => {
    // Skip connection check in dev mode for test store
    if (isDevMode && shopDomain === DEV_TEST_STORE) {
      console.log('[DEV MODE] Using test store in dev mode, skipping connection check');
      return;
    }
    
    const timerRef = setTimeout(() => {
      if (!hasRedirected) {
        checkConnection();
      }
    }, 400); // Short delay to let other effects settle
    
    return () => clearTimeout(timerRef);
  }, [checkConnection, hasRedirected, isDevMode, shopDomain]);
  
  // Show loading state
  if (isLoading || isValidating || isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">جاري التحقق من اتصال Shopify...</p>
        {retries > 0 && (
          <p className="text-xs text-gray-400 mt-2">محاولة {retries}/{maxRetries}</p>
        )}
        
        {/* Manual retry option after automatic retries */}
        {retries >= 1 && !manualRetryAttempted && (
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={manualConnectionCheck}
            disabled={isVerifying}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            إعادة محاولة التحقق
          </Button>
        )}
        
        {/* Option to reset cached data */}
        {retries >= 2 && (
          <Button 
            variant="outline" 
            className="mt-2 border-red-300 text-red-600 hover:bg-red-50" 
            onClick={resetConnectionCache}
            disabled={isVerifying}
          >
            مسح بيانات الاتصال المخزنة
          </Button>
        )}
        
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 border rounded bg-gray-50 max-w-md text-xs">
            <h3 className="font-bold mb-2">معلومات التصحيح:</h3>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify({
                ...debugInfo,
                isConnected,
                shopDomain,
                isLoading,
                isValidating,
                isVerifying,
                error,
                hasRedirected,
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertTriangle className="h-4 w-4 ml-2" />
          <AlertTitle>خطأ في الاتصال</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="flex gap-2 mt-4">
          <Button onClick={() => navigate('/settings')}>
            تحديث رمز الوصول
          </Button>
          
          <Button 
            variant="outline"
            onClick={manualConnectionCheck}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            إعادة اختبار الاتصال
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            العودة للوحة التحكم
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          className="mt-4 border-red-300 text-red-600 hover:bg-red-50" 
          onClick={resetConnectionCache}
        >
          مسح بيانات الاتصال المخزنة
        </Button>
      </div>
    );
  }

  // All good - show the forms page with the shop domain
  return <FormsPage shopId={shopDomain || ''} />;
};

export default Forms;
