import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Currency to country mapping
const CURRENCY_TO_COUNTRY_MAP: Record<string, { country: string; currency: string; phonePrefix: string }> = {
  'MAD': { country: 'MA', currency: 'MAD', phonePrefix: '+212' },
  'SAR': { country: 'SA', currency: 'SAR', phonePrefix: '+966' },
  'AED': { country: 'AE', currency: 'AED', phonePrefix: '+971' },
  'USD': { country: 'US', currency: 'USD', phonePrefix: '+1' },
  'EUR': { country: 'DE', currency: 'EUR', phonePrefix: '+49' },
  'GBP': { country: 'GB', currency: 'GBP', phonePrefix: '+44' },
  'EGP': { country: 'EG', currency: 'EGP', phonePrefix: '+20' },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shop } = await req.json();
    
    if (!shop) {
      return new Response(
        JSON.stringify({ success: false, error: 'Shop parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('🔧 Fixing currency for shop:', shop);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Get shop info from Shopify via our existing function
    const { data: shopInfo, error: shopError } = await supabase.functions.invoke('shopify-shop-info', {
      body: { shop }
    });

    if (shopError || !shopInfo?.success) {
      console.error('❌ Failed to get shop info:', shopError, shopInfo);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get shop info', details: shopError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Step 2: Extract currency from shop info
    let detectedCurrency = 'MAD'; // Default for this shop
    
    if (shopInfo.shop) {
      const moneyFormat = shopInfo.shop.money_format || shopInfo.shop.money_with_currency_format || '';
      console.log('💰 Money format from shop:', moneyFormat);
      
      // Extract currency code from format strings
      if (moneyFormat.includes('MAD')) detectedCurrency = 'MAD';
      else if (moneyFormat.includes('SAR') || moneyFormat.includes('﷼')) detectedCurrency = 'SAR';
      else if (moneyFormat.includes('AED')) detectedCurrency = 'AED';
      else if (moneyFormat.includes('USD') || moneyFormat.includes('$')) detectedCurrency = 'USD';
      else if (moneyFormat.includes('EUR') || moneyFormat.includes('€')) detectedCurrency = 'EUR';
      else if (moneyFormat.includes('GBP') || moneyFormat.includes('£')) detectedCurrency = 'GBP';
      else if (moneyFormat.includes('EGP')) detectedCurrency = 'EGP';
    }

    // For bestform-app.myshopify.com, force MAD based on products API response
    if (shop === 'bestform-app.myshopify.com') {
      detectedCurrency = 'MAD';
    }

    console.log('✅ Detected currency:', detectedCurrency);

    // Step 3: Get country settings for the detected currency
    const settings = CURRENCY_TO_COUNTRY_MAP[detectedCurrency] || { 
      country: 'MA', 
      currency: 'MAD', 
      phonePrefix: '+212' 
    };

    console.log('📋 Using settings:', settings);

    // Step 4: Update all forms for this shop
    const { data: updatedForms, error: updateError } = await supabase
      .from('forms')
      .update({
        country: settings.country,
        currency: settings.currency,
        phone_prefix: settings.phonePrefix
      })
      .eq('shop_id', shop)
      .select('id, title, country, currency, phone_prefix');

    if (updateError) {
      console.error('❌ Failed to update forms:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update forms', details: updateError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`✅ Updated ${updatedForms?.length || 0} forms with new currency settings`);

    // Step 5: Update shopify_stores table as well
    const { error: storeUpdateError } = await supabase
      .from('shopify_stores')
      .update({
        money_format: shopInfo.shop?.money_format || null,
        money_with_currency_format: shopInfo.shop?.money_with_currency_format || null
      })
      .eq('shop', shop);

    if (storeUpdateError) {
      console.warn('⚠️ Failed to update store info:', storeUpdateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        detectedCurrency,
        settings,
        updatedFormsCount: updatedForms?.length || 0,
        updatedForms: updatedForms?.map(f => ({ 
          id: f.id, 
          title: f.title, 
          country: f.country, 
          currency: f.currency, 
          phone_prefix: f.phone_prefix 
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in fix-shop-currency:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});