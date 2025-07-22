
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
  includeTestProducts?: boolean;
  accessToken?: string;
  productIds?: string[];
}

// Clean and validate shop domain
function cleanShopDomain(shop: string): string {
  if (!shop) return "";
  
  let cleanedShop = shop.trim();
  
  // Remove protocol if present
  if (cleanedShop.startsWith('http')) {
    try {
      const url = new URL(cleanedShop);
      cleanedShop = url.hostname;
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  // Ensure it ends with myshopify.com
  if (!cleanedShop.endsWith('myshopify.com')) {
    if (!cleanedShop.includes('.')) {
      cleanedShop = `${cleanedShop}.myshopify.com`;
    }
  }
  
  return cleanedShop;
}

serve(async (req: Request) => {
  try {
    const requestId = `edge_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`[${requestId}] 🚀 Request received`);
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return handleOptions();
    }

    // Get shop from query params or body
    const url = new URL(req.url);
    let shop = url.searchParams.get('shop');
    let forceRefresh = url.searchParams.get('forceRefresh') === 'true';
    let includeTestProducts = url.searchParams.get('includeTestProducts') === 'true';
    let accessToken: string | undefined = undefined;
    let productIds: string[] | undefined = undefined;
    
    // If not in query params, try to get from request body
    if (!shop || req.method === 'POST') {
      try {
        const body = await req.json() as RequestParams;
        shop = body.shop || shop;
        forceRefresh = body.forceRefresh || false;
        includeTestProducts = body.includeTestProducts || false;
        accessToken = body.accessToken;
        productIds = body.productIds;
      } catch (err) {
        console.error(`[${requestId}] ❌ Error parsing request body:`, err);
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

    // Clean and validate shop domain
    const cleanedShop = cleanShopDomain(shop);
    console.log(`[${requestId}] 🏪 Processing request for shop: ${cleanedShop} (original: ${shop}), force refresh: ${forceRefresh}, include test products: ${includeTestProducts}, product IDs: ${productIds}`);

    // Setup Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If specific product IDs are requested, try to fetch them specifically
    if (productIds && productIds.length > 0) {
      console.log(`[${requestId}] 🎯 Fetching specific products: ${productIds}`);
      
      // Get shop access token
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', cleanedShop)
        .single();
      
      if (shopError) {
        console.error(`[${requestId}] ❌ Database error:`, shopError);
        return new Response(JSON.stringify({
          success: false,
          message: `Database error: ${shopError.message}`,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!shopData) {
        console.error(`[${requestId}] ❌ Store not found: ${cleanedShop}`);
        return new Response(JSON.stringify({
          success: false,
          message: `Store ${cleanedShop} not found. Please ensure the store is properly connected.`,
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!shopData.access_token) {
        console.error(`[${requestId}] ❌ Access token missing for store: ${cleanedShop}`);
        
        // Generate mock products for specific IDs if this is a dev store
        if (cleanedShop.includes('myshopify.com')) {
          console.log(`[${requestId}] 🧪 Development store detected, returning mock data for specific IDs`);
          const mockProducts = productIds.map((id, index) => {
            const cleanId = id.replace('gid://shopify/Product/', '');
            return {
              id: cleanId,
              title: `Test Product ${index + 1} (ID: ${cleanId})`,
              handle: `mock-product-${index + 1}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              published_at: new Date().toISOString(),
              status: 'active',
              tags: 'test-product',
              price: `${Math.floor(10 + Math.random() * 90)}.99`,
              images: [`https://via.placeholder.com/500x500.png?text=Test+Product+${index+1}`],
              featuredImage: `https://via.placeholder.com/500x500.png?text=Test+Product+${index+1}`,
              variants: [
                {
                  id: `${2000000 + index}`,
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
            count: mockProducts.length,
            isMockData: true
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify({
          success: false,
          message: 'Shop not found or access token missing',
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Clean product IDs (remove GraphQL prefix if present)
      const cleanProductIds = productIds.map(id => 
        id.includes('gid://shopify/Product/') ? id.replace('gid://shopify/Product/', '') : id
      );
      
      console.log(`[${requestId}] 🧹 Clean product IDs: ${cleanProductIds}`);
      
      // Fetch specific products from Shopify API
      try {
        const idsQuery = cleanProductIds.map(id => `ids=${id}`).join('&');
        const apiUrl = `https://${cleanedShop}/admin/api/2024-04/products.json?${idsQuery}&status=any`;
        
        console.log(`[${requestId}] 📡 Calling Shopify API: ${apiUrl}`);
        
        const shopifyResponse = await fetch(apiUrl, {
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
        
        console.log(`[${requestId}] 📦 Shopify API returned ${products?.length || 0} products`);
        
        if (!products || !Array.isArray(products)) {
          console.error(`[${requestId}] ❌ Invalid product data:`, products);
          products = [];
        }
        
        // Transform the products to match our expected format
        products = products.map((product: any) => {
          // Process images - choose best available image
          let featuredImage = '/placeholder.svg';
          
          if (product.image?.src) {
            featuredImage = product.image.src;
          } else if (product.images && product.images.length > 0) {
            featuredImage = product.images[0].src;
          }
          
          const images = product.images && product.images.length > 0 ? 
            product.images.map((img: any) => img.src) : [featuredImage];
          
          // Process variants
          const variants = product.variants && product.variants.length > 0 ?
            product.variants.map((variant: any) => ({
              id: variant.id,
              title: variant.title,
              price: variant.price,
              available: variant.inventory_quantity > 0 || variant.inventory_policy === 'continue'
            })) : [];
          
          console.log(`[${requestId}] 🔧 Transforming product ${product.id}:`, {
            id: product.id,
            title: product.title,
            featuredImage,
            imagesCount: images.length
          });
          
          return {
            id: product.id,
            title: product.title,
            handle: product.handle,
            created_at: product.created_at,
            updated_at: product.updated_at,
            published_at: product.published_at,
            status: product.status,
            tags: product.tags,
            price: product.variants && product.variants.length > 0 ? product.variants[0].price : '0',
            images: images,
            featuredImage: featuredImage,
            variants: variants
          };
        });
        
        console.log(`[${requestId}] ✅ Transformed ${products.length} products`);
        
        return new Response(JSON.stringify({
          success: true,
          products,
          count: products.length,
          cached: false,
          specificIds: true,
          shop: cleanedShop
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error(`[${requestId}] ❌ Error fetching specific products from Shopify:`, error);
        
        return new Response(JSON.stringify({
          success: false,
          message: `Error fetching specific products: ${error.message}`,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Regular flow for all products (existing code)
    // Try to fetch products from cache if not forcing refresh
    if (!forceRefresh) {
      const { data: cachedProducts, error: cacheError } = await supabase
        .from('shopify_cached_products')
        .select('*')
        .eq('shop', cleanedShop)
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (!cacheError && cachedProducts && cachedProducts.length > 0 && cachedProducts[0].products) {
        console.log(`[${requestId}] 📂 Returning cached products for shop ${cleanedShop}`);
        let productsData = cachedProducts[0].products;
        
        // Always filter test products unless explicitly included
        if (!includeTestProducts) {
          productsData = filterTestProducts(productsData);
          console.log(`[${requestId}] 🧹 Filtered test products from cache, returning ${productsData.length} products`);
        }
        
        return new Response(JSON.stringify({
          success: true,
          products: productsData,
          count: productsData.length,
          cached: true,
          cache_time: cachedProducts[0].updated_at,
          shop: cleanedShop
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Get shop access token if not provided
    if (!accessToken) {
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', cleanedShop)
        .single();
      
      if (shopError) {
        console.error(`[${requestId}] ❌ Database error:`, shopError);
        return new Response(JSON.stringify({
          success: false,
          message: `Database error: ${shopError.message}`,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!shopData) {
        console.error(`[${requestId}] ❌ Store not found: ${cleanedShop}`);
        return new Response(JSON.stringify({
          success: false,
          message: `Store ${cleanedShop} not found. Please ensure the store is properly connected.`,
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!shopData.access_token) {
        console.error(`[${requestId}] ❌ Access token missing for store: ${cleanedShop}`);
        
        // Generate mock products only if this is a dev store
        if (cleanedShop.includes('myshopify.com')) {
          console.log(`[${requestId}] 🧪 Development store detected, returning mock data`);
          const mockProducts = generateMockProducts();
          
          return new Response(JSON.stringify({
            success: true,
            products: mockProducts,
            count: mockProducts.length,
            isMockData: true,
            shop: cleanedShop
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify({
          success: false,
          message: 'Shop not found or access token missing',
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      accessToken = shopData.access_token;
    }
    
    // Fetch products from Shopify API
    try {
      // Fetch all active products
      const apiUrl = `https://${cleanedShop}/admin/api/2024-04/products.json?limit=250&status=active`;
      
      const shopifyResponse = await fetch(apiUrl, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (!shopifyResponse.ok) {
        throw new Error(`Shopify API error: ${shopifyResponse.status} ${shopifyResponse.statusText}`);
      }
      
      const shopifyData = await shopifyResponse.json();
      let products = shopifyData.products;
      
      if (!products || !Array.isArray(products)) {
        console.error(`[${requestId}] ❌ Invalid product data:`, products);
        throw new Error('Invalid product data returned from Shopify API');
      }
      
      // Transform the products to match our expected format
      products = products.map((product: any) => {
        // Process images - choose best available image
        let featuredImage = '/placeholder.svg';
        
        if (product.image?.src) {
          featuredImage = product.image.src;
        } else if (product.images && product.images.length > 0) {
          featuredImage = product.images[0].src;
        }
        
        const images = product.images && product.images.length > 0 ? 
          product.images.map((img: any) => img.src) : [featuredImage];
        
        // Process variants
        const variants = product.variants && product.variants.length > 0 ?
          product.variants.map((variant: any) => ({
            id: variant.id,
            title: variant.title,
            price: variant.price,
            available: variant.inventory_quantity > 0 || variant.inventory_policy === 'continue'
          })) : [];
        
        return {
          id: product.id,
          title: product.title,
          handle: product.handle,
          created_at: product.created_at,
          updated_at: product.updated_at,
          published_at: product.published_at,
          status: product.status,
          tags: product.tags,
          price: product.variants && product.variants.length > 0 ? product.variants[0].price : '0',
          images: images,
          featuredImage: featuredImage,
          variants: variants
        };
      });
      
      // Cache products in Supabase - with better error handling
      try {
        const { error: cacheInsertError } = await supabase
          .from('shopify_cached_products')
          .upsert({
            shop: cleanedShop,
            products,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'shop'
          });
          
        if (cacheInsertError) {
          console.error(`[${requestId}] ❌ Error caching products:`, cacheInsertError);
        } else {
          console.log(`[${requestId}] ✅ Cached ${products.length} products for shop ${cleanedShop}`);
        }
      } catch (cacheError) {
        console.error(`[${requestId}] ❌ Failed to cache products:`, cacheError);
        // Continue anyway, caching is not critical
      }
      
      // Filter out test products unless explicitly included
      if (!includeTestProducts) {
        const originalCount = products.length;
        products = filterTestProducts(products);
        console.log(`[${requestId}] 🧹 Filtered ${originalCount - products.length} test products, returning ${products.length} products`);
      }
      
      return new Response(JSON.stringify({
        success: true,
        products,
        count: products.length,
        cached: false,
        shop: cleanedShop
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error(`[${requestId}] ❌ Error fetching products from Shopify:`, error);
      
      return new Response(JSON.stringify({
        success: false,
        message: `Error fetching products: ${error.message}`,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: `Unhandled error: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to generate mock products
function generateMockProducts() {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `${1000000 + i}`,
    title: `Test Product ${i + 1}${i < 2 ? " (This is test data)" : ""}`,
    handle: `mock-product-${i + 1}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    status: 'active',
    tags: 'test-product',
    price: `${Math.floor(10 + Math.random() * 90)}.99`,
    images: [`https://via.placeholder.com/500x500.png?text=Test+Product+${i+1}`],
    featuredImage: `https://via.placeholder.com/500x500.png?text=Test+Product+${i+1}`,
    variants: [
      {
        id: `${2000000 + i}`,
        price: `${Math.floor(10 + Math.random() * 90)}.99`,
        title: 'Default Title',
        available: true
      }
    ]
  }));
}

// Helper function to filter test products
function filterTestProducts(products: any[]) {
  if (!Array.isArray(products)) return [];
  
  return products.filter(product => {
    const title = (product.title || '').toLowerCase();
    const handle = (product.handle || '').toLowerCase();
    const tags = product.tags ? 
      (Array.isArray(product.tags) ? product.tags.join(' ').toLowerCase() : String(product.tags).toLowerCase()) : 
      '';
      
    // More accurate test for detecting test products, but avoiding false positives
    // on real products that just happen to have "test" somewhere in the title
    const isTestProduct = 
      title === 'test' || 
      handle === 'test' || 
      title === 'test product' ||
      title === 'demo' || 
      handle === 'demo' || 
      title === 'demo product' ||
      title === 'sample' || 
      handle === 'sample' || 
      title === 'sample product' ||
      title.startsWith('test ') ||
      tags.includes('test-product') ||
      tags.includes('demo-product') ||
      tags.includes('sample-product');
      
    return !isTestProduct;
  });
}
