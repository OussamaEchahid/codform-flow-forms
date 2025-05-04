
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

// Helper function to ensure we always return a proper JSON response
const jsonResponse = (data: any, status: number = 200) => {
  return new Response(
    JSON.stringify(data),
    { 
      headers: corsHeaders,
      status: status
    }
  );
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("Request received to update Shopify token");
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Better validation for environment variables
    if (!supabaseUrl || supabaseUrl.length < 10) {
      console.error("Invalid or missing SUPABASE_URL:", supabaseUrl);
      return jsonResponse({ 
        success: false, 
        error: "Missing or invalid Supabase URL environment variable",
        env_status: {
          has_url: !!supabaseUrl,
          url_length: supabaseUrl?.length || 0
        }
      }, 500);
    }
    
    if (!supabaseKey || supabaseKey.length < 10) {
      console.error("Invalid or missing SUPABASE_SERVICE_ROLE_KEY");
      return jsonResponse({ 
        success: false, 
        error: "Missing or invalid Supabase service role key environment variable",
        env_status: {
          has_key: !!supabaseKey,
          key_length: supabaseKey?.length || 0
        }
      }, 500);
    }
    
    console.log("Supabase environment variables validated");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    let data;
    try {
      data = await req.json();
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return jsonResponse({ 
        success: false, 
        error: "Invalid JSON in request body",
        details: parseError instanceof Error ? parseError.message : String(parseError)
      }, 400);
    }
    
    const { shopDomain, accessToken, forceActivate = true, tokenType: requestedTokenType } = data;
    
    if (!shopDomain || !accessToken) {
      console.error("Missing required parameters:", { hasShop: !!shopDomain, hasToken: !!accessToken });
      return jsonResponse({ 
        success: false, 
        error: "Shop domain and access token are required" 
      }, 400);
    }
    
    console.log(`Updating access token for shop: ${shopDomain}, forceActivate: ${forceActivate}`);
    
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
      return jsonResponse({ 
        success: false, 
        error: "Failed to query store", 
        details: queryError.message 
      }, 500);
    }
    
    let result;
    
    // If forceActivate is true (default), first deactivate all stores
    // This should happen BEFORE updating the current store
    if (forceActivate) {
      console.log("Force activate is true, deactivating all other stores first");
      const { error: deactivateError } = await supabase
        .from('shopify_stores')
        .update({ is_active: false })
        .not('shop', 'eq', shopDomain);
      
      if (deactivateError) {
        console.error("Error deactivating other stores:", deactivateError);
        // Continue anyway, this is not a critical error
      }
    }
    
    if (existingStore) {
      // Update existing store
      const { data, error } = await supabase
        .from('shopify_stores')
        .update({ 
          access_token: accessToken,
          token_type: tokenType,  // Explicitly set the token type based on detection
          is_active: forceActivate === true ? true : false,  // Make this explicit
          updated_at: new Date().toISOString()
        })
        .eq('shop', shopDomain)
        .select();
      
      if (error) {
        console.error("Error updating store:", error);
        return jsonResponse({ 
          success: false, 
          error: "Failed to update store", 
          details: error.message 
        }, 500);
      }
      
      result = { data, updated: true };
    } else {
      // Insert new store
      const { data, error } = await supabase
        .from('shopify_stores')
        .insert([{ 
          shop: shopDomain, 
          access_token: accessToken,
          token_type: tokenType,  // Explicitly set the token type based on detection
          is_active: forceActivate === true ? true : false,  // Make this explicit
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error("Error inserting store:", error);
        return jsonResponse({ 
          success: false, 
          error: "Failed to insert store", 
          details: error.message 
        }, 500);
      }
      
      result = { data, inserted: true };
    }
    
    // Also run the ensure_single_active_store function as a fallback
    await supabase.rpc('ensure_single_active_store');
    
    // Double-check the store was set to active if forceActivate is true
    if (forceActivate) {
      const { data: verifyActive, error: verifyError } = await supabase
        .from('shopify_stores')
        .select('is_active')
        .eq('shop', shopDomain)
        .single();
        
      if (verifyError || !verifyActive || !verifyActive.is_active) {
        console.log("Store not set to active as expected, forcing update", { verifyError, verifyActive });
        
        // Force update the store to be active
        const { error: forceError } = await supabase
          .from('shopify_stores')
          .update({ is_active: true })
          .eq('shop', shopDomain);
          
        if (forceError) {
          console.error("Error forcing store active:", forceError);
        }
      } else {
        console.log("Verified store is active:", verifyActive);
      }
    }
    
    // Return success response
    return jsonResponse({ 
      success: true, 
      message: "Access token updated successfully",
      shop: shopDomain,
      tokenType: tokenType,
      result: result
    }, 200);
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return jsonResponse({ 
      success: false, 
      error: "Unexpected error occurred", 
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, 500);
  }
});
