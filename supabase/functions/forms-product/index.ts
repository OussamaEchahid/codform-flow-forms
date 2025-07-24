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

    console.log('🚀 تم استلام الطلب');
    console.log(`🏪 معالجة الطلب للمتجر: ${shop}, معرف المنتج: ${productId}, معرف البلوك: ${blockId}`);

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

    // البحث عن النموذج المرتبط بالمنتج أو النموذج العام
    let query = supabase
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
      .eq('enabled', true);

    // إذا كان هناك معرف منتج محدد، ابحث عنه أولاً
    if (productId && productId !== 'default') {
      query = query.or(`product_id.eq.${productId},product_id.eq.auto-detect`);
    } else {
      // إذا لم يكن هناك معرف منتج، ابحث عن النموذج العام
      query = query.eq('product_id', 'auto-detect');
    }

    const { data: productSettings, error } = await query.limit(1);

    if (error) {
      console.error('❌ خطأ في قاعدة البيانات:', error);
      return new Response(
        JSON.stringify({ success: false, message: `Database error: ${error.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!productSettings || productSettings.length === 0) {
      console.log('⚠️ لا توجد إعدادات منتج للمتجر:', shop);
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
      console.log('⚠️ لا يوجد نموذج مرتبط بالإعدادات');
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

    // البحث عن عروض الكمية إذا كانت موجودة
    const { data: quantityOffers } = await supabase
      .from('quantity_offers')
      .select('*')
      .eq('shop_id', shop)
      .eq('enabled', true)
      .or(`form_id.eq.${form.id},product_id.eq.${productId || 'auto-detect'}`)
      .limit(1);

    console.log('🎯 البحث عن عروض الكمية للمنتج:', productId, 'والنموذج:', form.id);
    console.log('🎯 عروض الكمية الموجودة:', quantityOffers);

    console.log('✅ تم العثور على النموذج:', form.title);
    
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
    console.error('❌ خطأ عام:', error);
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