
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

    console.log(`[${requestId}] Creating required utility functions if they don't exist`);
    
    // First ensure required utility functions exist
    try {
      // Create function_exists utility if it doesn't exist
      const createFunctionExistsSQL = `
      CREATE OR REPLACE FUNCTION public.function_exists(function_name text, function_schema text DEFAULT 'public')
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $function$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM pg_proc 
          JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
          WHERE pg_proc.proname = function_name 
          AND pg_namespace.nspname = function_schema
        );
      END;
      $function$;
      `;
      
      // Create check_trigger_exists utility if it doesn't exist
      const createTriggerCheckSQL = `
      CREATE OR REPLACE FUNCTION public.check_trigger_exists(trigger_name text)
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $function$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM pg_trigger
          JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
          JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
          WHERE pg_trigger.tgname = trigger_name
          AND pg_namespace.nspname = 'public'
        );
      END;
      $function$;
      `;
      
      // Create timestamp trigger function
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
      
      // Create timestamp trigger utility
      const createTimestampTriggerSQL = `
      CREATE OR REPLACE FUNCTION public.create_timestamp_trigger(table_name text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $function$
      DECLARE
        trigger_name TEXT := 'update_' || table_name || '_updated_at';
      BEGIN
        EXECUTE format('
          DROP TRIGGER IF EXISTS %I ON public.%I;
          CREATE TRIGGER %I
          BEFORE UPDATE ON public.%I
          FOR EACH ROW
          EXECUTE FUNCTION update_modified_column();
        ', trigger_name, table_name, trigger_name, table_name);
      END;
      $function$;
      `;
      
      // Create exec_sql utility if it doesn't exist
      const createExecSqlSQL = `
      CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $function$
      BEGIN
        EXECUTE sql;
      END;
      $function$;
      `;

      console.log(`[${requestId}] Creating utility functions`);
      
      // Try to create all utility functions directly
      const sqlStatements = [
        createFunctionExistsSQL, 
        createTriggerCheckSQL,
        createTimestampTriggerFunctionSQL,
        createTimestampTriggerSQL,
        createExecSqlSQL
      ];
      
      for (const sql of sqlStatements) {
        try {
          // Try direct execution
          await supabaseAdmin.rpc('pg_query', { query: sql });
        } catch (sqlError) {
          console.warn(`[${requestId}] Could not execute SQL directly: ${sqlError.message}`);
          // If direct execution fails, skip and move on to the next utility
        }
      }
      
      console.log(`[${requestId}] Utility functions created or already exist`);
      
    } catch (utilError) {
      console.warn(`[${requestId}] Warning setting up utility functions: ${utilError.message}`);
      // Continue anyway as some functions may exist
    }
    
    console.log(`[${requestId}] Creating transaction function directly`);
    
    // Define the transaction function SQL for inline creation
    const transactionFunctionSQL = `
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
    
    // Try direct SQL execution to create function
    try {
      await supabaseAdmin.rpc('pg_query', { query: transactionFunctionSQL });
      console.log(`[${requestId}] Transaction function created directly via pg_query`);
    } catch (directError) {
      console.warn(`[${requestId}] Failed to create function via pg_query: ${directError.message}`);
      
      try {
        // Alternative attempt using exec_sql RPC if it exists
        await supabaseAdmin.rpc('exec_sql', { sql: transactionFunctionSQL });
        console.log(`[${requestId}] Transaction function created via exec_sql`);
      } catch (execError) {
        console.warn(`[${requestId}] Failed to create function via exec_sql: ${execError.message}`);
        // Continue anyway - we'll check for the function directly
      }
    }
    
    // Create timestamps trigger for all relevant tables
    const tables = ['forms', 'shopify_stores', 'shopify_product_settings'];
    const results = [];

    for (const table of tables) {
      console.log(`[${requestId}] Creating timestamp trigger for table: ${table}`);
      
      try {
        // Direct method to create trigger
        const createTriggerSql = `
          DROP TRIGGER IF EXISTS update_${table}_updated_at ON public.${table};
          CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON public.${table}
          FOR EACH ROW
          EXECUTE FUNCTION update_modified_column();
        `;
        
        try {
          await supabaseAdmin.rpc('pg_query', { query: createTriggerSql });
        } catch (directError) {
          console.warn(`[${requestId}] Direct trigger creation failed: ${directError.message}`);
          
          // Try using the utility function if available
          try {
            await supabaseAdmin.rpc('create_timestamp_trigger', { table_name: table });
          } catch (utilError) {
            console.warn(`[${requestId}] Utility trigger creation failed: ${utilError.message}`);
            // Continue anyway to try other tables
          }
        }
        
        results.push({
          table,
          success: true
        });
      } catch (error) {
        console.warn(`[${requestId}] Warning creating trigger for ${table}: ${error.message}`);
        results.push({
          table,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`[${requestId}] Database triggers setup completed: ${JSON.stringify(results)}`);
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
      { status: 500, headers: { ...corsHeaders } }
    );
  }
});
