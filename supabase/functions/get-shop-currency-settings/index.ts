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
    // Initialize Supabase client with anon key for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Support both GET (query param) and POST (JSON body) to be compatible with callers
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let shop_id: string | null = null

    if (req.method === 'GET') {
      const url = new URL(req.url)
      shop_id = url.searchParams.get('shop_id') || url.searchParams.get('shop')
    } else {
      try {
        const body = await req.json()
        shop_id = body?.shop_id || body?.shop || body?.shopId || null
      } catch (_) {
        shop_id = null
      }
    }

    if (!shop_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'shop_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Getting currency settings for shop:', shop_id)

    // استخدام database function موجودة مع تعطيل RLS
    const { data: settings, error } = await supabase.rpc('get_shop_currency_settings', {
      p_shop_id: shop_id
    })

    if (error) {
      console.error('❌ Error calling database function:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Retrieved currency settings:', settings)

    return new Response(
      JSON.stringify(settings || { 
        success: false, 
        display_settings: { show_symbol: true, symbol_position: 'before', decimal_places: 2 },
        custom_symbols: {},
        custom_rates: {}
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})