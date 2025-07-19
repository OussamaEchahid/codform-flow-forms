import { useEffect, useState } from 'react';

const ShopifyProductsAPI = () => {
  const [result, setResult] = useState<any>(null);
  
  useEffect(() => {
    // This component handles Shopify products API endpoint
    const handleRequest = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const shop = urlParams.get('shop');
        const productIds = urlParams.get('productIds');
        
        if (!shop || !productIds) {
          setResult({ error: 'Missing shop or productIds parameter' });
          return;
        }
        
        // Call the Supabase edge function
        const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M`
          },
          body: JSON.stringify({
            shop,
            productIds: productIds.split(',')
          })
        });
        
        const data = await response.json();
        setResult(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setResult({ error: 'Failed to fetch products' });
      }
    };
    
    handleRequest();
  }, []);
  
  // Return JSON response for API endpoint
  if (result) {
    return (
      <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(result, null, 2)}
      </div>
    );
  }
  
  return <div>Loading...</div>;
};

export default ShopifyProductsAPI;