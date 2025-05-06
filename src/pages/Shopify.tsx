
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Redirect to the new ShopifyConnect page
const Shopify = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/shopify-connect');
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>جاري إعادة التوجيه...</p>
    </div>
  );
};

export default Shopify;
