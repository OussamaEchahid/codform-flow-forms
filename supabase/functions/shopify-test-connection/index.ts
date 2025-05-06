
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // تعامل مع طلبات CORS المسبقة
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Test connection request received:", req.url);
    const { shop, accessToken } = await req.json()
    
    console.log(`Testing connection for shop: ${shop}`);

    if (!shop || !accessToken) {
      console.error("Missing required parameters: shop or accessToken");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: shop or accessToken' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // اختبار الاتصال من خلال استدعاء API لـ Shopify - استدعاء بسيط لجلب متجر
    const shopifyResponse = await fetch(`https://${shop}/admin/api/2023-07/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error(`Invalid token or shop. Status: ${shopifyResponse.status}, Response: ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid token or shop', 
          status: shopifyResponse.status,
          error: errorText 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // نحن نقوم بإرجاع حالة نجاح مع رسالة خطأ بدلاً من كود حالة خطأ
        }
      )
    }

    const shopData = await shopifyResponse.json()
    console.log(`Connection successful for shop: ${shop}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Connection successful', 
        shop: shopData.shop
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error testing connection:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
