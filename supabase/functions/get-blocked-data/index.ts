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
  console.log(`[${requestId}] Get blocked data request started`)

  try {
    const { action, shop_id } = await req.json()
    
    if (!action || !shop_id) {
      throw new Error('action and shop_id are required')
    }

    console.log(`[${requestId}] Action: ${action}, Shop: ${shop_id}`)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    let result

    switch (action) {
      case 'get_ips':
        const { data: ipsData, error: ipsError } = await supabaseClient
          .from('blocked_ips')
          .select('*')
          .eq('shop_id', shop_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (ipsError) throw ipsError
        result = { success: true, data: ipsData || [] }
        break

      case 'get_countries':
        const { data: countriesData, error: countriesError } = await supabaseClient
          .from('blocked_countries')
          .select('*')
          .eq('shop_id', shop_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (countriesError) throw countriesError
        result = { success: true, data: countriesData || [] }
        break

      default:
        throw new Error(`Invalid action: ${action}`)
    }

    console.log(`[${requestId}] Action ${action} completed successfully`)

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error) {
    console.error(`[${requestId}] Error in get-blocked-data:`, error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})