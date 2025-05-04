
// `update-shopify-token` Edge Function
// This function updates the Shopify access token for a specific store

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json", // Always set JSON content type
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    console.log("Request received to update Shopify token");
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing Supabase environment variables" 
        }),
        { 
          headers: corsHeaders,
          status: 500 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    let data;
    try {
      data = await req.json();
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : String(parseError)
        }),
        { 
          headers: corsHeaders,
          status: 400 
        }
      );
    }
    
    const { shopDomain, accessToken, forceActivate, tokenType: requestedTokenType } = data;
    
    if (!shopDomain || !accessToken) {
      console.error("Missing required parameters:", { hasShop: !!shopDomain, hasToken: !!accessToken });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Shop domain and access token are required" 
        }),
        { 
          headers: corsHeaders,
          status: 400 
        }
      );
    }
    
    console.log(`Updating access token for shop: ${shopDomain}`);
    
    // Determine token type - Admin API tokens start with 'shpat_'
    const detectedTokenType = accessToken.startsWith('shpat_') ? 'admin' : 'offline';
    // Use requested type or fall back to detected type
    const tokenType = requestedTokenType || detectedTokenType;
    
    console.log(`Token type: ${tokenType} (detected: ${detectedTokenType})`);
    
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
          headers: corsHeaders,
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
          token_type: tokenType,  // Explicitly set the token type based on detection
          is_active: forceActivate === true,
          updated_at: new Date().toISOString()
        })
        .eq('shop', shopDomain)
        .select();
      
      if (error) {
        console.error("Error updating store:", error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Failed to update store", 
            details: error.message 
          }),
          { 
            headers: corsHeaders,
            status: 500 
          }
        );
      }
      
      result = { data, updated: true };
      
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
          token_type: tokenType,  // Explicitly set the token type based on detection
          is_active: forceActivate === true,
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error("Error inserting store:", error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Failed to insert store", 
            details: error.message 
          }),
          { 
            headers: corsHeaders,
            status: 500 
          }
        );
      }
      
      result = { data, inserted: true };
    }
    
    // Also run the ensure_single_active_store function as a fallback
    await supabase.rpc('ensure_single_active_store');
    
    // Make sure we're always returning properly formatted JSON with correct content-type
    const responseBody = JSON.stringify({ 
      success: true, 
      message: "Access token updated successfully",
      shop: shopDomain,
      tokenType: tokenType,
      result: result
    });
    
    return new Response(
      responseBody,
      { 
        headers: corsHeaders,
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Unexpected error occurred", 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: corsHeaders,
        status: 500 
      }
    );
  }
});
