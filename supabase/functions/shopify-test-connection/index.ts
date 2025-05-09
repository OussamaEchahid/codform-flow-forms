
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

  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Extract parameters
    const { shop, accessToken, timestamp, requestId = `req_test_${Math.random().toString(36).substring(2, 8)}` } = body;
    
    console.log(`[${requestId}] Testing connection for shop: ${shop}`);
    
    if (!shop || !accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: shop and accessToken' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Normalize shop domain
    const normalizedShopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
    console.log(`[${requestId}] Using normalized shop domain: ${normalizedShopDomain}`);
    
    try {
      // Test connection to Shopify API
      console.log(`[${requestId}] Making request to Shopify API to test connection`);
      const response = await fetch(`https://${normalizedShopDomain}/admin/api/2023-10/shop.json`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${requestId}] Shopify API returned error: ${response.status}`, errorText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Shopify API returned error: ${response.status}`,
            details: errorText,
            timestamp: new Date().toISOString()
          }),
          { headers: corsHeaders }
        );
      }

      // Parse response
      const data = await response.json();
      
      if (!data || !data.shop) {
        console.error(`[${requestId}] Invalid response format from Shopify API`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid response format from Shopify API',
            details: JSON.stringify(data),
            timestamp: new Date().toISOString()
          }),
          { headers: corsHeaders }
        );
      }
      
      // Connection successful
      console.log(`[${requestId}] Successfully connected to shop: ${normalizedShopDomain}`);
      console.log(`[${requestId}] Connection test successful for shop: ${normalizedShopDomain}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Connection test successful',
          shopName: data.shop.name,
          shopId: data.shop.id,
          shopDomain: normalizedShopDomain,
          timestamp: new Date().toISOString()
        }),
        { headers: corsHeaders }
      );
    } catch (apiError) {
      console.error(`[${requestId}] Error connecting to Shopify API:`, apiError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error connecting to Shopify API: ${apiError.message || 'Unknown error'}`,
          timestamp: new Date().toISOString()
        }),
        { headers: corsHeaders }
      );
    }
  } catch (error) {
    const errorId = `error_${Math.random().toString(36).substring(2, 8)}`;
    console.error(`[${errorId}] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Unexpected error: ${error.message || 'Unknown error'}`,
        errorId,
        timestamp: new Date().toISOString()
      }),
      { headers: corsHeaders }
    );
  }
});
