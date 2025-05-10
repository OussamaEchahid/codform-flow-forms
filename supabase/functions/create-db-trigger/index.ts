
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.18.0";

// Configure CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Create Supabase admin client with service role credentials
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Check if triggers already exist before creating them
    const { data: triggerExists, error: checkError } = await supabaseAdmin.rpc('check_trigger_exists', {
      trigger_name: 'update_forms_updated_at'
    });

    if (checkError) {
      throw new Error(`Error checking trigger: ${checkError.message}`);
    }

    // Create helper function for product settings if it doesn't exist
    const { error: functionError } = await supabaseAdmin.rpc(
      'create_transaction_function_if_not_exists'
    );

    if (functionError) {
      throw new Error(`Error creating function: ${functionError.message}`);
    }

    // Create timestamps trigger for all relevant tables if they don't exist
    const tables = ['forms', 'shopify_stores', 'shopify_product_settings'];
    const results = [];

    for (const table of tables) {
      const { data, error } = await supabaseAdmin.rpc('create_timestamp_trigger', {
        table_name: table
      });

      results.push({
        table,
        success: !error,
        error: error?.message
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Database triggers created successfully', 
        results 
      }),
      { headers: { ...corsHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders } }
    );
  }
});
