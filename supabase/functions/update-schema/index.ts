
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Get the request ID for logging and traceability
  const requestId = crypto.randomUUID().substring(0, 8)
  console.log(`[${requestId}] Starting schema update process`)

  try {
    // Create a Supabase client with the Auth context of the logged-in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Check if the token_type column exists in shopify_stores table
    console.log(`[${requestId}] Checking token_type column in shopify_stores table`)

    // First check if function_exists function exists - this is a helper function to check if a function exists
    try {
      console.log(`[${requestId}] Checking function_exists function`)
      
      // Check if the function_exists function exists
      const { data: functionExistsExists, error: functionExistsCheckError } = await supabaseClient.rpc('function_exists', {
        function_name: 'function_exists',
        function_schema: 'public'
      }).maybeSingle()
      
      if (functionExistsCheckError) {
        // Function doesn't exist, create it
        console.log(`[${requestId}] Creating function_exists function...`)
        await supabaseClient.from('_temp').select().limit(1).single().then(async () => {
          await supabaseClient.rpc('exec_sql', {
            sql: `
              CREATE OR REPLACE FUNCTION public.function_exists(function_name text, function_schema text DEFAULT 'public')
              RETURNS boolean
              LANGUAGE plpgsql
              AS $$
              BEGIN
                RETURN EXISTS (
                  SELECT 1
                  FROM pg_catalog.pg_proc p
                  JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
                  WHERE n.nspname = function_schema
                  AND p.proname = function_name
                );
              END;
              $$;
            `
          })
        })
      } else {
        console.log(`[${requestId}] function_exists function already exists`)
      }
    } catch (error) {
      console.error(`[${requestId}] Error checking/creating function_exists:`, error)
      // Continue anyway, we'll try other methods
    }

    // Create exec_sql function if it doesn't exist
    try {
      console.log(`[${requestId}] Checking exec_sql function`)
      
      // Check if the exec_sql function exists
      const { data: execSqlExists, error: execSqlCheckError } = await supabaseClient.rpc('function_exists', {
        function_name: 'exec_sql',
        function_schema: 'public'
      }).maybeSingle()
      
      if (execSqlCheckError || !execSqlExists) {
        console.log(`[${requestId}] Creating exec_sql function...`)
        await supabaseClient.from('_temp').select().limit(1).single().then(async () => {
          await supabaseClient.rpc('exec_sql', {
            sql: `
              CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
              RETURNS void
              LANGUAGE plpgsql
              SECURITY DEFINER
              AS $$
              BEGIN
                EXECUTE sql;
              END;
              $$;
            `
          })
        })
      } else {
        console.log(`[${requestId}] exec_sql function already exists`)
      }
    } catch (error) {
      console.error(`[${requestId}] Error creating exec_sql:`, error)
      // Continue anyway, we'll try a direct query next
    }

    // Create check_column_exists function - drop first to avoid parameter name error
    try {
      console.log(`[${requestId}] Checking check_column_exists function`)
      
      // Drop existing function first to avoid parameter name conflicts
      await supabaseClient.rpc('exec_sql', {
        sql: `
          DROP FUNCTION IF EXISTS public.check_column_exists(text, text);
          
          CREATE OR REPLACE FUNCTION public.check_column_exists(p_table text, p_column text)
          RETURNS boolean
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            RETURN EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = p_table
              AND column_name = p_column
            );
          END;
          $$;
        `
      })
      console.log(`[${requestId}] Successfully created check_column_exists function`)
    } catch (error) {
      console.error(`[${requestId}] Error creating check_column_exists function:`, error)
    }
    
    // Create add_column_if_not_exists function
    try {
      console.log(`[${requestId}] Checking add_column_if_not_exists function`)
      
      // Drop existing function first to avoid parameter conflicts
      await supabaseClient.rpc('exec_sql', {
        sql: `
          DROP FUNCTION IF EXISTS public.add_column_if_not_exists(text, text, text, text);
          
          CREATE OR REPLACE FUNCTION public.add_column_if_not_exists(p_table text, p_column text, p_type text, p_default text DEFAULT NULL::text)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            v_exists BOOLEAN;
            v_sql TEXT;
          BEGIN
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = p_table
              AND column_name = p_column
            ) INTO v_exists;
            
            IF NOT v_exists THEN
              v_sql := format('ALTER TABLE public.%I ADD COLUMN %I %s', p_table, p_column, p_type);
              
              IF p_default IS NOT NULL THEN
                v_sql := v_sql || ' DEFAULT ' || p_default;
              END IF;
              
              EXECUTE v_sql;
            END IF;
          END;
          $$;
        `
      })
      console.log(`[${requestId}] Successfully created add_column_if_not_exists function`)
    } catch (error) {
      console.error(`[${requestId}] Error checking column existence or function doesn't exist, attempting direct migration`)
    }

    // Ensure create_form_with_shop function exists
    try {
      console.log(`[${requestId}] Ensuring create_form_with_shop function exists`)
      await supabaseClient.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION public.create_form_with_shop(p_title text, p_description text, p_data jsonb, p_shop_id text, p_user_id uuid)
          RETURNS uuid
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            v_form_id UUID;
          BEGIN
            INSERT INTO public.forms (title, description, data, shop_id, user_id, is_published)
            VALUES (p_title, p_description, p_data, p_shop_id, p_user_id, false)
            RETURNING id INTO v_form_id;
            
            RETURN v_form_id;
          END;
          $$;
        `
      })
      console.log(`[${requestId}] Successfully created/updated create_form_with_shop function`)
    } catch (error) {
      console.error(`[${requestId}] Error creating create_form_with_shop function:`, error)
    }

    // Ensure shopify_form_insertion table exists
    try {
      console.log(`[${requestId}] Ensuring shopify_form_insertion table exists`)
      
      await supabaseClient.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.shopify_form_insertion (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
            shop_id TEXT NOT NULL,
            position TEXT DEFAULT 'product-page',
            block_id TEXT,
            theme_type TEXT DEFAULT 'auto-detect',
            insertion_method TEXT DEFAULT 'auto',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(form_id, shop_id)
          );
        `
      })
      console.log(`[${requestId}] Successfully created/checked shopify_form_insertion table`)
    } catch (error) {
      console.error(`[${requestId}] Error checking/creating shopify_form_insertion table:`, error)
    }

    // Ensure single active store
    try {
      console.log(`[${requestId}] Ensuring single active store record`)
      
      // Add token_type column if it doesn't exist 
      await supabaseClient.rpc('exec_sql', {
        sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shopify_stores' AND column_name = 'token_type') THEN
              ALTER TABLE public.shopify_stores ADD COLUMN token_type text DEFAULT 'offline';
            END IF;
            
            -- Ensure at least one store is active
            WITH store_count AS (
              SELECT COUNT(*) as total_active FROM public.shopify_stores WHERE is_active = true
            )
            UPDATE public.shopify_stores 
            SET is_active = true 
            WHERE id IN (
              SELECT id FROM public.shopify_stores ORDER BY updated_at DESC LIMIT 1
            )
            AND (SELECT total_active FROM store_count) = 0;
            
            -- If multiple active stores, keep only one
            WITH ranked_stores AS (
              SELECT id, ROW_NUMBER() OVER (ORDER BY updated_at DESC) as rn
              FROM public.shopify_stores
              WHERE is_active = true
            )
            UPDATE public.shopify_stores
            SET is_active = false
            WHERE id IN (
              SELECT id FROM ranked_stores WHERE rn > 1
            );
          END $$;
        `
      })
      
      // Check state of stores
      const { data: activeStores, error: countError } = await supabaseClient
        .from('shopify_stores')
        .select('id')
        .eq('is_active', true)
      
      if (activeStores && activeStores.length === 1) {
        console.log(`[${requestId}] Store records are in correct state: ${activeStores.length} active stores`)
      } else {
        console.log(`[${requestId}] Warning: Store records are in incorrect state: ${activeStores?.length || 0} active stores`)
      }
    } catch (error) {
      console.error(`[${requestId}] Error ensuring single active store:`, error)
    }

    // Return success response with CORS headers
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Schema updated successfully',
      timestamp: new Date().toISOString()
    }), { 
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      } 
    })

  } catch (error) {
    console.error(`[${requestId}] Error in update-schema:`, error)
    
    // Return error response with CORS headers
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      } 
    })
  }
})
