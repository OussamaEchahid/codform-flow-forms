
import React, { useEffect, useState } from 'react';
import FormsPage from './FormsPage';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';

const Forms = () => {
  const navigate = useNavigate();
  const { isConnected, shopDomain, isLoading, error, syncState } = useShopifyConnection();
  const [isValidating, setIsValidating] = useState(true);
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);
  
  useEffect(() => {
    const validateShopifyConnection = async () => {
      // Wait for the Shopify connection to be checked
      if (isLoading) return;
      
      if (!isConnected || !shopDomain) {
        // Only redirect once to prevent loops
        if (!hasAttemptedRedirect) {
          setHasAttemptedRedirect(true);
          toast.error('No Shopify store connection found. Please connect your store.');
          navigate('/shopify');
          return;
        } else {
          // If we're back here after a redirect attempt, 
          // just show a message but don't redirect again
          toast.error('Connection issue: Please manually navigate to the Shopify connection page');
          setIsValidating(false);
          return;
        }
      }
      
      // Connection looks good, ensure all state sources are in sync
      // but don't wait for it to complete to prevent potential hanging
      syncState().catch(err => console.error("Error syncing state:", err));
      setIsValidating(false);
    };
    
    validateShopifyConnection();
  }, [isConnected, shopDomain, isLoading, navigate, syncState, hasAttemptedRedirect]);
  
  // Show loading state while validating but add a timeout to prevent infinite loading
  useEffect(() => {
    // Set a timeout to force-render after 5 seconds even if validation never completes
    const forceRenderTimeout = setTimeout(() => {
      if (isValidating) {
        console.log("Force completing validation after timeout");
        setIsValidating(false);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(forceRenderTimeout);
  }, [isValidating]);
  
  // Show loading state while validating
  if (isLoading || isValidating) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Validating Shopify connection...</p>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          className="px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => navigate('/shopify')}
        >
          Connect to Shopify
        </button>
      </div>
    );
  }

  // If we got here without a shop but also without redirecting, 
  // show a backup connection button
  if (!shopDomain && !isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-amber-500 mb-4">Unable to validate Shopify connection</p>
        <button 
          className="px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => navigate('/shopify')}
        >
          Connect to Shopify
        </button>
      </div>
    );
  }

  return <FormsPage shopId={shopDomain || ''} />;
};

export default Forms;
