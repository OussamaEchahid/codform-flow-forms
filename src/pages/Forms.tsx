
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
  
  useEffect(() => {
    const validateShopifyConnection = async () => {
      // Wait for the Shopify connection to be checked
      if (isLoading) return;
      
      if (!isConnected || !shopDomain) {
        toast.error('No Shopify store connection found. Please connect your store.');
        navigate('/shopify');
        return;
      }
      
      // Connection looks good, ensure all state sources are in sync
      await syncState();
      setIsValidating(false);
    };
    
    validateShopifyConnection();
  }, [isConnected, shopDomain, isLoading, navigate, syncState]);
  
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

  return <FormsPage shopId={shopDomain} />;
};

export default Forms;
