
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

console.log("Initializing shopify-test-connection function");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Test connection request received:", req.url);

  try {
    const { shop, accessToken } = await req.json();
    
    if (!shop || !accessToken) {
      throw new Error('Missing required parameters: shop or accessToken');
    }

    console.log(`Testing connection for shop: ${shop}`);
    
    // Normalize shop domain
    let normalizedShopDomain = shop;
    if (!normalizedShopDomain.includes('myshopify.com')) {
      normalizedShopDomain = `${normalizedShopDomain}.myshopify.com`;
    }
    
    // Make a simple request to Shopify to check if the token is valid
    // Here we'll just request the shop info which is a lightweight call
    const shopInfoUrl = `https://${normalizedShopDomain}/admin/api/2023-07/shop.json`;
    const shopifyResponse = await fetch(shopInfoUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error(`Invalid token or shop. Status: ${shopifyResponse.status}, Response: ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid access token or shop domain', 
          status: shopifyResponse.status,
          error: errorText,
          shop
        }),
        { 
          headers: corsHeaders,
          status: 200 // We return 200 with error info in the body for better client handling
        }
      );
    }
    
    // Token is valid
    const shopData = await shopifyResponse.json();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Valid connection',
        shop: normalizedShopDomain,
        shopInfo: {
          name: shopData.shop.name,
          email: shopData.shop.email,
          domain: shopData.shop.domain,
          shopOwner: shopData.shop.shop_owner
        }
      }),
      { 
        headers: corsHeaders,
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error testing connection:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: corsHeaders,
        status: 200 // We return 200 with error info for better client handling
      }
    );
  }
});
