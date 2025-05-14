
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const { shop } = await req.json();
    
    if (!shop) {
      throw new Error('Missing shop parameter');
    }
    
    console.log(`Fetching products for shop: ${shop}`);
    
    // Get the store's access token
    const { data: storeData, error: storeError } = await supabase
      .from('shopify_stores')
      .select('access_token, shop')
      .eq('shop', shop)
      .single();
    
    if (storeError) {
      console.error('Error fetching store data:', storeError);
      throw new Error(`Store not found: ${shop}`);
    }
    
    if (!storeData.access_token) {
      throw new Error(`No access token found for shop: ${shop}`);
    }
    
    // Make request to Shopify API
    const shopDomain = storeData.shop;
    const accessToken = storeData.access_token;
    
    // First, ensure we have a clean shop domain
    const sanitizedShopDomain = shopDomain.replace('https://', '').replace('http://', '').split('/')[0];
    
    console.log(`Making API request to: https://${sanitizedShopDomain}/admin/api/2023-01/products.json`);
    
    const shopifyResponse = await fetch(`https://${sanitizedShopDomain}/admin/api/2023-01/products.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
    });
    
    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error('Shopify API error:', errorText);
      throw new Error(`Shopify API error: ${shopifyResponse.status} ${errorText}`);
    }
    
    const shopifyData = await shopifyResponse.json();
    
    // Transform products for easier consumption in the frontend
    const transformedProducts = shopifyData.products
      .filter((product: any) => {
        // Filter out test/sample products
        const title = product.title.toLowerCase();
        return !title.includes('test') && !title.includes('sample');
      })
      .map((product: any) => ({
        id: product.id.toString(),
        title: product.title,
        description: product.body_html,
        price: product.variants[0]?.price || '0.00',
        images: product.images.map((img: any) => img.src),
        variants: product.variants.map((variant: any) => ({
          id: variant.id,
          title: variant.title,
          price: variant.price,
          available: variant.inventory_quantity > 0 || variant.inventory_policy === 'continue',
          inventory_quantity: variant.inventory_quantity,
        })),
        productType: product.product_type,
        handle: product.handle,
        status: product.status,
        vendor: product.vendor,
        tags: product.tags,
      }));
    
    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        products: transformedProducts,
        count: transformedProducts.length,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred fetching products',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});
