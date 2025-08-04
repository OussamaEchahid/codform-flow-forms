import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma, expires, accept, accept-encoding, accept-language, connection, host, referer, user-agent',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
}

interface SaveCurrencySettingsRequest {
  shop_id: string;
  display_settings: {
    show_symbol: boolean;
    symbol_position: 'before' | 'after';
    decimal_places: number;
  };
  custom_symbols?: Record<string, string>;
  custom_rates?: Record<string, number>;
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

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body: SaveCurrencySettingsRequest = await req.json();
    const { shop_id, display_settings, custom_symbols, custom_rates } = body;

    if (!shop_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing shop_id parameter' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🔄 Saving currency settings for shop: ${shop_id}`);
    console.log('📤 Settings:', { display_settings, custom_symbols, custom_rates });

    // 1. حفظ إعدادات العرض
    if (display_settings) {
      const { error: displayError } = await supabase
        .from('currency_display_settings')
        .upsert({
          shop_id,
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

    // 2. حفظ الرموز المخصصة
    if (custom_symbols && Object.keys(custom_symbols).length > 0) {
      // حذف الرموز الموجودة للمتجر
      await supabase
        .from('custom_currency_symbols')
        .delete()
        .eq('shop_id', shop_id);

      // إدراج الرموز الجديدة
      const symbolsData = Object.entries(custom_symbols).map(([currency_code, custom_symbol]) => ({
        shop_id,
        currency_code,
        custom_symbol,
        updated_at: new Date().toISOString()
      }));

      const { error: symbolsError } = await supabase
        .from('custom_currency_symbols')
        .insert(symbolsData);

      if (symbolsError) {
        console.error('❌ Error saving custom symbols:', symbolsError);
        throw symbolsError;
      }
      console.log('✅ Custom symbols saved');
    } else {
      // إذا كانت custom_symbols فارغة، احذف جميع الرموز للمتجر
      await supabase
        .from('custom_currency_symbols')
        .delete()
        .eq('shop_id', shop_id);
      
      console.log('✅ Custom symbols cleared');
    }

    // 3. حفظ معدلات التحويل المخصصة
    if (custom_rates && Object.keys(custom_rates).length > 0) {
      // الحصول على user_id من إعدادات العرض
      const { data: displayData } = await supabase
        .from('currency_display_settings')
        .select('user_id')
        .eq('shop_id', shop_id)
        .single();
      
      const user_id = displayData?.user_id || '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';
      
      // حذف المعدلات الموجودة للمستخدم وللمتجر
      await supabase
        .from('custom_currency_rates')
        .delete()
        .eq('user_id', user_id)
        .eq('shop_id', shop_id);
      
      // إدراج المعدلات الجديدة مع shop_id
      const ratesData = Object.entries(custom_rates).map(([currency_code, exchange_rate]) => ({
        currency_code,
        exchange_rate,
        user_id,
        shop_id,
        updated_at: new Date().toISOString()
      }));

      const { error: ratesError } = await supabase
        .from('custom_currency_rates')
        .insert(ratesData);

      if (ratesError) {
        console.error('❌ Error saving custom rates:', ratesError);
        throw ratesError;
      }

      console.log('✅ Custom rates saved');
    } else {
      // إذا كانت custom_rates فارغة، احذف جميع المعدلات للمستخدم وللمتجر
      const { data: displayData } = await supabase
        .from('currency_display_settings')
        .select('user_id')
        .eq('shop_id', shop_id)
        .single();
      
      const user_id = displayData?.user_id || '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';
      
      await supabase
        .from('custom_currency_rates')
        .delete()
        .eq('user_id', user_id)
        .eq('shop_id', shop_id);
      
      console.log('✅ Custom rates cleared');
    }

    console.log('✅ All currency settings saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Currency settings saved successfully'
      }),
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
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});