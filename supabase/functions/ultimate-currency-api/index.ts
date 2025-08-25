import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// معدلات تحويل موحدة - مطابقة للنظام الموحد
const UNIFIED_DEFAULT_RATES = {
  // العملات الرئيسية
  'USD': 1.0000, 'EUR': 0.9200, 'GBP': 0.7900, 'JPY': 149.0000, 'CNY': 7.2400,
  'INR': 83.0000, 'RUB': 92.5000, 'AUD': 1.5700, 'CAD': 1.4300, 'CHF': 0.8900,
  'HKD': 7.8000, 'SGD': 1.3500, 'KRW': 1345.0000, 'NZD': 1.6900,

  // عملات الشرق الأوسط
  'SAR': 3.7500, 'AED': 3.6700, 'QAR': 3.6400, 'KWD': 0.3100, 'BHD': 0.3800,
  'OMR': 0.3800, 'EGP': 30.8500, 'JOD': 0.7100, 'ILS': 3.6700, 'IRR': 42100.0000,
  'IQD': 1310.0000, 'TRY': 34.1500, 'LBP': 89500.0000, 'SYP': 13000.0000, 'YER': 250.0000,

  // عملات أفريقيا
  'MAD': 10.0000, 'XOF': 655.9600, 'XAF': 655.9600, 'NGN': 1675.0000, 'ZAR': 18.4500,
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

const UNIFIED_DEFAULT_SYMBOLS = {
  // العملات الرئيسية
  'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥', 'INR': '₹', 'RUB': '₽',
  'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF', 'HKD': 'HK$', 'SGD': 'S$', 'KRW': '₩', 'NZD': 'NZ$',

  // عملات الشرق الأوسط
  'SAR': 'ر.س', 'AED': 'د.إ', 'QAR': 'ر.ق', 'KWD': 'د.ك', 'BHD': 'د.ب', 'OMR': 'ر.ع',
  'EGP': 'ج.م', 'JOD': 'د.أ', 'ILS': '₪', 'IRR': '﷼', 'IQD': 'د.ع', 'TRY': '₺',
  'LBP': 'ل.ل', 'SYP': 'ل.س', 'YER': '﷼',

  // عملات أفريقيا
  'MAD': 'د.م', 'XOF': 'CFA', 'XAF': 'FCFA', 'NGN': '₦', 'ZAR': 'R', 'KES': 'KSh',
  'GHS': '₵', 'ETB': 'Br', 'TZS': 'TSh', 'UGX': 'USh', 'ZMW': 'ZK', 'RWF': 'RF',

  // عملات آسيا
  'IDR': 'Rp', 'PKR': '₨', 'BDT': '৳', 'LKR': 'Rs', 'NPR': 'Rs', 'BTN': 'Nu',
  'MMK': 'K', 'KHR': '៛', 'LAK': '₭', 'VND': '₫', 'THB': '฿', 'MYR': 'RM', 'PHP': '₱',

  // عملات أمريكا اللاتينية
  'MXN': '$', 'BRL': 'R$', 'ARS': '$', 'CLP': '$', 'COP': '$', 'PEN': 'S/', 'VES': 'Bs', 'UYU': '$'
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const shopId = url.searchParams.get('shopId');

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    switch (action) {
      case 'get-settings':
        return await getSettings(supabase, shopId);
      
      case 'save-settings':
        return await saveSettings(supabase, req);
      
      case 'get-rates':
        return await getExchangeRates();
      
      case 'test-connection':
        return await testConnection(supabase, shopId);
      
      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid action',
            availableActions: ['get-settings', 'save-settings', 'get-rates', 'test-connection']
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('❌ Ultimate Currency API Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function getSettings(supabase: any, shopId: string | null) {
  if (!shopId) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Shop ID is required',
        defaultSettings: {
          showSymbol: true,
          symbolPosition: 'before',
          decimalPlaces: 2,
          customSymbols: {},
          customRates: {}
        }
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  console.log(`🔍 Getting settings for shop: ${shopId}`);

  try {
    // Get display settings
    const { data: displaySettings, error: displayError } = await supabase
      .from('currency_display_settings')
      .select('*')
      .eq('shop_id', shopId)
      .single();

    if (displayError && displayError.code !== 'PGRST116') {
      console.error('❌ Error fetching display settings:', displayError);
    }

    // Get custom symbols
    const { data: customSymbols, error: symbolsError } = await supabase
      .from('custom_currency_symbols')
      .select('currency_code, custom_symbol')
      .eq('shop_id', shopId);

    if (symbolsError) {
      console.error('❌ Error fetching custom symbols:', symbolsError);
    }

    // Get custom rates
    const { data: customRates, error: ratesError } = await supabase
      .from('custom_currency_rates')
      .select('currency_code, exchange_rate')
      .eq('shop_id', shopId);

    if (ratesError) {
      console.error('❌ Error fetching custom rates:', ratesError);
    }

    // Format the response
    const symbols = {};
    if (customSymbols) {
      customSymbols.forEach((item: any) => {
        symbols[item.currency_code] = item.custom_symbol;
      });
    }

    const rates = {};
    if (customRates) {
      customRates.forEach((item: any) => {
        rates[item.currency_code] = item.exchange_rate;
      });
    }

    const result = {
      success: true,
      shopId,
      display_settings: displaySettings || {
        show_symbol: true,
        symbol_position: 'before',
        decimal_places: 2
      },
      custom_symbols: symbols,
      custom_rates: rates,
      all_rates: { ...UNIFIED_DEFAULT_RATES, ...rates },
      all_symbols: { ...UNIFIED_DEFAULT_SYMBOLS, ...symbols },
      timestamp: new Date().toISOString()
    };

    console.log('✅ Settings retrieved successfully:', result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error in getSettings:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        shopId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function saveSettings(supabase: any, req: Request) {
  const body = await req.json();
  const { shop_id, display_settings, custom_symbols, custom_rates } = body;

  if (!shop_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'Shop ID is required' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  console.log(`🔄 Saving settings for shop: ${shop_id}`);
  console.log('📤 Settings data:', { display_settings, custom_symbols, custom_rates });

  try {
    // Determine user_id (try to get from auth or use default)
    let user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'; // Default user
    
    // Save display settings
    if (display_settings) {
      const { error: displayError } = await supabase
        .from('currency_display_settings')
        .upsert({
          shop_id,
          user_id,
          show_symbol: display_settings.show_symbol,
          symbol_position: display_settings.symbol_position,
          decimal_places: display_settings.decimal_places,
          updated_at: new Date().toISOString()
        });

      if (displayError) {
        console.error('❌ Error saving display settings:', displayError);
        throw displayError;
      }
      console.log('✅ Display settings saved');
    }

    // Save custom symbols
    if (custom_symbols) {
      // Delete existing symbols
      await supabase
        .from('custom_currency_symbols')
        .delete()
        .eq('shop_id', shop_id);

      // Insert new symbols
      if (Object.keys(custom_symbols).length > 0) {
        const symbolsToInsert = Object.entries(custom_symbols).map(([currency_code, custom_symbol]) => ({
          shop_id,
          currency_code,
          custom_symbol
        }));

        const { error: symbolsError } = await supabase
          .from('custom_currency_symbols')
          .insert(symbolsToInsert);

        if (symbolsError) {
          console.error('❌ Error saving custom symbols:', symbolsError);
          throw symbolsError;
        }
      }
      console.log('✅ Custom symbols saved');
    }

    // Save custom rates
    if (custom_rates) {
      // Delete existing rates
      await supabase
        .from('custom_currency_rates')
        .delete()
        .eq('shop_id', shop_id);

      // Insert new rates
      if (Object.keys(custom_rates).length > 0) {
        const ratesToInsert = Object.entries(custom_rates).map(([currency_code, exchange_rate]) => ({
          shop_id,
          currency_code,
          exchange_rate,
          user_id
        }));

        const { error: ratesError } = await supabase
          .from('custom_currency_rates')
          .insert(ratesToInsert);

        if (ratesError) {
          console.error('❌ Error saving custom rates:', ratesError);
          throw ratesError;
        }
      }
      console.log('✅ Custom rates saved');
    }

    console.log('✅ All settings saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Settings saved successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error saving settings:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        shop_id
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function getExchangeRates() {
  console.log('💱 Getting exchange rates');
  
  // For now, return default rates
  // In the future, this could fetch from external API
  return new Response(
    JSON.stringify({ 
      success: true, 
      rates: UNIFIED_DEFAULT_RATES,
      symbols: UNIFIED_DEFAULT_SYMBOLS,
      lastUpdated: new Date().toISOString(),
      source: 'default'
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function testConnection(supabase: any, shopId: string | null) {
  console.log('🔍 Testing connection for shop:', shopId);
  
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('currency_display_settings')
      .select('count', { count: 'exact' })
      .limit(1);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Connection successful',
        shopId,
        dbConnected: true,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        shopId,
        dbConnected: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}