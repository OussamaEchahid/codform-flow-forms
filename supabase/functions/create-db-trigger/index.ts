
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

  // Generate request ID for tracking
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] Starting database trigger setup`);

  try {
    // Create Supabase admin client with service role credentials
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    console.log(`[${requestId}] First ensure transaction function exists`);
    
    // Create transaction function if it doesn't exist by calling the edge function directly
    try {
      const transactionFunctionResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/create-db-transaction-function`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!transactionFunctionResponse.ok) {
        const errorText = await transactionFunctionResponse.text();
        console.warn(`[${requestId}] Warning: Transaction function setup returned ${transactionFunctionResponse.status}: ${errorText}`);
        // Continue anyway - we'll check for the function directly
      } else {
        const result = await transactionFunctionResponse.json();
        console.log(`[${requestId}] Transaction function setup result: ${JSON.stringify(result)}`);
      }
    } catch (functionError) {
      console.warn(`[${requestId}] Warning: Error calling transaction function edge function: ${functionError.message}`);
      // Continue anyway - we'll check for the function directly
    }

    // First check if the transaction function helper exists and create it if needed
    console.log(`[${requestId}] Checking if transaction function helper exists`);
    const { data: functionExists, error: checkError } = await supabaseAdmin.rpc('function_exists', {
      function_name: 'create_transaction_function_if_not_exists',
      function_schema: 'public'
    });

    if (checkError || !functionExists) {
      console.log(`[${requestId}] Transaction function helper doesn't exist, creating...`);
      // Creating the helper function directly
      const { error: createHelperError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
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
            -- If it doesn't exist, create it with basic functionality
            EXECUTE $SQL$
              CREATE OR REPLACE FUNCTION public.handle_product_settings_transaction(
                p_shop_id TEXT,
                p_product_id TEXT,
                p_form_id TEXT,
                p_block_id TEXT,
                p_enabled BOOLEAN DEFAULT true
              )
              RETURNS jsonb
              LANGUAGE plpgsql
              AS $fn$
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
              $fn$;
            $SQL$;
          END IF;
        END;
        $function$;
        `
      });

      if (createHelperError) {
        throw new Error(`Error creating transaction function helper: ${createHelperError.message}`);
      }
    }

    // Now execute the function to ensure the transaction function exists
    console.log(`[${requestId}] Ensuring transaction function exists`);
    const { error: functionError } = await supabaseAdmin.rpc('create_transaction_function_if_not_exists');

    if (functionError) {
      throw new Error(`Error ensuring transaction function exists: ${functionError.message}`);
    }

    // Check if triggers already exist before creating them
    console.log(`[${requestId}] Checking if triggers already exist`);
    const { data: triggerExists, error: checkTriggerError } = await supabaseAdmin.rpc('check_trigger_exists', {
      trigger_name: 'update_forms_updated_at'
    });

    if (checkTriggerError) {
      console.warn(`[${requestId}] Warning checking trigger: ${checkTriggerError.message}`);
      // Continue anyway
    }

    // Create timestamps trigger for all relevant tables if they don't exist
    const tables = ['forms', 'shopify_stores', 'shopify_product_settings'];
    const results = [];

    for (const table of tables) {
      console.log(`[${requestId}] Creating timestamp trigger for table: ${table}`);
      const { data, error } = await supabaseAdmin.rpc('create_timestamp_trigger', {
        table_name: table
      });

      if (error) {
        console.warn(`[${requestId}] Warning creating trigger for ${table}: ${error.message}`);
      }

      results.push({
        table,
        success: !error,
        error: error?.message
      });
    }

    console.log(`[${requestId}] Database triggers created successfully: ${JSON.stringify(results)}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Database triggers created successfully', 
        results,
        requestId
      }),
      { headers: { ...corsHeaders } }
    );
  } catch (error) {
    console.error(`[${requestId}] Error creating triggers:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error",
        requestId,
        details: JSON.stringify(error)
      }),
      { status: 400, headers: { ...corsHeaders } }
    );
  }
});
