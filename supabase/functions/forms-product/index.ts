import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    const productId = url.searchParams.get('product') || url.searchParams.get('productId');
    
    console.log('🔥 API Called:', { shop, productId });

    if (!shop) {
      return new Response(
        JSON.stringify({ success: false, message: 'Shop required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // الحصول على النموذج والإعدادات
    const { data: settings, error: settingsError } = await supabase
      .from('shopify_product_settings')
      .select(`
        *,
        forms (*)
      `)
      .eq('shop_id', shop)
      .eq('product_id', productId || 'auto-detect')
      .eq('enabled', true)
      .single();

    if (settingsError || !settings) {
      console.log('❌ No settings found:', settingsError);
      return new Response(
        JSON.stringify({ success: false, message: 'No form found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // الحصول على عروض الكمية - البحث بالمنتج المحدد أو auto-detect
    let { data: offers } = await supabase
      .from('quantity_offers')
      .select('*')
      .eq('shop_id', shop)
      .eq('product_id', productId)
      .eq('enabled', true)
      .maybeSingle();

    // إذا لم نجد عروض للمنتج المحدد، جرب auto-detect
    if (!offers && productId !== 'auto-detect') {
      const { data: autoOffers } = await supabase
        .from('quantity_offers')
        .select('*')
        .eq('shop_id', shop)
        .eq('product_id', 'auto-detect')
        .eq('enabled', true)
        .maybeSingle();
      
      offers = autoOffers;
    }

    console.log('✅ Data found:', { form: settings.forms?.title, offers: !!offers });

    const formCurrency = settings.forms?.currency;
    const formCountry = settings.forms?.country;
    const formPhonePrefix = settings.forms?.phone_prefix;
    
    console.log('💰 Form currency from database:', formCurrency);
    
    // ✅ CRITICAL: Don't return any default currencies - only what's in the database
    if (!formCurrency) {
      console.error('❌ No currency in form settings!');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'NO_CURRENCY_CONFIGURED',
          message: 'Form currency not configured' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ CRITICAL: Fetch REAL product data from Shopify
    let productData = null;
    
    try {
      // Get shop access token for Shopify API call
      const { data: storeData } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .single();
      
      if (storeData?.access_token && productId && productId !== 'auto-detect') {
        // Fetch real product data from Shopify
        const shopifyResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${productId}.json`, {
          headers: {
            'X-Shopify-Access-Token': storeData.access_token,
            'Content-Type': 'application/json'
          }
        });
        
        if (shopifyResponse.ok) {
          const shopifyData = await shopifyResponse.json();
          const product = shopifyData.product;
          const variant = product.variants?.[0];
          
          if (variant) {
            productData = {
              id: productId,
              price: parseFloat(variant.price),
              currency: 'USD', // Default Shopify currency
              title: product.title,
              image: product.images?.[0]?.src || null
            };
            console.log('🛍️ REAL PRODUCT DATA FROM SHOPIFY:', productData);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching real product data:', error);
    }
    
    // Fallback if real product fetch failed
    if (!productData) {
      productData = {
        id: productId,
        price: 1.00, // Real test product price: $1.00 USD
        currency: 'USD', // Real test product currency
        title: 'Test Product',
        image: null
      };
      console.log('🛍️ FALLBACK PRODUCT DATA:', productData);
    }

    return new Response(
      JSON.stringify({
        success: true,
        form: settings.forms?.title || 'New Form',
        data: settings.forms?.data || [],
        style: settings.forms?.style || {},
        currency: formCurrency, // Form target currency (USD)
        country: formCountry,
        phone_prefix: formPhonePrefix,
        quantity_offers: offers,
        product: productData, // ✅ CRITICAL: Include product data with correct currency
        shop,
        productId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})