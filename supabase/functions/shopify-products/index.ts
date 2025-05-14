
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  image: {
    src: string;
  } | null;
  status: string;
  variants: {
    id: string;
    price: string;
    title: string;
  }[];
};

// Handle CORS preflight requests
function handleOptions() {
  return new Response(null, {
    headers: corsHeaders,
    status: 204
  });
}

// Interface for the request
interface RequestParams {
  shop: string;
  forceRefresh?: boolean;
  includeTestProducts?: boolean; // New parameter to control including test products
}

// Function to check if a product is a test product
function isTestProduct(product: any): boolean {
  const title = (product.title || '').toLowerCase();
  const handle = (product.handle || '').toLowerCase();
  
  return title.includes('test') || 
    handle.includes('test') ||
    title.includes('demo') ||
    handle.includes('demo') ||
    title.includes('sample') ||
    handle.includes('sample');
}

serve(async (req: Request) => {
  try {
    const requestId = `edge_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`[${requestId}] Request received`);
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return handleOptions();
    }

    // Get shop from query params or body
    const url = new URL(req.url);
    let shop = url.searchParams.get('shop');
    let forceRefresh = url.searchParams.get('forceRefresh') === 'true';
    let includeTestProducts = url.searchParams.get('includeTestProducts') === 'true';
    
    // If not in query params, try to get from request body
    if (!shop) {
      try {
        const body = await req.json() as RequestParams;
        shop = body.shop;
        forceRefresh = body.forceRefresh || false;
        includeTestProducts = body.includeTestProducts || false;
      } catch (err) {
        console.error(`[${requestId}] Error parsing request body:`, err);
      }
    }

    if (!shop) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Shop parameter is required',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${requestId}] Processing request for shop: ${shop}, forceRefresh: ${forceRefresh}, includeTestProducts: ${includeTestProducts}`);

    // For development/test stores, return mock data
    if (shop.includes('test') || shop.includes('example') || shop.includes('development') || shop.includes('myshopify')) {
      console.log(`[${requestId}] Test store detected, returning mock data`);
      
      // Generate mock products
      const mockProducts = Array.from({ length: 10 }, (_, i) => {
        // Create a mix of regular and test products
        const isTest = i < 3; // First 3 are test products
        const productName = isTest ? `Test Product ${i + 1}` : `Real Product ${i + 1}`;
        const productHandle = isTest ? `test-product-${i + 1}` : `real-product-${i + 1}`;
        
        return {
          id: `gid://shopify/Product/${1000000 + i}`,
          title: productName,
          handle: productHandle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
          status: 'active',
          images: [
            `https://via.placeholder.com/500x500.png?text=${encodeURIComponent(productName)}`
          ],
          variants: [
            {
              id: `gid://shopify/ProductVariant/${2000000 + i}`,
              price: `${Math.floor(10 + Math.random() * 90)}.99`,
              title: 'Default Title',
              available: true
            }
          ]
        };
      });
      
      return new Response(JSON.stringify({
        success: true,
        products: mockProducts,
        count: mockProducts.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Setup Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to fetch products from cache if not forcing refresh
    if (!forceRefresh) {
      const { data: cachedProducts, error: cacheError } = await supabase
        .from('shopify_cached_products')
        .select('*')
        .eq('shop', shop)
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (!cacheError && cachedProducts && cachedProducts.length > 0 && cachedProducts[0].products) {
        console.log(`[${requestId}] Returning cached products for ${shop}`);
        let productsData = cachedProducts[0].products;
        
        // Filter out test products if needed
        if (!includeTestProducts) {
          productsData = productsData.filter((product: any) => !isTestProduct(product));
        }
        
        return new Response(JSON.stringify({
          success: true,
          products: productsData,
          count: productsData.length,
          cached: true,
          cache_time: cachedProducts[0].updated_at
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // If we get here, we need to fetch from Shopify API
    console.log(`[${requestId}] Fetching products from Shopify API for ${shop}`);
    
    // Get shop access token
    const { data: shopData, error: shopError } = await supabase
      .from('shopify_shops')
      .select('access_token')
      .eq('shop', shop)
      .single();
      
    if (shopError || !shopData) {
      console.error(`[${requestId}] Error fetching shop access token:`, shopError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Shop not found or access token missing',
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch products from Shopify API
    try {
      const shopifyResponse = await fetch(`https://${shop}/admin/api/2023-10/products.json?limit=250`, {
        headers: {
          'X-Shopify-Access-Token': shopData.access_token,
          'Content-Type': 'application/json'
        }
      });
      
      if (!shopifyResponse.ok) {
        throw new Error(`Shopify API error: ${shopifyResponse.status} ${shopifyResponse.statusText}`);
      }
      
      const shopifyData = await shopifyResponse.json();
      let products = shopifyData.products;
      
      // Cache products in Supabase
      const { error: cacheInsertError } = await supabase
        .from('shopify_cached_products')
        .upsert({
          shop,
          products,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'shop'
        });
        
      if (cacheInsertError) {
        console.error(`[${requestId}] Error caching products:`, cacheInsertError);
      }
      
      // Filter out test products if needed
      if (!includeTestProducts) {
        products = products.filter((product: any) => !isTestProduct(product));
      }
      
      return new Response(JSON.stringify({
        success: true,
        products,
        count: products.length,
        cached: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error(`[${requestId}] Error fetching products from Shopify:`, error);
      
      return new Response(JSON.stringify({
        success: false,
        message: `Error fetching products: ${error.message}`,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: `Unhandled error: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
