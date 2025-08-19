import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID().substring(0, 8)
  console.log(`[${requestId}] Manage blocked items request started`)

  try {
    const { action, ...params } = await req.json()
    
    if (!action) {
      throw new Error('action is required')
    }

    console.log(`[${requestId}] Action: ${action}`)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    let result

    switch (action) {
      case 'add_ip':
        const { shop_id, ip_address, reason, redirect_url } = params
        
        if (!shop_id || !ip_address) {
          throw new Error('shop_id and ip_address are required')
        }

        result = await supabaseClient.rpc('add_blocked_ip', {
          p_ip_address: ip_address,
          p_shop_id: shop_id,
          p_reason: reason || 'غير محدد',
          p_redirect_url: redirect_url
        })
        
        break

      case 'remove_ip':
        const { blocked_id: ip_blocked_id } = params
        
        if (!ip_blocked_id) {
          throw new Error('blocked_id is required')
        }

        result = await supabaseClient.rpc('remove_blocked_ip', {
          p_blocked_id: ip_blocked_id
        })
        
        break

      case 'add_country':
        const { shop_id: country_shop_id, country_code, country_name, reason: country_reason, redirect_url: country_redirect } = params
        
        if (!country_shop_id || !country_code || !country_name) {
          throw new Error('shop_id, country_code, and country_name are required')
        }

        result = await supabaseClient.rpc('add_blocked_country', {
          p_shop_id: country_shop_id,
          p_country_code: country_code,
          p_country_name: country_name,
          p_reason: country_reason || 'غير محدد',
          p_redirect_url: country_redirect
        })
        
        break

      case 'remove_country':
        const { blocked_id: country_blocked_id } = params
        
        if (!country_blocked_id) {
          throw new Error('blocked_id is required')
        }

        result = await supabaseClient.rpc('remove_blocked_country', {
          p_blocked_id: country_blocked_id
        })
        
        break

      default:
        throw new Error(`Invalid action: ${action}`)
    }

    if (result.error) {
      console.error(`[${requestId}] Database error:`, result.error)
      throw result.error
    }

    console.log(`[${requestId}] Action ${action} completed successfully`)

    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      action: action
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error) {
    console.error(`[${requestId}] Error in manage-blocked-items:`, error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      action: null
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})