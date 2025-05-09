
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid JSON body' }),
      { status: 400, headers: corsHeaders }
    );
  }
  
  const { shop, accessToken, requestId = `req_test_${Math.random().toString(36).substring(2, 10)}` } = body;
  
  if (!shop || !accessToken) {
    return new Response(
      JSON.stringify({ success: false, message: 'Missing required parameters: shop and accessToken' }),
      { status: 400, headers: corsHeaders }
    );
  }
  
  // Normalize shop domain
  const normalizedShopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
  
  console.log(`[${requestId}] Testing connection for shop: ${normalizedShopDomain}`);
  console.log(`[${requestId}] Using normalized shop domain: ${normalizedShopDomain}`);
  
  try {
    console.log(`[${requestId}] Making request to Shopify API to test connection`);
    
    const response = await fetch(`https://${normalizedShopDomain}/admin/api/2023-10/shop.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      }
    });
    
    if (!response.ok) {
      console.error(`[${requestId}] API request failed with status ${response.status}`);
      
      // Get error details
      let errorDetails;
      try {
        errorDetails = await response.text();
      } catch (e) {
        errorDetails = 'Could not read error response';
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `API request failed with status ${response.status}`,
          details: errorDetails.substring(0, 200)
        }),
        { headers: corsHeaders }
      );
    }
    
    // Try to parse the response 
    const shopData = await response.json();
    
    if (!shopData || !shopData.shop || !shopData.shop.id) {
      console.error(`[${requestId}] Invalid response format from Shopify API`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid response from Shopify API'
        }),
        { headers: corsHeaders }
      );
    }
    
    console.log(`[${requestId}] Successfully connected to shop: ${shop}`);
    console.log(`[${requestId}] Connection test successful for shop: ${shop}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Connection successful',
        shopId: shopData.shop.id,
        shopName: shopData.shop.name,
        timestamp: new Date().toISOString()
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`[${requestId}] Error testing connection:`, error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { headers: corsHeaders }
    );
  }
});
