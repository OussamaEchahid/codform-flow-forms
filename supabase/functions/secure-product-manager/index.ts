import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductRequest {
  action: 'fetch_products' | 'get_token';
  shop: string;
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // استخراج معلومات المستخدم من التوكن
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ProductRequest = await req.json();
    const { action, shop, userId } = body;

    console.log('🛍️ Secure Product Manager Request:', { action, shop, userId: user.id });

    // التحقق من أن المستخدم يملك هذا المتجر
    const { data: storeCheck, error: storeError } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('shop', shop)
      .eq('user_id', user.id)
      .single();

    if (storeError || !storeCheck?.access_token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Store not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'fetch_products': {
        const accessToken = storeCheck.access_token;
        
        // جلب المنتجات من Shopify
        const productsResponse = await fetch(
          `https://${shop}/admin/api/2025-04/products.json?limit=250`,
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            }
          }
        );

        if (!productsResponse.ok) {
          console.error('❌ Error fetching products from Shopify:', productsResponse.status);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to fetch products from Shopify' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const productsData = await productsResponse.json();
        
        console.log('✅ Products fetched successfully:', productsData.products?.length || 0);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            products: productsData.products || [],
            shop: shop 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_token': {
        // إرجاع معلومات الوصول فقط للمستخدم المالك
        return new Response(
          JSON.stringify({ 
            success: true, 
            hasAccess: true,
            shop: shop
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('❌ Secure Product Manager Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});