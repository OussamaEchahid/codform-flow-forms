import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shop, accessToken } = await req.json();

    if (!shop || !accessToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Shop and access token are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch shop info from Shopify
    const shopifyResponse = await fetch(`https://${shop}/admin/api/2025-04/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!shopifyResponse.ok) {
      throw new Error(`Shopify API error: ${shopifyResponse.status}`);
    }

    const shopifyData = await shopifyResponse.json();
    const shopInfo = shopifyData.shop;

    // Setup Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update store currency information
    const { error } = await supabase
      .from('shopify_stores')
      .update({
        currency: shopInfo.currency,
        money_format: shopInfo.money_format,
        money_with_currency_format: shopInfo.money_with_currency_format
      })
      .eq('shop', shop);

    if (error) {
      console.error('Database update error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update store currency information'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      currency: shopInfo.currency,
      moneyFormat: shopInfo.money_format,
      moneyWithCurrencyFormat: shopInfo.money_with_currency_format
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating shop currency:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});