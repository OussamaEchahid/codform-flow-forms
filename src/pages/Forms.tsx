
import React from 'react';
import FormsPage from './FormsPage';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';

const Forms = () => {
  const { shopDomain } = useShopifyConnection();
  
  return (
    <FormsPage shopId={shopDomain} />
  );
};

export default Forms;
