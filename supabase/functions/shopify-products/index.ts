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

serve(async (req: Request) => {
  try {
    const requestId = `edge_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`[${requestId}] 🚀 تم استلام الطلب`);
    
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
        console.error(`[${requestId}] ❌ خطأ في تحليل محتوى الطلب:`, err);
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

    console.log(`[${requestId}] 📊 معالجة الطلب للمتجر: ${shop}, إعادة تحديث: ${forceRefresh}, تضمين منتجات تجريبية: ${includeTestProducts}, معرفات المنتجات: ${productIds}`);

    // Setup Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If specific product IDs are requested, try to fetch them specifically
    if (productIds && productIds.length > 0) {
      console.log(`[${requestId}] 🎯 جلب منتجات محددة: ${productIds}`);
      
      // Get shop access token
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
      
      if (shopError || !shopData || !shopData.access_token) {
        console.error(`[${requestId}] ❌ خطأ في جلب رمز الوصول للمتجر:`, shopError);
        
        // Generate mock products for specific IDs if this is a dev store
        if (shop.includes('myshopify.com')) {
          console.log(`[${requestId}] 🧪 تم اكتشاف متجر تجريبي، إرجاع بيانات وهمية للمعرفات المحددة`);
          const mockProducts = productIds.map((id, index) => {
            const cleanId = id.replace('gid://shopify/Product/', '');
            return {
              id: cleanId,
              title: `منتج تجريبي ${index + 1} (معرف: ${cleanId})`,
              handle: `mock-product-${index + 1}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              published_at: new Date().toISOString(),
              status: 'active',
              tags: 'test-product',
              price: `${Math.floor(10 + Math.random() * 90)}.99`,
              images: [`https://via.placeholder.com/500x500.png?text=منتج+تجريبي+${index+1}`],
              featuredImage: `https://via.placeholder.com/500x500.png?text=منتج+تجريبي+${index+1}`,
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
      
      console.log(`[${requestId}] 🧹 معرفات المنتجات النظيفة: ${cleanProductIds}`);
      
      // Fetch specific products from Shopify API
      try {
        const idsQuery = cleanProductIds.map(id => `ids=${id}`).join('&');
        const apiUrl = `https://${shop}/admin/api/2024-04/products.json?${idsQuery}&status=any`;
        
        console.log(`[${requestId}] 📡 استدعاء Shopify API: ${apiUrl}`);
        
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
        
        console.log(`[${requestId}] 📦 Shopify API أرجع ${products?.length || 0} منتج`);
        
        if (!products || !Array.isArray(products)) {
          console.error(`[${requestId}] ❌ بيانات منتج غير صالحة:`, products);
          products = [];
        }
        
        // Transform the products to match our expected format
        products = products.map((product: any) => {
          // Process images - اختيار أفضل صورة متاحة
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
          
          console.log(`[${requestId}] 🔧 تحويل المنتج ${product.id}:`, {
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
        
        console.log(`[${requestId}] ✅ تم تحويل ${products.length} منتج`);
        
        return new Response(JSON.stringify({
          success: true,
          products,
          count: products.length,
          cached: false,
          specificIds: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error(`[${requestId}] ❌ خطأ في جلب منتجات محددة من Shopify:`, error);
        
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
        .eq('shop', shop)
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (!cacheError && cachedProducts && cachedProducts.length > 0 && cachedProducts[0].products) {
        console.log(`[${requestId}] 📂 إرجاع منتجات مخزنة للمتجر ${shop}`);
        let productsData = cachedProducts[0].products;
        
        // Always filter test products unless explicitly included
        if (!includeTestProducts) {
          productsData = filterTestProducts(productsData);
          console.log(`[${requestId}] 🧹 تم تصفية المنتجات التجريبية من الذاكرة المؤقتة، إرجاع ${productsData.length} منتج`);
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
    
    // Get shop access token if not provided
    if (!accessToken) {
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
      
      if (shopError || !shopData || !shopData.access_token) {
        console.error(`[${requestId}] ❌ خطأ في جلب رمز الوصول للمتجر:`, shopError);
        
        // Generate mock products only if this is a dev store
        if (shop.includes('myshopify.com')) {
          console.log(`[${requestId}] 🧪 تم اكتشاف متجر تجريبي، إرجاع بيانات وهمية`);
          const mockProducts = generateMockProducts();
          
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
      
      accessToken = shopData.access_token;
    }
    
    // Fetch products from Shopify API
    try {
      // Fetch all active products
      const apiUrl = `https://${shop}/admin/api/2024-04/products.json?limit=250&status=active`;
      
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
        console.error(`[${requestId}] ❌ بيانات منتج غير صالحة:`, products);
        throw new Error('Invalid product data returned from Shopify API');
      }
      
      // Transform the products to match our expected format
      products = products.map((product: any) => {
        // Process images - اختيار أفضل صورة متاحة
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
            shop,
            products,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'shop'
          });
          
        if (cacheInsertError) {
          console.error(`[${requestId}] ❌ خطأ في حفظ المنتجات في الذاكرة المؤقتة:`, cacheInsertError);
        } else {
          console.log(`[${requestId}] ✅ تم حفظ ${products.length} منتج في الذاكرة المؤقتة للمتجر ${shop}`);
        }
      } catch (cacheError) {
        console.error(`[${requestId}] ❌ فشل عملية الحفظ في الذاكرة المؤقتة:`, cacheError);
        // Continue anyway, caching is not critical
      }
      
      // Filter out test products unless explicitly included
      if (!includeTestProducts) {
        const originalCount = products.length;
        products = filterTestProducts(products);
        console.log(`[${requestId}] 🧹 تم تصفية ${originalCount - products.length} منتج تجريبي، إرجاع ${products.length} منتج`);
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
      console.error(`[${requestId}] ❌ خطأ في جلب المنتجات من Shopify:`, error);
      
      return new Response(JSON.stringify({
        success: false,
        message: `Error fetching products: ${error.message}`,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error);
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
    title: `منتج تجريبي ${i + 1}${i < 2 ? " (هذه بيانات تجريبية)" : ""}`,
    handle: `mock-product-${i + 1}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    status: 'active',
    tags: 'test-product',
    price: `${Math.floor(10 + Math.random() * 90)}.99`,
    images: [`https://via.placeholder.com/500x500.png?text=منتج+تجريبي+${i+1}`],
    featuredImage: `https://via.placeholder.com/500x500.png?text=منتج+تجريبي+${i+1}`,
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
