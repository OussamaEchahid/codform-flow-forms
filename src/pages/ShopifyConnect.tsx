
import React from 'react';
import ShopifyConnection from '@/components/shopify/ShopifyConnection';
import { useNavigate } from 'react-router-dom';

const ShopifyConnect = () => {
  const navigate = useNavigate();

  // تحقق من المعلمات في عنوان URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    
    // حفظ معلمات المتجر في التخزين المحلي إذا كانت موجودة
    if (shopParam) {
      localStorage.setItem('shopify_last_url_shop', shopParam);
      console.log('Shop parameter detected:', shopParam);
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <div className="w-full max-w-md px-4">
        <ShopifyConnection />
      </div>
    </div>
  );
};

export default ShopifyConnect;
