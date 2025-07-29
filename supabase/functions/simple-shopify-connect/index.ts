import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔗 Simple Shopify Connect Request:', req.method)

    const { shop, access_token } = await req.json()

    if (!shop || !access_token) {
      return new Response(
        JSON.stringify({ error: 'Missing shop or access_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🏪 Connecting shop: ${shop}`)

    // Get shop owner email from Shopify API
    let shopOwnerEmail = null
    try {
      const shopInfoResponse = await fetch(`https://${shop}/admin/api/2025-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': access_token,
          'Content-Type': 'application/json'
        }
      })

      if (shopInfoResponse.ok) {
        const shopInfo = await shopInfoResponse.json()
        shopOwnerEmail = shopInfo.shop?.shop_owner || shopInfo.shop?.email
        console.log(`📧 Shop owner email: ${shopOwnerEmail}`)
      }
    } catch (error) {
      console.error('Error fetching shop info:', error)
    }

    // Fallback email if we can't get it from Shopify
    if (!shopOwnerEmail) {
      shopOwnerEmail = `${shop.replace('.myshopify.com', '')}@shop.local`
      console.log(`📧 Using fallback email: ${shopOwnerEmail}`)
    }

    // Store the shop connection with email
    const { error: storeError } = await supabase
      .from('shopify_stores')
      .upsert({
        shop,
        access_token,
        email: shopOwnerEmail,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'shop'
      })

    if (storeError) {
      console.error('❌ Database error:', storeError)
      return new Response(
        JSON.stringify({ error: 'Failed to save store', details: storeError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Shop connected successfully: ${shop}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        shop,
        email: shopOwnerEmail,
        message: 'متجر متصل بنجاح'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in simple-shopify-connect:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})