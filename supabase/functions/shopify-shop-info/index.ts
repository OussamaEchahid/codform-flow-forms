import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = Math.random().toString(36).substr(2, 6);
  
  try {
    console.log(`[${requestId}] 🚀 طلب جلب معلومات المتجر`);
    
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
    let { shop } = body;

    console.log(`[${requestId}] 🏪 جلب معلومات للمتجر: ${shop}`);

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

    // Get shop access token from database
    const { data: shopData, error: shopError } = await supabase
      .from('shopify_stores')
      .select('access_token')
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

    // Fetch shop info from Shopify API
    try {
      console.log(`[${requestId}] 📡 جلب معلومات المتجر من Shopify API`);
      
      const shopInfoUrl = `https://${shop}/admin/api/2024-04/shop.json`;
      
      const shopInfoResponse = await fetch(shopInfoUrl, {
        headers: {
          'X-Shopify-Access-Token': shopData.access_token,
          'Content-Type': 'application/json'
        }
      });
      
      if (!shopInfoResponse.ok) {
        console.error(`[${requestId}] ❌ خطأ في جلب معلومات المتجر: ${shopInfoResponse.status} ${shopInfoResponse.statusText}`);
        return new Response(JSON.stringify({
          success: false,
          message: `Shop info API error: ${shopInfoResponse.status} ${shopInfoResponse.statusText}`,
        }), {
          status: shopInfoResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const shopInfoData = await shopInfoResponse.json();
      const shopInfo = shopInfoData.shop;
      
      console.log(`[${requestId}] ✅ تم جلب معلومات المتجر بنجاح - البريد: ${shopInfo.email}`);
      
      return new Response(JSON.stringify({
        success: true,
        shop: {
          id: shopInfo.id,
          name: shopInfo.name,
          email: shopInfo.email,
          domain: shopInfo.domain,
          myshopify_domain: shopInfo.myshopify_domain,
          currency: shopInfo.currency,
          money_format: shopInfo.money_format,
          money_with_currency_format: shopInfo.money_with_currency_format,
          timezone: shopInfo.timezone,
          phone: shopInfo.phone,
          address1: shopInfo.address1,
          address2: shopInfo.address2,
          city: shopInfo.city,
          country: shopInfo.country,
          province: shopInfo.province,
          zip: shopInfo.zip,
          created_at: shopInfo.created_at,
          updated_at: shopInfo.updated_at
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error(`[${requestId}] ❌ خطأ في جلب معلومات المتجر:`, error);
      
      return new Response(JSON.stringify({
        success: false,
        message: `Error fetching shop info: ${error.message}`,
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