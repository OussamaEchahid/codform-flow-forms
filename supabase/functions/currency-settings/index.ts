import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with',
}

interface CurrencySettings {
  display_settings: {
    show_symbol: boolean;
    symbol_position: 'before' | 'after';
    decimal_places: number;
  };
  custom_symbols: Record<string, string>;
  custom_rates: Record<string, number>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url);
    const shopId = url.searchParams.get('shop');

    if (!shopId) {
      console.error('❌ Missing shop parameter');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing shop parameter' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🔍 Getting currency settings for shop: ${shopId}`);

    // استدعاء الدالة لجلب إعدادات العملة
    const { data, error } = await supabase.rpc('get_shop_currency_settings', {
      p_shop_id: shopId
    });

    if (error) {
      console.error('❌ Error fetching currency settings:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Currency settings fetched:', data);

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});