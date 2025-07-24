import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    const productId = url.searchParams.get('product') || url.searchParams.get('productId');
    const blockId = url.searchParams.get('blockId');

    console.log('🚀 Request received for shop:', shop, 'product:', productId, 'block:', blockId);

    if (!shop) {
      return new Response(
        JSON.stringify({ success: false, message: 'Shop parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // إنشاء عميل Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // البحث عن النموذج والإعدادات
    const { data: productSettings, error: settingsError } = await supabase
      .from('shopify_product_settings')
      .select(`
        *,
        forms (
          id,
          title,
          description,
          data,
          style,
          currency,
          phone_prefix,
          country
        )
      `)
      .eq('shop_id', shop)
      .eq('enabled', true)
      .or(productId ? `product_id.eq.${productId},product_id.eq.auto-detect` : `product_id.eq.auto-detect`)
      .limit(1);

    if (settingsError) {
      console.error('❌ Database error:', settingsError);
      return new Response(
        JSON.stringify({ success: false, message: `Database error: ${settingsError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!productSettings || productSettings.length === 0) {
      console.log('⚠️ No product settings found for shop:', shop);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No form associated with this product',
          shop,
          productId 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const setting = productSettings[0];
    const form = setting.forms;

    if (!form) {
      console.log('⚠️ No form linked to settings');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Form not found for this product setting' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // البحث عن عروض الكمية
    const { data: quantityOffers } = await supabase
      .from('quantity_offers')
      .select('*')
      .eq('shop_id', shop)
      .eq('enabled', true)
      .or(`form_id.eq.${form.id},product_id.eq.${productId || 'auto-detect'}`)
      .limit(1);

    console.log('✅ Found form:', form.title);
    console.log('🎯 Quantity offers found:', quantityOffers ? quantityOffers.length : 0);
    
    const responseData = {
      success: true,
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        data: form.data,
        style: form.style,
        currency: form.currency || 'SAR',
        phone_prefix: form.phone_prefix || '+966',
        country: form.country || 'SA'
      },
      quantity_offers: quantityOffers && quantityOffers.length > 0 ? quantityOffers[0] : null,
      shop,
      productId: productId || 'auto-detect'
    };

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ General error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Server error: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})