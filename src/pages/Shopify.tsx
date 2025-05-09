
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Redirect to the ShopifyConnect page
const Shopify = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Simple redirect with replace to avoid navigation history issues
    navigate('/shopify-connect', { replace: true });
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>جاري إعادة التوجيه...</p>
    </div>
  );
};

export default Shopify;
