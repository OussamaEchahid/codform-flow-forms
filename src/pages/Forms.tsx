
import React, { useEffect } from 'react';
import FormsPage from './FormsPage';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast } from 'sonner';

const Forms = () => {
  const { shopDomain, isConnected } = useShopifyConnection();
  
  useEffect(() => {
    // Log the connection status for debugging
    console.log('Forms page loaded. Shopify connection status:', { 
      isConnected, 
      shopDomain 
    });
  }, [isConnected, shopDomain]);

  return (
    <FormsPage shopId={shopDomain} />
  );
};

export default Forms;
