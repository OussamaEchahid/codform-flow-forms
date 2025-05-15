
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log request details for debugging
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    const productId = url.searchParams.get('productId');
    const requestId = `req_${Math.random().toString(36).substring(2, 10)}`;
    
    console.log(`[${requestId}] Product form request received - shop: ${shop}, product: ${productId}`);
    console.log(`[${requestId}] Request headers:`, Object.fromEntries(req.headers.entries()));
    console.log(`[${requestId}] Request URL:`, req.url);

    if (!shop || !productId) {
      console.error(`[${requestId}] Missing required parameters: shop=${shop}, productId=${productId}`);
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: shop or productId' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error(`[${requestId}] Missing Supabase configuration`);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: corsHeaders, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[${requestId}] Fetching form for shop ${shop}, product ${productId}`);

    // First, check if there's a specific form for this product
    const { data: productSettings, error: settingsError } = await supabase
      .from('shopify_product_settings')
      .select('form_id, block_id, enabled')
      .eq('shop_id', shop)
      .eq('product_id', productId)
      .eq('enabled', true)
      .maybeSingle();

    if (settingsError && settingsError.code !== 'PGRST116') {
      // Real error, not just "no rows returned"
      console.error(`[${requestId}] Error fetching product settings:`, settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve product settings', details: settingsError }),
        { headers: corsHeaders, status: 500 }
      );
    }

    // If we have product-specific settings, get that form
    let form = null;
    
    if (productSettings && productSettings.form_id) {
      console.log(`[${requestId}] Found product-specific form ID: ${productSettings.form_id}`);
      
      // Query with explicit casting to handle UUID vs text
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .or(`id.eq.${productSettings.form_id},id::text.eq.${productSettings.form_id}`)
        .eq('is_published', true)
        .limit(1);
        
      if (!formError && formData && formData.length > 0) {
        form = formData[0];
        console.log(`[${requestId}] Successfully fetched product-specific form with ID: ${form.id}`);
      } else if (formError) {
        console.log(`[${requestId}] Error fetching product-specific form: ${formError.message}. Will try default form.`);
      } else {
        console.log(`[${requestId}] No product-specific form found with ID: ${productSettings.form_id}. Will try default form.`);
      }
    } else {
      console.log(`[${requestId}] No product-specific settings found for product ${productId}`);
    }

    // If no product-specific form was found, get the default form
    if (!form) {
      console.log(`[${requestId}] Trying default form for shop ${shop}`);
      
      // Get the default form for this shop
      const { data: defaultForms, error: defaultError } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', shop)
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (!defaultError && defaultForms && defaultForms.length > 0) {
        form = defaultForms[0];
        console.log(`[${requestId}] Using default form: ${form.id}`);
      } else if (defaultError) {
        console.error(`[${requestId}] Error fetching default form:`, defaultError);
      } else {
        console.log(`[${requestId}] No default form found for shop ${shop}`);
      }
    }

    // Return form data
    if (form) {
      return new Response(
        JSON.stringify({ form }),
        { headers: corsHeaders, status: 200 }
      );
    } else {
      // No form found at all
      console.log(`[${requestId}] No form found for shop ${shop}`);
      return new Response(
        JSON.stringify({ message: 'No form found for this shop' }),
        { headers: corsHeaders, status: 404 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
