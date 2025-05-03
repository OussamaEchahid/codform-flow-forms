
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";

// Replace these with your actual Supabase URL and key
const SUPABASE_URL = 'https://nhqrngdzuatdnfkihtud.supabase.co';
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';

// The Shopify app credentials
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY") || "";
const SHOPIFY_API_SECRET = Deno.env.get("SHOPIFY_API_SECRET") || "";

// Our app's URL
const APP_URL = "https://codform-flow-forms.lovable.app";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, shopify-access-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to clean shop domain
function cleanShopDomain(shop: string): string {
  if (!shop || shop === "") {
    return "";
  }
  
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
  console.log("Request received:", req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  // Handle POST requests for starting auth flow
  if (req.method === "POST") {
    try {
      const data = await req.json();
      console.log("POST request data:", data);
      
      if (!data.shop) {
        return new Response(
          JSON.stringify({ error: "Shop parameter is required" }), 
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Clean shop domain
      const shop = cleanShopDomain(data.shop);
      
      if (!shop) {
        return new Response(
          JSON.stringify({ error: "Invalid shop domain" }), 
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Generate unique state
      const state = uuidv4();
      
      // Save state for verification
      const { error: insertError } = await supabase.from("shopify_auth").insert({ 
        state,
        shop
      });
      
      if (insertError) {
        console.error("Error saving auth state:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to save auth state" }), 
          { status: 500, headers: corsHeaders }
        );
      }
      
      // Generate auth URL
      const scopes = "write_products,read_products,read_orders,write_orders,write_script_tags,read_themes,write_themes";
      const redirectUri = `${data.redirectUri || APP_URL}/shopify-callback`;
      
      const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
      authUrl.searchParams.append("client_id", SHOPIFY_API_KEY);
      authUrl.searchParams.append("scope", scopes);
      authUrl.searchParams.append("redirect_uri", redirectUri);
      authUrl.searchParams.append("state", state);
      
      console.log("Generated auth URL:", authUrl.toString());
      
      return new Response(
        JSON.stringify({ 
          success: true,
          url: authUrl.toString(),
          state,
          shop
        }), 
        { status: 200, headers: corsHeaders }
      );
    } catch (error) {
      console.error("Error processing POST request:", error);
      return new Response(
        JSON.stringify({ error: "Error processing request" }), 
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Handle GET requests for legacy auth flow
  try {
    const url = new URL(req.url);
    const shop = url.searchParams.get("shop");
    const clientUrl = url.searchParams.get("client") || APP_URL;
    const debug = url.searchParams.get("debug") === "true";
    
    if (debug) {
      console.log("Request params:", Object.fromEntries(url.searchParams.entries()));
      console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    }
    
    if (!shop) {
      return new Response(
        JSON.stringify({ error: "Shop parameter is required" }), 
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Clean shop domain
    const cleanedShop = cleanShopDomain(shop);
    console.log("Initiating auth for shop:", cleanedShop);
    
    // Generate unique state
    const state = uuidv4();
    const timestamp = Date.now();
    
    // Save state for verification
    const { error: insertError } = await supabase.from("shopify_auth").insert({ 
      state,
      shop: cleanedShop
    });
    
    if (insertError) {
      console.error("Error saving auth state:", insertError);
      // Continue anyway - this is non-critical
    }
    
    // Check if we already have a token for this shop
    const { data: existingStore } = await supabase
      .from('shopify_stores')
      .select('access_token, updated_at')
      .eq('shop', cleanedShop)
      .maybeSingle();
      
    if (existingStore?.access_token) {
      console.log("Found existing access token for shop:", cleanedShop);
      
      // Check token age
      const tokenAge = existingStore.updated_at ? 
        (Date.now() - new Date(existingStore.updated_at).getTime()) / (1000 * 60 * 60 * 24) : 
        0;
        
      // If token is recent, return success immediately
      if (tokenAge < 7) {
        const redirectUrl = `${clientUrl}/dashboard?shopify_connected=true&shop=${encodeURIComponent(cleanedShop)}&auth_success=true&timestamp=${timestamp}`;
        console.log("Using existing token, redirecting to:", redirectUrl);
        
        return new Response(JSON.stringify({
          success: true,
          shop: cleanedShop,
          redirect: redirectUrl,
          hasExistingToken: true
        }), { 
          headers: {
            ...corsHeaders,
            "Location": redirectUrl
          }
        });
      }
    }
    
    // Create the callback URL
    const callbackUrl = `${clientUrl}/shopify-callback`;
    
    // Generate auth URL
    const scopes = "write_products,read_products,read_orders,write_orders,write_script_tags,read_themes,write_themes";
    
    const authUrl = new URL(`https://${cleanedShop}/admin/oauth/authorize`);
    authUrl.searchParams.append("client_id", SHOPIFY_API_KEY);
    authUrl.searchParams.append("scope", scopes);
    authUrl.searchParams.append("redirect_uri", callbackUrl);
    authUrl.searchParams.append("state", state);
    
    console.log("Generated auth URL:", authUrl.toString());
    
    return new Response(JSON.stringify({
      success: true,
      redirect: authUrl.toString(),
      shop: cleanedShop,
      state,
      callbackUrl,
      timestamp,
      version: "v3"
    }), { 
      headers: {
        ...corsHeaders,
        "Location": authUrl.toString()
      }
    });
  } catch (error) {
    console.error("Error in auth function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        timestamp: new Date().toISOString(),
        success: false
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
