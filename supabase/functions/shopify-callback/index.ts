
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Replace these with your actual Supabase URL and key
const SUPABASE_URL = 'https://nhqrngdzuatdnfkihtud.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocXJuZ2R6dWF0ZG5ma2lodHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDM2MTgsImV4cCI6MjA2MTE3OTYxOH0.bebH8nV_6W0DpwjmS_vYFB2P9xVU-txCRvQc6Jt5DdA';

// The Shopify app credentials - استخدام Deno.env بدلاً من process.env
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY") || "7e4608874bbcc38afa1953948da28407";
const SHOPIFY_API_SECRET = Deno.env.get("SHOPIFY_API_SECRET") || "18221d830a86da52082e0d06c0d32ba3";

// Our app's URL
const APP_URL = "https://codform-flow-forms.lovable.app";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

serve(async (req) => {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  
  console.log("Callback received with params:", {
    shop,
    hmac: hmac ? "present" : "missing", 
    code: code ? "present" : "missing", 
    state
  });
  
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers });
  }
  
  try {
    if (!shop || !code || !hmac) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }), 
        { status: 400, headers }
      );
    }
    
    // Verify state if needed
    if (state) {
      const { data: authRecord } = await supabase
        .from('shopify_auth')
        .select('*')
        .eq('state', state)
        .single();
      
      if (!authRecord) {
        return new Response(
          JSON.stringify({ error: "Invalid state parameter" }), 
          { status: 400, headers }
        );
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
      throw new Error(`Failed to get access token: ${accessTokenResponse.statusText}`);
    }
    
    const tokenData = await accessTokenResponse.json();
    console.log("Token data received:", { ...tokenData, access_token: "REDACTED" });
    
    // Store the token in Supabase
    const { error: storeError } = await supabase
      .from('shopify_stores')
      .upsert({
        shop,
        access_token: tokenData.access_token,
        scope: tokenData.scope,
        updated_at: new Date().toISOString()
      }, { onConflict: 'shop' });
      
    if (storeError) {
      console.error("Error storing token:", storeError);
      throw new Error("Failed to store token");
    }
    
    console.log("Redirecting back to app:", `${APP_URL}/dashboard?shopify_success=true&shop=${encodeURIComponent(shop)}`);
    
    // Redirect back to our app with JSON response
    return new Response(
      JSON.stringify({
        success: true,
        shop,
        redirect: `${APP_URL}/dashboard?shopify_success=true&shop=${encodeURIComponent(shop)}`
      }),
      { 
        status: 200, 
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        }
      }
    );
    
  } catch (error) {
    console.error("Error in Shopify callback:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
