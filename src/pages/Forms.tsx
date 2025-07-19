
import React, { useState, useEffect, useCallback } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import { Loader2, AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Forms = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasShopifyConnected, setHasShopifyConnected] = useState(false);
  const [forms, setForms] = useState([]);
  const [currentShop, setCurrentShop] = useState<string | null>(null);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Determine access based on various conditions
  const hasAccess = !!user || shopifyConnected || hasShopifyConnected;

  // Simplified connection check - let useFormTemplates handle form fetching
  const checkShopifyConnection = useCallback(async () => {
    if (isDataFetched && !networkError && retryAttempt === 0) return;
    
    setIsLoading(true);
    try {
      const shopFromLocalStorage = localStorage.getItem('shopify_store');
      const isConnectedFromLocalStorage = localStorage.getItem('shopify_connected') === 'true';
      
      setHasShopifyConnected(shopifyConnected || isConnectedFromLocalStorage);
      
      const activeShop = shop || shopFromLocalStorage;
      setCurrentShop(activeShop);
      
      if (activeShop) {
        console.log("Active shop found:", activeShop);
        setHasShopifyConnected(true);
        setNetworkError(false);
      }
      
      setIsDataFetched(true);
      
    } catch (error) {
      console.error("Error in checkShopifyConnection:", error);
      setNetworkError(true);
    } finally {
      setIsLoading(false);
      if (retryAttempt > 0) {
        setRetryAttempt(0);
      }
    }
  }, [shop, shopifyConnected, isDataFetched, networkError, retryAttempt]);
  
  useEffect(() => {
    checkShopifyConnection();
  }, [checkShopifyConnection]);

  // Function to manually retry connection
  const retryConnection = () => {
    setRetryAttempt(prev => prev + 1);
    toast.info(language === 'ar' 
      ? 'جاري محاولة الاتصال بالخادم...' 
      : 'Attempting to connect to server...');
  };

  // Handle bypass access for development or testing
  const enableBypass = () => {
    localStorage.setItem('bypass_auth', 'true');
    setHasShopifyConnected(true);
    toast.success(language === 'ar' 
      ? 'تم تفعيل وضع التجاوز. يمكنك الاستمرار في إدارة النماذج' 
      : 'Bypass mode activated. You can continue managing forms.');
  };

  // Render loading state while checking connection
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </span>
      </div>
    );
  }

  // Render access restriction if not connected
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="max-w-md w-full p-6 bg-white rounded shadow-md">
          <div className="text-center py-4">
            <h2 className="text-xl font-bold mb-4">
              {language === 'ar' ? 'الوصول مقيد' : 'Access Restricted'}
            </h2>
            <p className="mb-6">
              {language === 'ar' 
                ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى قسم النماذج' 
                : 'Please login or connect a Shopify store to access forms'}
            </p>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => navigate('/shopify-connect')}
                className="w-full"
              >
                {language === 'ar' ? 'الاتصال بمتجر Shopify' : 'Connect Shopify Store'}
              </Button>
              
              <Button
                variant="outline"
                onClick={enableBypass}
                className="w-full"
              >
                {language === 'ar' ? 'متابعة على أي حال' : 'Continue Anyway'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the forms dashboard
  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      {/* Network Error Banner */}
      {networkError && (
        <div className="absolute top-0 left-0 right-0 z-50 px-4 py-2">
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700 flex justify-between items-center">
              <div className="flex items-center">
                <WifiOff className="h-4 w-4 mr-2" />
                <span>
                  {language === 'ar' 
                    ? 'فشل الاتصال بالخادم. بعض الوظائف قد لا تعمل.'
                    : 'Failed to connect to server. Some features may not work.'}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={retryConnection}
                className="ml-2 flex items-center"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Connection warning banner */}
      {!shopifyConnected && hasShopifyConnected && !networkError && (
        <div className="absolute top-0 left-0 right-0 z-50 px-4 py-2">
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-700 flex justify-between items-center">
              <span>
                {language === 'ar' 
                  ? 'يرجى التحقق من اتصال Shopify الخاص بك'
                  : 'Please verify your Shopify connection'}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/shopify-connect')}
                className="ml-2"
              >
                {language === 'ar' ? 'التحقق من الاتصال' : 'Verify Connection'}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="flex-1">
        <FormBuilderDashboard 
          key={`dashboard-${currentShop}`} 
          initialForms={[]} 
          forceRefresh={false}
          offlineMode={networkError}
          onRetryConnection={retryConnection}
          retryCount={retryAttempt}
        />
      </div>
      
      {/* Debug info in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-2 right-2 p-2 bg-gray-100 text-xs rounded opacity-70 hover:opacity-100">
          <div>User: {user?.id || 'None'}</div>
          <div>Shop: {currentShop || 'None'}</div>
          <div>Auth Context Connected: {shopifyConnected ? 'Yes' : 'No'}</div>
          <div>Local Storage Connected: {localStorage.getItem('shopify_connected') === 'true' ? 'Yes' : 'No'}</div>
          <div>Forms Count: {forms.length}</div>
          <div>Data Fetched: {isDataFetched ? 'Yes' : 'No'}</div>
          <div>Network Error: {networkError ? 'Yes' : 'No'}</div>
          <div>Retry Attempt: {retryAttempt}</div>
        </div>
      )}
    </div>
  );
};

export default Forms;
