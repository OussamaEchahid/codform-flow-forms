
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.18.0";

// Configure CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req: Request) => {
  // Generate request ID for tracking
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] Starting transaction function creation`);

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

    // Define the SQL for creating the transaction function
    // IMPORTANT: This is defined before being referenced
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
    `;

    console.log(`[${requestId}] Attempting to directly create function via SQL`);

    try {
      // First check if function_exists exists
      const { data: functionExistsData, error: functionExistsError } = await supabaseAdmin
        .from('_functions')
        .select('name')
        .eq('name', 'function_exists')
        .maybeSingle();

      if (functionExistsError) {
        console.log(`[${requestId}] Error checking if function_exists function exists:`, functionExistsError);
        // Continue anyway, we'll try direct SQL execution
      }

      // First attempt: Try using direct SQL execution
      const { error: directError } = await supabaseAdmin.rpc(
        'pg_query',
        { query: createFunctionSQL }
      );

      if (directError) {
        console.log(`[${requestId}] Direct SQL execution failed:`, directError);
        
        // Second attempt: Try using alternate method
        const { error: createError } = await supabaseAdmin.rpc(
          'exec_sql',
          { sql: createFunctionSQL }
        );

        if (createError) {
          console.log(`[${requestId}] Alternate SQL execution failed:`, createError);
          
          // Third attempt: Try using raw SQL
          const { error: rawError } = await supabaseAdmin.rpc(
            'exec_custom_sql',
            { custom_sql: createFunctionSQL }
          );

          if (rawError) {
            console.log(`[${requestId}] Raw SQL execution failed:`, rawError);
            throw new Error(`Failed to create product settings transaction function: ${rawError.message}`);
          }
        }
      }
    } catch (sqlError) {
      console.error(`[${requestId}] SQL execution error:`, sqlError);
      
      // Ultimate fallback: Try using the function and see if it exists
      const { error: fallbackError } = await supabaseAdmin.rpc(
        'handle_product_settings_transaction',
        { 
          p_shop_id: 'test-shop.myshopify.com',
          p_product_id: 'test-product',
          p_form_id: 'test-form',
          p_block_id: 'test-block',
          p_enabled: true
        }
      );
      
      if (fallbackError) {
        if (fallbackError.message.includes("does not exist")) {
          // Function truly doesn't exist and we've exhausted options
          throw new Error(`Failed to create transaction function and it doesn't exist: ${fallbackError.message}`);
        } else {
          // Function exists but had other errors when executing
          console.log(`[${requestId}] Function exists but encountered execution error:`, fallbackError);
          // This is acceptable for our check
        }
      }
    }

    console.log(`[${requestId}] Transaction function created or verified successfully`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Product settings transaction function created or verified successfully',
        requestId
      }),
      { headers: { ...corsHeaders } }
    );
  } catch (error) {
    console.error(`[${requestId}] Creation error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        details: JSON.stringify(error),
        requestId
      }),
      { status: 500, headers: { ...corsHeaders } }
    );
  }
});
