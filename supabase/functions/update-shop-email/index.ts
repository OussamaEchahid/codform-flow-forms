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

    // Try to get shop owner email from multiple Shopify endpoints
    let shopOwnerEmail = null
    let shopOwnerName = null
    
    try {
      // First try: shop.json endpoint
      const shopInfoResponse = await fetch(`https://${shop}/admin/api/2025-04/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': shopData.access_token,
          'Content-Type': 'application/json'
        }
      })

      if (shopInfoResponse.ok) {
        const shopInfo = await shopInfoResponse.json()
        console.log('🔍 Full shop info:', JSON.stringify(shopInfo.shop, null, 2))
        
        // Get name
        shopOwnerName = shopInfo.shop?.shop_owner || 
                       shopInfo.shop?.name ||
                       shopInfo.shop?.myshopify_domain

        // Try to get email from shop info
        shopOwnerEmail = shopInfo.shop?.email || 
                        shopInfo.shop?.customer_email ||
                        shopInfo.shop?.contact_email

        console.log(`📧 Found shop owner email: ${shopOwnerEmail}`)
        console.log(`👤 Found shop owner name: ${shopOwnerName}`)
      }

      // Second try: If no email from shop endpoint, try users endpoint
      if (!shopOwnerEmail) {
        console.log('🔄 Trying users endpoint for email...')
        const usersResponse = await fetch(`https://${shop}/admin/api/2025-04/users.json`, {
          headers: {
            'X-Shopify-Access-Token': shopData.access_token,
            'Content-Type': 'application/json'
          }
        })

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          console.log('👥 Users data:', JSON.stringify(usersData, null, 2))
          
          // Look for shop owner in users
          const shopOwner = usersData.users?.find(user => 
            user.account_owner === true || 
            user.permissions?.includes('store_admin')
          )
          
          if (shopOwner) {
            shopOwnerEmail = shopOwner.email
            if (!shopOwnerName) {
              shopOwnerName = `${shopOwner.first_name} ${shopOwner.last_name}`.trim()
            }
            console.log(`📧 Found owner email from users: ${shopOwnerEmail}`)
            console.log(`👤 Found owner name from users: ${shopOwnerName}`)
          }
        } else {
          console.log('❌ Users endpoint failed:', await usersResponse.text())
        }
      }

    } catch (error) {
      console.error('❌ Error fetching shop info:', error)
    }

    // Use a fallback email if we still don't have one
    if (!shopOwnerEmail) {
      shopOwnerEmail = `owner@${shop}`
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
        name: shopOwnerName,
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