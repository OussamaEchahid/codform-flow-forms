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

    return new Response(
      JSON.stringify({
        success: true,
        form: settings.forms?.title || 'New Form',
        data: settings.forms?.data || [],
        style: settings.forms?.style || {},
        quantity_offers: offers,
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