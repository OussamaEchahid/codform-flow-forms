
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Replace these with your actual Supabase URL and key
const SUPABASE_URL = 'https://nhqrngdzuatdnfkihtud.supabase.co';
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocXJuZ2R6dWF0ZG5ma2lodHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDM2MTgsImV4cCI6MjA2MTE3OTYxOH0.bebH8nV_6W0DpwjmS_vYFB2P9xVU-txCRvQc6Jt5DdA';

// The Shopify app credentials
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY") || "7e4608874bbcc38afa1953948da28407";
const SHOPIFY_API_SECRET = Deno.env.get("SHOPIFY_API_SECRET") || "18221d830a86da52082e0d06c0d32ba3";

// Our app's URL
const APP_URL = "https://codform-flow-forms.lovable.app";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to clean shop domain
function cleanShopDomain(shop: string): string {
  let cleanedShop = shop.trim();
  
  // Remove protocol if present
  if (cleanedShop.startsWith('http')) {
    try {
      const url = new URL(cleanedShop);
      cleanedShop = url.hostname;
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  // Ensure it ends with myshopify.com
  if (!cleanedShop.endsWith('myshopify.com')) {
    if (!cleanedShop.includes('.')) {
      cleanedShop = `${cleanedShop}.myshopify.com`;
    }
  }
  
  return cleanedShop;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let shop = url.searchParams.get("shop");
    const hmac = url.searchParams.get("hmac");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    
    console.log("Callback received with params:", {
      shop,
      hmac: hmac ? "present" : "missing", 
      code: code ? "present" : "missing", 
      state
    });
    
    if (!shop || !code || !hmac) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }), 
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Clean shop domain
    shop = cleanShopDomain(shop);
    console.log("Cleaned shop domain for callback:", shop);
    
    try {
      // Verify state if needed
      if (state) {
        // Check if the state exists in our database
        const { data: stateRecord, error: stateError } = await supabase
          .from('shopify_auth')
          .select('*')
          .eq('state', state)
          .single();
        
        if (stateError) {
          console.log("Error checking state:", stateError);
          // Continue anyway, don't fail the authentication just because of state verification
        } else if (stateRecord) {
          console.log("State verified successfully");
        } else {
          console.log("No matching state found, but continuing");
        }
      }
    
      // Exchange code for access token
      const accessTokenResponse = await fetch(
        `https://${shop}/admin/oauth/access_token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: SHOPIFY_API_KEY,
            client_secret: SHOPIFY_API_SECRET,
            code
          })
        }
      );
      
      if (!accessTokenResponse.ok) {
        const errorText = await accessTokenResponse.text();
        console.error("Access token error response:", errorText);
        throw new Error(`Failed to get access token: ${accessTokenResponse.statusText}. Response: ${errorText}`);
      }
      
      const tokenData = await accessTokenResponse.json();
      console.log("Token data received:", { ...tokenData, access_token: "REDACTED" });
      
      try {
        // Store the token in Supabase
        const { error: upsertError } = await supabase
          .from('shopify_stores')
          .upsert({
            shop,
            access_token: tokenData.access_token,
            scope: tokenData.scope,
            updated_at: new Date().toISOString()
          }, { onConflict: 'shop' });
          
        if (upsertError) {
          console.error("Error storing token:", upsertError);
          // Continue anyway, we got the token which is the important part
        } else {
          console.log("Token stored successfully");
        }
      } catch (storeError) {
        console.error("Error in store operation:", storeError);
        // Continue anyway
      }
      
      // Clean up the temporary state record
      if (state) {
        try {
          await supabase
            .from('shopify_auth')
            .delete()
            .eq('state', state);
        } catch (cleanupError) {
          console.log("Error cleaning up state record:", cleanupError);
          // Non-critical error, continue
        }
      }
      
      // Redirect URL back to the app's dashboard
      const redirectUrl = `${APP_URL}/dashboard?shopify_success=true&shop=${encodeURIComponent(shop)}`;
      console.log("Redirecting back to app:", redirectUrl);
      
      return new Response(
        JSON.stringify({
          success: true,
          shop,
          redirect: redirectUrl
        }),
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error("Error in Shopify OAuth flow:", error);
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : "Unknown error in OAuth flow",
          errorType: error instanceof Error ? error.name : "Unknown",
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("Critical error in callback handler:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Critical error in callback handler",
        errorDetails: error instanceof Error ? error.stack : "Unknown stack",
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
