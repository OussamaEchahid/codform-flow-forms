
// `update-shopify-token` Edge Function
// This function updates the Shopify access token for a specific store

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { shopDomain, accessToken, forceActivate } = await req.json();
    
    if (!shopDomain || !accessToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Shop domain and access token are required" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    console.log(`Updating access token for shop: ${shopDomain}`);
    
    // First check if the store exists
    const { data: existingStore, error: queryError } = await supabase
      .from('shopify_stores')
      .select('id')
      .eq('shop', shopDomain)
      .maybeSingle();
    
    if (queryError) {
      console.error("Error querying store:", queryError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to query store", 
          details: queryError.message 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    let result;
    
    if (existingStore) {
      // Update existing store
      const { data, error } = await supabase
        .from('shopify_stores')
        .update({ 
          access_token: accessToken,
          is_active: forceActivate === true,
          updated_at: new Date().toISOString()
        })
        .eq('shop', shopDomain);
      
      result = { data, error };
      
      // If forcing active, deactivate all other stores
      if (forceActivate) {
        await supabase
          .from('shopify_stores')
          .update({ is_active: false })
          .neq('shop', shopDomain);
      }
    } else {
      // Insert new store
      const { data, error } = await supabase
        .from('shopify_stores')
        .insert([{ 
          shop: shopDomain, 
          access_token: accessToken,
          is_active: forceActivate === true,
          token_type: 'admin',
          updated_at: new Date().toISOString()
        }]);
      
      result = { data, error };
    }
    
    if (result.error) {
      console.error("Database operation failed:", result.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Database operation failed", 
          details: result.error.message 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    // Also run the ensure_single_active_store function as a fallback
    await supabase.rpc('ensure_single_active_store');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Access token updated successfully",
        shop: shopDomain
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Unexpected error occurred", 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
