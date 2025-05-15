
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get query parameters
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    const productId = url.searchParams.get('productId');

    if (!shop || !productId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: shop or productId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Fetching form for shop ${shop}, product ${productId}`);

    // First, check if there's a specific form for this product
    const { data: productSettings, error: settingsError } = await supabase
      .from('shopify_product_settings')
      .select('form_id, block_id, enabled')
      .eq('shop_id', shop)
      .eq('product_id', productId)
      .eq('enabled', true)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      // Real error, not just "no rows returned"
      console.error('Error fetching product settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve product settings', details: settingsError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // If we have product-specific settings, get that form
    let form = null;
    
    if (productSettings && productSettings.form_id) {
      console.log(`Found product-specific form ID: ${productSettings.form_id}`);
      
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', productSettings.form_id)
        .eq('is_published', true)
        .single();
        
      if (!formError && formData) {
        form = formData;
      } else if (formError) {
        console.log(`Error fetching form: ${formError.message}. Will try default form.`);
      }
    } 

    // Return form data
    if (form) {
      return new Response(
        JSON.stringify({ form }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      // No product-specific form found
      console.log('No product-specific form found, frontend will try the default form');
      return new Response(
        JSON.stringify({ message: 'No product-specific form found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
