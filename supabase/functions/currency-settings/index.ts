import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma, expires, accept, accept-encoding, accept-language, connection, host, referer, user-agent',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
}

// معدلات تحويل محدثة مع العملات الجديدة
const EXCHANGE_RATES = {
  'USD': 1.0,
  'EUR': 0.85,
  'GBP': 0.79,
  'SAR': 3.75,
  'MAD': 10.0,
  'AED': 3.67,
  'EGP': 30.85,
  'CAD': 1.35,
  'AUD': 1.52,
  'JPY': 110.0,
  'CHF': 0.92,
  'CNY': 6.45,
  'INR': 74.5,
  'BRL': 5.2,
  'RUB': 75.0,
  'TRY': 8.5,
  'KRW': 1180.0,
  'SGD': 1.35,
  'HKD': 7.8,
  'NOK': 8.6,
  'SEK': 8.9,
  'DKK': 6.3,
  'PLN': 3.9,
  'CZK': 21.5,
  'HUF': 295.0,
  'ILS': 3.2,
  'ZAR': 14.8,
  'MXN': 20.1,
  'THB': 33.2,
  'MYR': 4.15,
  'IDR': 14250.0,
  'PHP': 50.5,
  'VND': 22800.0
};

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

    // إضافة معدلات التحويل الافتراضية إلى النتيجة
    const result = {
      ...data,
      default_rates: EXCHANGE_RATES,
      // دمج المعدلات المخصصة مع الافتراضية
      all_rates: { ...EXCHANGE_RATES, ...data.custom_rates }
    };

    console.log('✅ Currency settings fetched:', JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
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