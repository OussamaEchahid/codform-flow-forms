
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shop, accessToken, timestamp } = await req.json();
    
    if (!shop || !accessToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required parameters' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`[${shop}] Fetching products. Timestamp: ${timestamp || 'none'}`);

    // Get the first page of products using the Shopify REST API
    const shopifyUrl = `https://${shop}/admin/api/2023-07/products.json`;
    const response = await fetch(shopifyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API error (${response.status}):`, errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Error from Shopify API (${response.status})`, 
          error: errorText 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const data = await response.json();
    const products = data.products || [];
    
    console.log(`[${shop}] Fetched ${products.length} products`);

    // Map products to a simpler format
    const simplifiedProducts = products.map((product: any) => ({
      id: product.id.toString(),
      title: product.title,
      handle: product.handle,
      vendor: product.vendor,
      product_type: product.product_type,
      status: product.status,
      tags: product.tags,
      variants: (product.variants || []).length,
      image: product.image?.src || '',
      created_at: product.created_at,
      updated_at: product.updated_at
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        products: simplifiedProducts 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in shopify-products function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error fetching products' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
