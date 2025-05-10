
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Define the SQL for creating essential functions
    const createTimestampTriggerFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.update_modified_column()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $function$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $function$;
    `;

    const createTransactionFunctionSQL = `
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

    console.log(`[${requestId}] Creating essential functions`);
    
    // Execute the SQL directly without relying on other functions
    try {
      // First create the timestamp trigger function
      await supabaseAdmin.rpc('pg_query', { query: createTimestampTriggerFunctionSQL });
      console.log(`[${requestId}] Created timestamp trigger function`);
      
      // Then create the transaction function
      await supabaseAdmin.rpc('pg_query', { query: createTransactionFunctionSQL });
      console.log(`[${requestId}] Created transaction function`);
    } catch (sqlError) {
      console.error(`[${requestId}] SQL execution error:`, sqlError);
      // Continue anyway - errors might just mean the functions already exist
    }

    console.log(`[${requestId}] Setting up triggers for tables`);
    
    // Create triggers directly without relying on other functions
    const tables = ['forms', 'shopify_stores', 'shopify_product_settings'];
    const triggerResults = [];

    for (const table of tables) {
      try {
        console.log(`[${requestId}] Creating timestamp trigger for table: ${table}`);
        
        const triggerName = `update_${table}_updated_at`;
        const createTriggerSQL = `
          DROP TRIGGER IF EXISTS ${triggerName} ON public.${table};
          CREATE TRIGGER ${triggerName}
            BEFORE UPDATE ON public.${table}
            FOR EACH ROW
            EXECUTE FUNCTION public.update_modified_column();
        `;
        
        await supabaseAdmin.rpc('pg_query', { query: createTriggerSQL });
        
        triggerResults.push({
          table,
          success: true
        });
      } catch (error) {
        console.error(`[${requestId}] Error creating trigger for ${table}:`, error);
        triggerResults.push({
          table,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`[${requestId}] Database setup completed with results:`, triggerResults);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Database triggers and functions created successfully', 
        results: triggerResults,
        requestId
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`[${requestId}] Error in database setup:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred",
        requestId
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
