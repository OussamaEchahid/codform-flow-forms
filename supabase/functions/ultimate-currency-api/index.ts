import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default exchange rates (can be updated from external API)
const DEFAULT_RATES = {
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
  'KRW': 1180.0
};

const DEFAULT_SYMBOLS = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'SAR': 'ر.س',
  'MAD': 'د.م',
  'AED': 'د.إ',
  'EGP': 'ج.م',
  'CAD': 'C$',
  'AUD': 'A$',
  'JPY': '¥',
  'CHF': 'CHF',
  'CNY': '¥',
  'INR': '₹',
  'BRL': 'R$',
  'RUB': '₽',
  'TRY': '₺',
  'KRW': '₩'
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
      all_rates: { ...DEFAULT_RATES, ...rates },
      all_symbols: { ...DEFAULT_SYMBOLS, ...symbols },
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
      rates: DEFAULT_RATES,
      symbols: DEFAULT_SYMBOLS,
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