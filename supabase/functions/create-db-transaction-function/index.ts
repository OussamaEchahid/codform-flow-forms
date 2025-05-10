
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.18.0";

// Configure CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// SQL to create the transaction function
const createFunctionSQL = `
CREATE OR REPLACE FUNCTION public.handle_product_settings_transaction(
  p_shop_id TEXT,
  p_product_id TEXT,
  p_form_id TEXT,
  p_block_id TEXT,
  p_enabled BOOLEAN DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  v_result jsonb;
  v_block_id TEXT := p_block_id;
BEGIN
  -- Generate a default block ID if not provided
  IF v_block_id IS NULL OR v_block_id = '' THEN
    v_block_id := 'codform-' || substr(md5(random()::text), 1, 10);
  END IF;

  -- Use an atomic transaction for data consistency
  BEGIN
    -- Insert or update the product settings
    INSERT INTO public.shopify_product_settings 
      (shop_id, product_id, form_id, block_id, enabled, created_at, updated_at)
    VALUES 
      (p_shop_id, p_product_id, p_form_id, v_block_id, p_enabled, now(), now())
    ON CONFLICT (shop_id, product_id) 
    DO UPDATE SET 
      form_id = p_form_id,
      block_id = v_block_id,
      enabled = p_enabled,
      updated_at = now();

    -- Return success result
    v_result := json_build_object(
      'success', true,
      'shop_id', p_shop_id,
      'product_id', p_product_id,
      'form_id', p_form_id,
      'block_id', v_block_id,
      'enabled', p_enabled
    );
    
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- Return error information
      v_result := json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_detail', SQLSTATE
      );
      
      RETURN v_result;
  END;
END;
$function$;

-- Create helper function to check if the transaction function already exists
CREATE OR REPLACE FUNCTION public.create_transaction_function_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- First check if the function already exists to avoid errors
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
    WHERE pg_proc.proname = 'handle_product_settings_transaction' 
    AND pg_namespace.nspname = 'public'
  ) THEN
    -- If it doesn't exist, create it
    EXECUTE $SQL$
      ${createFunctionSQL}
    $SQL$;
  END IF;
END;
$function$;
`;

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

    // First create the create_transaction_function_if_not_exists function
    console.log("Creating transaction function helper...");
    const { error: helperFunctionError } = await supabaseAdmin.rpc(
      'exec_sql',
      { sql: `
        -- Create helper function to check if the transaction function already exists
        CREATE OR REPLACE FUNCTION public.create_transaction_function_if_not_exists()
        RETURNS void
        LANGUAGE plpgsql
        AS $function$
        BEGIN
          -- First check if the function already exists to avoid errors
          IF NOT EXISTS (
            SELECT 1 FROM pg_proc 
            JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
            WHERE pg_proc.proname = 'handle_product_settings_transaction' 
            AND pg_namespace.nspname = 'public'
          ) THEN
            -- If it doesn't exist, create it
            EXECUTE $SQL$
              ${createFunctionSQL}
            $SQL$;
          END IF;
        END;
        $function$;
      ` }
    );

    if (helperFunctionError) {
      console.error("Error creating helper function:", helperFunctionError);
      throw new Error(`Error creating helper function: ${helperFunctionError.message}`);
    }

    // Now execute the function to install the transaction function
    console.log("Executing transaction function helper...");
    const { error } = await supabaseAdmin.rpc('create_transaction_function_if_not_exists');

    if (error) {
      console.error("Error creating transaction function:", error);
      throw new Error(`Error creating function: ${error.message}`);
    }

    console.log("Transaction function created successfully");
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Product settings transaction function created successfully'
      }),
      { headers: { ...corsHeaders } }
    );
  } catch (error) {
    console.error("Creation error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        details: JSON.stringify(error)
      }),
      { status: 400, headers: { ...corsHeaders } }
    );
  }
});
