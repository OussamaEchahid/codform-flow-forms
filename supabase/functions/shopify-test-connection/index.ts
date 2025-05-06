
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // تعامل مع طلبات CORS المسبقة
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { shop, accessToken } = await req.json()

    if (!shop || !accessToken) {
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
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid token or shop', 
          status: shopifyResponse.status 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // نحن نقوم بإرجاع حالة نجاح مع رسالة خطأ بدلاً من كود حالة خطأ
        }
      )
    }

    const shopData = await shopifyResponse.json()
    
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
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
