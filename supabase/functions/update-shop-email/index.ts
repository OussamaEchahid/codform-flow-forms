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

    console.log('📧 Update Shop Email Request:', req.method)

    const { shop } = await req.json()

    if (!shop) {
      return new Response(
        JSON.stringify({ error: 'Missing shop parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔍 Looking up shop: ${shop}`)

    // Get shop details from database
    const { data: shopData, error: shopError } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('shop', shop)
      .eq('is_active', true)
      .maybeSingle()

    if (shopError) {
      console.error('❌ Database error:', shopError)
      return new Response(
        JSON.stringify({ error: 'Database error', details: shopError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!shopData) {
      return new Response(
        JSON.stringify({ error: 'Shop not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If email is already set, return it
    if (shopData.email) {
      console.log(`✅ Email already exists: ${shopData.email}`)
      return new Response(
        JSON.stringify({ 
          success: true,
          shop: shopData.shop,
          email: shopData.email,
          message: 'البريد الإلكتروني موجود بالفعل'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get shop owner email from Shopify API
    let shopOwnerEmail = null
    try {
      const shopInfoResponse = await fetch(`https://${shop}/admin/api/2025-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': shopData.access_token,
          'Content-Type': 'application/json'
        }
      })

      if (shopInfoResponse.ok) {
        const shopInfo = await shopInfoResponse.json()
        shopOwnerEmail = shopInfo.shop?.shop_owner || shopInfo.shop?.email
        console.log(`📧 Found shop owner email: ${shopOwnerEmail}`)
      } else {
        console.error('❌ Shopify API error:', await shopInfoResponse.text())
      }
    } catch (error) {
      console.error('❌ Error fetching shop info:', error)
    }

    // Fallback email if we can't get it from Shopify
    if (!shopOwnerEmail) {
      shopOwnerEmail = `${shop.replace('.myshopify.com', '')}@shop.local`
      console.log(`📧 Using fallback email: ${shopOwnerEmail}`)
    }

    // Update shop with email
    const { error: updateError } = await supabase
      .from('shopify_stores')
      .update({
        email: shopOwnerEmail,
        updated_at: new Date().toISOString()
      })
      .eq('shop', shop)

    if (updateError) {
      console.error('❌ Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update shop email', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Shop email updated successfully: ${shop} -> ${shopOwnerEmail}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        shop,
        email: shopOwnerEmail,
        message: 'تم تحديث البريد الإلكتروني بنجاح'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in update-shop-email:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})