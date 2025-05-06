
import React from 'react';
import ShopifyConnection from '@/components/shopify/ShopifyConnection';

const ShopifyConnect = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <div className="w-full max-w-md px-4">
        <ShopifyConnection />
      </div>
    </div>
  );
};

export default ShopifyConnect;
