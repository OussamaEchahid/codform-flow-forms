
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
const AUTH_CALLBACK_URL = `${APP_URL}/api/shopify-callback`;

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

// Create nonce for security
function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let shop = url.searchParams.get("shop");
    
    console.log("Request params:", Object.fromEntries(url.searchParams.entries()));
    
    // No shop provided
    if (!shop) {
      return new Response(
        JSON.stringify({ error: "Missing shop parameter" }), 
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Clean shop domain from any protocol
    const cleanedShop = cleanShopDomain(shop);
    console.log("Cleaned shop domain:", cleanedShop);

    // Generate a unique state for this authorization
    const state = generateNonce();
    
    try {
      // Save the temporary state and shop to verify later
      const { error: insertError } = await supabase.from('shopify_auth').insert({
        shop: cleanedShop,
        state,
      });
      
      if (insertError) {
        console.error("Error saving auth state:", insertError);
        // Continue anyway - non-critical error
      } else {
        console.log("Auth state saved successfully");
      }
      
      // Create the authentication URL
      const scopes = "write_products,read_products,read_orders,write_orders,write_script_tags,read_themes,write_themes,read_content,write_content";
      const authUrl = `https://${cleanedShop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${encodeURIComponent(AUTH_CALLBACK_URL)}&state=${state}`;
      
      console.log("Generated auth URL:", authUrl);
      
      return new Response(JSON.stringify({
        redirect: authUrl,
        shop: cleanedShop,
        state,
        appUrl: APP_URL,
        callbackUrl: AUTH_CALLBACK_URL
      }), { headers: corsHeaders });
    } catch (error) {
      console.error("Error initiating authentication:", error);
      return new Response(
        JSON.stringify({ 
          error: "Error initiating authentication",
          details: error instanceof Error ? error.message : "Unknown error",
          shop: cleanedShop,
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("Critical error in auth function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
