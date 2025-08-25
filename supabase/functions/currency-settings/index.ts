import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma, expires, accept, accept-encoding, accept-language, connection, host, referer, user-agent',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
}

// معدلات تحويل موحدة - مطابقة للنظام الموحد
const UNIFIED_EXCHANGE_RATES = {
  // العملات الرئيسية
  'USD': 1.0000, 'EUR': 0.9200, 'GBP': 0.7900, 'JPY': 149.0000, 'CNY': 7.2400,
  'INR': 83.0000, 'RUB': 92.5000, 'AUD': 1.5700, 'CAD': 1.4300, 'CHF': 0.8900,
  'HKD': 7.8000, 'SGD': 1.3500, 'KRW': 1345.0000, 'NZD': 1.6900,

  // عملات الشرق الأوسط
  'SAR': 3.7500, 'AED': 3.6700, 'QAR': 3.6400, 'KWD': 0.3100, 'BHD': 0.3800,
  'OMR': 0.3800, 'EGP': 30.8500, 'JOD': 0.7100, 'ILS': 3.6700, 'IRR': 42100.0000,
  'IQD': 1310.0000, 'TRY': 34.1500, 'LBP': 89500.0000, 'SYP': 13000.0000, 'YER': 250.0000,

  // عملات أفريقيا
  'MAD': 10.5000, 'XOF': 655.9600, 'XAF': 655.9600, 'NGN': 1675.0000, 'ZAR': 18.4500,
  'KES': 130.5000, 'GHS': 15.8500, 'ETB': 125.5000, 'TZS': 2515.0000, 'UGX': 3785.0000,
  'ZMW': 27.8500, 'RWF': 1385.0000,

  // عملات آسيا
  'IDR': 15850.0000, 'PKR': 280.0000, 'BDT': 110.0000, 'LKR': 300.0000, 'NPR': 133.0000,
  'BTN': 83.0000, 'MMK': 2100.0000, 'KHR': 4100.0000, 'LAK': 20000.0000, 'VND': 24000.0000,
  'THB': 36.0000, 'MYR': 4.7000, 'PHP': 56.0000,

  // عملات أمريكا اللاتينية
  'MXN': 20.1500, 'BRL': 6.0500, 'ARS': 1005.5000, 'CLP': 975.2000, 'COP': 4285.5000,
  'PEN': 3.7500, 'VES': 36500000.0000, 'UYU': 40.2500
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

    // استخدام دالة قاعدة البيانات المحدثة للحصول على المعدلات الموحدة
    const { data: dbResult, error: dbError } = await supabase.rpc('get_currency_settings', {
      p_shop_id: shopId
    });

    if (dbError) {
      console.error('❌ Error calling get_currency_settings:', dbError);

      // Fallback: استخدام المعدلات الموحدة مباشرة
      const result = {
        shop_id: shopId,
        success: true,
        custom_rates: {},
        custom_symbols: {},
        display_settings: {
          show_symbol: true,
          decimal_places: 2,
          symbol_position: 'before'
        },
        default_rates: UNIFIED_EXCHANGE_RATES,
        all_rates: UNIFIED_EXCHANGE_RATES
      };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Database result with unified rates:', JSON.stringify(dbResult));

    return new Response(
      JSON.stringify(dbResult),
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