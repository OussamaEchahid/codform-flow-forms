import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = Math.random().toString(36).substr(2, 6);
  
  try {
    console.log(`[${requestId}] 🚀 تم استلام الطلب`);
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    let { shop, productIds, refresh = false, includeTestProducts = false } = body;

    console.log(`[${requestId}] 🏪 معالجة الطلب للمتجر: ${shop} (الأصلي: ${shop}), إعادة تحديث: ${refresh}, تضمين منتجات تجريبية: ${includeTestProducts}, معرفات المنتجات: ${productIds}`);

    if (!shop) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Shop parameter is required',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normalize shop domain
    if (!shop.includes('.myshopify.com')) {
      shop = `${shop}.myshopify.com`;
    }

    // Get shop access token and store info from database
    const { data: shopData, error: shopError } = await supabase
      .from('shopify_stores')
      .select('access_token, currency, money_format, money_with_currency_format')
      .eq('shop', shop)
      .single();
    
    if (shopError) {
      console.error(`[${requestId}] ❌ خطأ في قاعدة البيانات:`, shopError);
      return new Response(JSON.stringify({
        success: false,
        message: `Database error: ${shopError.message}`,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!shopData) {
      console.error(`[${requestId}] ❌ لم يتم العثور على المتجر: ${shop}`);
      return new Response(JSON.stringify({
        success: false,
        message: `Store ${shop} not found. Please ensure the store is properly connected.`,
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!shopData.access_token) {
      console.error(`[${requestId}] ❌ رمز الوصول مفقود للمتجر: ${shop}`);
      return new Response(JSON.stringify({
        success: false,
        message: 'Access token missing for store',
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch products from Shopify API
    try {
      console.log(`[${requestId}] 📡 جلب المنتجات من Shopify API للمتجر: ${shop}`);
      
      const apiUrl = `https://${shop}/admin/api/2024-04/products.json?limit=250&status=active`;
      
      const shopifyResponse = await fetch(apiUrl, {
        headers: {
          'X-Shopify-Access-Token': shopData.access_token,
          'Content-Type': 'application/json'
        }
      });
      
      if (!shopifyResponse.ok) {
        console.error(`[${requestId}] ❌ خطأ في Shopify API: ${shopifyResponse.status} ${shopifyResponse.statusText}`);
        return new Response(JSON.stringify({
          success: false,
          message: `Shopify API error: ${shopifyResponse.status} ${shopifyResponse.statusText}`,
        }), {
          status: shopifyResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const shopifyData = await shopifyResponse.json();
      let products = shopifyData.products;
      
      if (!products || !Array.isArray(products)) {
        console.error(`[${requestId}] ❌ بيانات منتج غير صالحة:`, products);
        return new Response(JSON.stringify({
          success: false,
          message: 'Invalid product data returned from Shopify API',
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[${requestId}] ✅ تم جلب ${products.length} منتج من Shopify`);
      
      // Transform the products to match our expected format
      products = products.map((product: any) => {
        // Process images
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
            compare_at_price: variant.compare_at_price,
            sku: variant.sku,
            inventory_quantity: variant.inventory_quantity,
            weight: variant.weight,
            weight_unit: variant.weight_unit,
          })) : [];
        
        // Get base price from first variant or default to '0'
        const basePrice = product.variants && product.variants.length > 0 ? 
          product.variants[0].price : '0';

        return {
          id: product.id.toString(),
          title: product.title,
          handle: product.handle,
          created_at: product.created_at,
          updated_at: product.updated_at,
          published_at: product.published_at,
          status: product.status,
          tags: product.tags,
          price: basePrice,
          images: images,
          featuredImage: featuredImage,
          variants: variants,
          // Add currency information from store
          currency: shopData.currency || 'USD',
          money_format: shopData.money_format || '${{amount}}',
          money_with_currency_format: shopData.money_with_currency_format || '${{amount}} USD'
        };
      });

      // Filter products if specific productIds are requested
      if (productIds && Array.isArray(productIds) && productIds.length > 0) {
        products = products.filter((product: any) => 
          productIds.includes(product.id) || productIds.includes(product.id.toString())
        );
        console.log(`[${requestId}] 🔍 تم تصفية المنتجات بناءً على المعرفات المطلوبة: ${productIds.join(', ')}, النتيجة: ${products.length} منتج`);
      }

      console.log(`[${requestId}] ✅ تم إرجاع ${products.length} منتج بنجاح`);
      
      return new Response(JSON.stringify({
        success: true,
        products,
        count: products.length,
        shop: shop,
        currency: shopData.currency || 'USD',
        money_format: shopData.money_format || '${{amount}}',
        money_with_currency_format: shopData.money_with_currency_format || '${{amount}} USD'
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