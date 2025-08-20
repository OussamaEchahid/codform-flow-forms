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
    const { type, shop_id } = await req.json()
    
    if (!type || !shop_id) {
      throw new Error('type and shop_id are required')
    }

    console.log(`[${requestId}] Getting ${type} for shop: ${shop_id}`)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    let data = []
    let error = null

    if (type === 'ips') {
      const result = await supabaseClient
        .from('blocked_ips')
        .select('*')
        .eq('shop_id', shop_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      data = result.data
      error = result.error
    } else if (type === 'countries') {
      const result = await supabaseClient
        .from('blocked_countries')
        .select('*')
        .eq('shop_id', shop_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      data = result.data
      error = result.error
    } else {
      throw new Error('Invalid type. Must be "ips" or "countries"')
    }

    if (error) {
      console.error(`[${requestId}] Database error:`, error)
      throw error
    }

    console.log(`[${requestId}] Found ${data?.length || 0} blocked ${type}`)

    return new Response(JSON.stringify({
      success: true,
      data: data || [],
      count: data?.length || 0
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error) {
    console.error(`[${requestId}] Error in get-blocked-data:`, error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      data: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})