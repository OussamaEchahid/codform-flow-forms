import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  template_suffix: string;
  status: string;
  published_scope: string;
  tags: string;
  admin_graphql_api_id: string;
  variants: any[];
  options: any[];
  images: any[];
  image: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🛍️ Shopify Products API - Request received');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { shop } = await req.json();

    if (!shop) {
      console.error('❌ No shop provided');
      return new Response(
        JSON.stringify({ error: 'Shop parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🏪 Fetching products for shop: ${shop}`);

    // Get store info directly from database using service role
    const { data: storeData, error: storeError } = await supabase
      .from('shopify_stores')
      .select('shop, access_token, is_active')
      .eq('shop', shop)
      .eq('is_active', true)
      .not('access_token', 'is', null)
      .neq('access_token', '')
      .neq('access_token', 'placeholder_token')
      .single();

    if (storeError) {
      console.error('❌ Database error:', storeError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch store information',
          details: storeError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!storeData) {
      console.error('❌ Store not found');
      return new Response(
        JSON.stringify({ 
          error: 'STORE_NOT_FOUND',
          message: 'المتجر غير موجود أو غير نشط'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const accessToken = storeData.access_token;
    console.log(`✅ Store found with valid token: ${shop}`);

    // جلب المنتجات من Shopify API
    const shopifyUrl = `https://${shop}/admin/api/2024-07/products.json?limit=50`;
    
    console.log(`📡 Calling Shopify API: ${shopifyUrl}`);

    const shopifyResponse = await fetch(shopifyUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error(`❌ Shopify API error (${shopifyResponse.status}):`, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch products from Shopify',
          status: shopifyResponse.status,
          message: errorText
        }),
        { 
          status: shopifyResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await shopifyResponse.json();
    const products: ShopifyProduct[] = data.products || [];

    console.log(`✅ Successfully fetched ${products.length} products from ${shop}`);

    // تحويل المنتجات إلى تنسيق مبسط
    const formattedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      vendor: product.vendor || '',
      product_type: product.product_type || '',
      status: product.status,
      tags: product.tags || '',
      image: product.image?.src || null,
      variants: product.variants?.map(variant => ({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        sku: variant.sku || '',
        inventory_quantity: variant.inventory_quantity || 0
      })) || [],
      created_at: product.created_at,
      updated_at: product.updated_at
    }));

    return new Response(
      JSON.stringify({
        success: true,
        shop,
        products: formattedProducts,
        total: formattedProducts.length,
        message: `تم جلب ${formattedProducts.length} منتج بنجاح`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});