
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { ShopifyConnectionManager } from '@/utils/shopifyConnectionManager';

const ShopifyRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshShopifyConnection } = useAuth();
  
  // Process the redirect from Shopify
  useEffect(() => {
    const processRedirect = async () => {
      try {
        // Get query parameters
        const params = new URLSearchParams(location.search);
        const shop = params.get('shop');
        const returnTo = params.get('return_to') || '/forms';
        
        console.log('ShopifyRedirect: Processing redirect with params:', { shop, returnTo });
        
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
          
          toast.success('Successfully connected to Shopify store');
          
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
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            onClick={() => navigate('/shopify')}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Loading state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
      <h2 className="text-xl font-medium mb-2">Processing Shopify Connection</h2>
      <p className="text-gray-600">Please wait while we complete your authentication...</p>
    </div>
  );
};

export default ShopifyRedirect;
