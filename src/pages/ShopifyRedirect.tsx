
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { ShopifyConnectionManager } from '@/utils/shopifyConnectionManager';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

const ShopifyRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { refreshShopifyConnection } = useAuth();
  
  // Process the redirect from Shopify
  useEffect(() => {
    const processRedirect = async () => {
      try {
        // Get query parameters
        const params = new URLSearchParams(location.search);
        const shop = params.get('shop');
        const returnTo = params.get('return_to') || '/forms';
        const hmac = params.get('hmac');
        const code = params.get('code');
        
        console.log('ShopifyRedirect: Processing redirect with params:', { 
          shop, 
          returnTo,
          hmac: hmac ? 'present' : 'missing',
          code: code ? 'present' : 'missing'
        });
        
        setDebugInfo({
          params: {
            shop,
            returnTo,
            hmac: hmac ? 'present' : 'missing',
            code: code ? 'present' : 'missing'
          },
          timestamp: new Date().toISOString(),
          currentStoreTarget: ShopifyConnectionManager.getCurrentStoreTarget()
        });
        
        // If we have a shop parameter, store it
        if (shop) {
          // Before setting the connected store, check if it matches the temp store we expected
          const tempStore = ShopifyConnectionManager.getCurrentStoreTarget();
          
          if (tempStore && tempStore !== shop && !tempStore.includes(shop) && !shop.includes(tempStore)) {
            console.warn(`[ShopifyRedirect] Received shop (${shop}) doesn't match the expected temporary store (${tempStore})`);
            // Log it but continue anyway - don't block the flow
          }
          
          // Store the connected shop
          localStorage.setItem('shopify_store', shop);
          localStorage.setItem('shopify_connected', 'true');
          localStorage.setItem('shopify_last_connect_time', Date.now().toString());
          
          // Clear the temporary store as we now have a proper connection
          ShopifyConnectionManager.clearTempStore();
          
          // Reset connection attempts as we succeeded
          ShopifyConnectionManager.resetAttempts();
          
          // Refresh the connection status in the auth context
          if (refreshShopifyConnection) {
            await refreshShopifyConnection();
          }
          
          toast.success(`Successfully connected to Shopify store: ${shop}`);
          
          // Disable emergency mode if it was enabled
          if (ShopifyConnectionManager.isEmergencyDisabled()) {
            ShopifyConnectionManager.toggleEmergencyDisable(false);
            toast.info('Emergency mode has been disabled since connection was successful');
          }
          
          // Navigate back to the requested page or default to /forms
          navigate(returnTo);
        } else {
          setError('No shop parameter found in the redirect URL');
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Error processing Shopify redirect:', error);
        setError('Failed to process Shopify authentication. Please try again.');
        setIsProcessing(false);
      }
    };
    
    processRedirect();
  }, [location.search, navigate, refreshShopifyConnection]);
  
  const handleGoBack = () => {
    navigate('/shopify');
  };
  
  const handleTryAgain = () => {
    // Force the emergency mode to be disabled
    if (ShopifyConnectionManager.isEmergencyDisabled()) {
      ShopifyConnectionManager.toggleEmergencyDisable(false);
    }
    
    // Clear any cached connection data
    ShopifyConnectionManager.clearConnectionData();
    
    // Redirect to shopify page
    navigate('/shopify');
  };
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          
          <div className="space-y-3">
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleTryAgain}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline"
              className="w-full"
              onClick={handleGoBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shopify Page
            </Button>
          </div>
          
          {/* Debug info for troubleshooting */}
          <div className="mt-6 p-4 bg-gray-100 rounded-md text-xs text-left">
            <h3 className="font-bold">Debug Information:</h3>
            <pre className="overflow-auto max-h-60">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }
  
  // Loading state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
      <h2 className="text-xl font-medium mb-2">Processing Shopify Connection</h2>
      <p className="text-gray-600 mb-6">Please wait while we complete your authentication...</p>
      
      <Button variant="outline" onClick={handleGoBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Cancel and Go Back
      </Button>
    </div>
  );
};

export default ShopifyRedirect;
