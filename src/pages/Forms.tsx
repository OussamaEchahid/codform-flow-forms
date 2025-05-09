
import React, { useEffect, useState, useCallback } from 'react';
import FormsPage from './FormsPage';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, Store, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Forms = () => {
  const navigate = useNavigate();
  const { 
    isConnected, 
    shopDomain, 
    isLoading,
    isValidating, 
    error,
    syncState,
    testConnection
  } = useShopifyConnection();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [retries, setRetries] = useState(0);
  const [hasRedirected, setHasRedirected] = useState(false); // Prevent infinite redirects
  const [manualRetryAttempted, setManualRetryAttempted] = useState(false);
  const maxRetries = 3; // Increased max retries
  
  // Enhanced debug mode
  const [debugInfo, setDebugInfo] = useState<{
    connectionState: string;
    retryAttempts: number;
    lastTestResult: boolean | null;
    lastTestTime: string | null;
  }>({
    connectionState: 'unknown',
    retryAttempts: 0,
    lastTestResult: null,
    lastTestTime: null
  });
  
  // Manual connection check - with retries and clear validation
  const manualConnectionCheck = useCallback(async () => {
    setManualRetryAttempted(true);
    setIsVerifying(true);
    
    try {
      // Hard refresh the state first
      await syncState();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the current time before test
      const startTime = new Date().toISOString();
      
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
          break;
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
      }
    } catch (error) {
      console.error('Error during manual connection check:', error);
      toast.error('حدث خطأ أثناء التحقق من الاتصال');
    } finally {
      setIsVerifying(false);
    }
  }, [navigate, syncState, testConnection]);
  
  // Advanced check connection function with better retry mechanism
  const checkConnection = useCallback(async () => {
    const requestId = `forms_check_${Math.random().toString(36).substring(2, 8)}`;
    
    // Skip check if we're already loading/validating or have redirected
    if (isLoading || isValidating || isVerifying || hasRedirected) {
      console.log(`[${requestId}] Skipping connection check, status:`, { 
        isLoading, isValidating, isVerifying, hasRedirected 
      });
      return;
    }
    
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
      
      // Sync connection state first to ensure we have latest data
      console.log(`[${requestId}] Syncing connection state`);
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
  }, [isConnected, shopDomain, isLoading, isValidating, navigate, syncState, testConnection, retries, hasRedirected];
  
  // Check connection once on load with improved reliability
  useEffect(() => {
    const timerRef = setTimeout(() => {
      if (!hasRedirected) {
        checkConnection();
      }
    }, 400); // Short delay to let other effects settle
    
    return () => clearTimeout(timerRef);
  }, [checkConnection, hasRedirected]);
  
  // Show loading state
  if (isLoading || isValidating || isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">جاري التحقق من اتصال Shopify...</p>
        {retries > 0 && (
          <p className="text-xs text-gray-400 mt-2">محاولة {retries}/{maxRetries}</p>
        )}
        
        {/* Manual retry option after 2 automatic retries */}
        {retries >= 2 && !manualRetryAttempted && (
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
      </div>
    );
  }

  // All good - show the forms page with the shop domain
  return <FormsPage shopId={shopDomain || ''} />;
};

export default Forms;
