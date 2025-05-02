
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import ShopifyConnectionStatus from '@/components/form/builder/ShopifyConnectionStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

const Forms = () => {
  const { shopifyConnected, shop, isTokenVerified, refreshShopifyConnection, forceReconnect, lastConnectionTime } = useAuth();
  const navigate = useNavigate();
  const [isPageReady, setIsPageReady] = useState(false);
  const [connectionVerified, setConnectionVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // Use our internationalization hook
  const { t, language } = useI18n();
  
  // Clean cached connection data to start fresh
  useEffect(() => {
    console.log('Forms: Initial cleanup of potentially stale data');
    // Only clear specific shopify temporary data to avoid full logout
    localStorage.removeItem('shopify_last_redirect_time');
    localStorage.removeItem('shopify_temp_store');
    localStorage.removeItem('shopify_reconnect_attempts');
    
    // Update session if needed
    if (refreshShopifyConnection) {
      refreshShopifyConnection();
    }
  }, []);
  
  // Verify connection directly with Supabase with retries
  const verifyConnection = useCallback(async () => {
    setIsVerifying(true);
    setErrorState(null);
    
    try {
      console.log('Forms: Verifying Shopify connection with shop:', shop);
      
      if (!shop) {
        console.log("Forms: No shop parameter provided");
        setConnectionVerified(false);
        setErrorState("no_shop");
        setIsVerifying(false);
        setIsPageReady(true);
        return;
      }
      
      // Verify token exists in database
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shop)
        .maybeSingle();
      
      if (storeError) {
        console.error('Forms: Database query error:', storeError);
        setErrorState("db_error");
        setConnectionVerified(false);
        setIsVerifying(false);
        setIsPageReady(true);
        return;
      }
      
      if (!storeData || !storeData.access_token) {
        console.log('Forms: No valid token found in database');
        setErrorState("no_token");
        setConnectionVerified(false);
        setIsVerifying(false);
        setIsPageReady(true);
        return;
      }
      
      console.log('Forms: Valid token found in database');
      setConnectionVerified(true);
      
      // Update localStorage to confirm valid connection
      localStorage.setItem('shopify_store', shop);
      localStorage.setItem('shopify_connected', 'true');
      localStorage.setItem('shopify_last_connect_time', Date.now().toString());
      
      setIsVerifying(false);
      setIsPageReady(true);
      
    } catch (error) {
      console.error('Forms: Error verifying connection:', error);
      setErrorState("connection_error");
      setConnectionVerified(false);
      setIsVerifying(false);
      setIsPageReady(true);
    }
  }, [shop]);

  // Initial verification with retry mechanism
  useEffect(() => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds
    
    if (retryCount < MAX_RETRIES) {
      verifyConnection();
      
      // If not connected and not on the last retry, schedule another attempt
      if (!connectionVerified && retryCount < MAX_RETRIES - 1) {
        const timer = setTimeout(() => {
          console.log(`Forms: Retry attempt ${retryCount + 1} of ${MAX_RETRIES}`);
          setRetryCount(prev => prev + 1);
        }, RETRY_DELAY);
        
        return () => clearTimeout(timer);
      }
    }
  }, [verifyConnection, retryCount, connectionVerified]);

  // Handle reconnection
  const handleReconnect = () => {
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    
    // Clear connection data entirely
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_temp_store');
    localStorage.removeItem('shopify_reconnect_attempts');
    localStorage.removeItem('shopify_last_connect_time');
    localStorage.removeItem('shopify_last_redirect_time');
    
    // Force browser to refresh connection state
    setTimeout(() => {
      window.location.href = `/shopify?reconnect=form&ts=${Date.now()}&r=${Math.random().toString(36).substring(7)}`;
    }, 500);
  };

  // Handle force reconnection
  const handleForceReconnect = () => {
    if (!forceReconnect || isRedirecting) return;
    
    setIsRedirecting(true);
    forceReconnect();
    
    // Reset redirect state after a timeout
    setTimeout(() => {
      setIsRedirecting(false);
    }, 3000);
  };

  // Show loading state
  if (!isPageReady || isVerifying) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-[#F8F9FB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5] mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Show connection issue screen
  if (!connectionVerified || !shopifyConnected || !shop) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB]">
        <AppSidebar />
        <div className="flex-1 p-8">
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
            <div className="bg-red-50 text-red-800 p-6 rounded-lg mb-6 w-full">
              <div className="flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t('shopifyConnectionIssue')}
              </h3>
              <p className="mb-4">
                {t('pleaseConnect')}
              </p>
              <div className="space-y-2">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={isRedirecting}
                  onClick={handleReconnect}
                >
                  {isRedirecting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جاري التوجيه...' : 'Redirecting...'}
                    </div>
                  ) : (
                    t('connectToShopifyNow')
                  )}
                </Button>
                
                {/* Force reconnect button if the function is available */}
                {forceReconnect && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    disabled={isRedirecting}
                    onClick={handleForceReconnect}
                  >
                    {isRedirecting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
                        {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t('forceReconnect')}
                      </div>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Error state and debug info */}
              {errorState && (
                <div className="mt-4 p-3 bg-red-100 rounded-md text-xs text-red-800">
                  <p>Error type: {errorState}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 px-2 py-1 bg-red-200 rounded text-xs"
                  >
                    Refresh page
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display the main form dashboard
  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <div className="flex-1">
        {/* Show Shopify connection status component if needed */}
        {!isTokenVerified && <ShopifyConnectionStatus />}
        
        {/* Always show the form builder dashboard */}
        <FormBuilderDashboard />
      </div>
    </div>
  );
};

export default Forms;
