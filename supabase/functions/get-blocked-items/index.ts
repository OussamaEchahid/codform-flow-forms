import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, shop_id } = await req.json()

    if (!type || !shop_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: type, shop_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let result;

    switch (type) {
      case 'ips':
        // جلب عناوين IP المحظورة
        result = await supabaseClient
          .from('blocked_ips')
          .select('*')
          .eq('shop_id', shop_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
        break

      case 'countries':
        // جلب الدول المحظورة
        result = await supabaseClient
          .from('blocked_countries')
          .select('*')
          .eq('shop_id', shop_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
        break

      default:
        return new Response(
          JSON.stringify({ error: `Invalid type: ${type}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    if (result.error) {
      console.error(`Database error for ${type}:`, result.error)
      return new Response(
        JSON.stringify({ error: result.error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result.data || [],
        count: result.data?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
