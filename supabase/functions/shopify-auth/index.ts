
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Replace these with your actual Supabase URL and key
const SUPABASE_URL = 'https://nhqrngdzuatdnfkihtud.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocXJuZ2R6dWF0ZG5ma2lodHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDM2MTgsImV4cCI6MjA2MTE3OTYxOH0.bebH8nV_6W0DpwjmS_vYFB2P9xVU-txCRvQc6Jt5DdA';

// The Shopify app credentials
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY") || "7e4608874bbcc38afa1953948da28407";
const SHOPIFY_API_SECRET = Deno.env.get("SHOPIFY_API_SECRET") || "18221d830a86da52082e0d06c0d32ba3";

// Our app's URL - تحديث هنا
const APP_URL = "https://codform-flow-forms.lovable.app";
// تحديثات جديدة: عناوين إعادة التوجيه الدقيقة وفقًا للتكوين في ملف shopify.app.toml
const AUTH_CALLBACK_URL = `${APP_URL}/api/shopify-callback`;

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
  const url = new URL(req.url);
  const path = url.pathname;
  const shop = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");
  const code = url.searchParams.get("code");
  
  console.log("Request path:", path);
  console.log("Request params:", Object.fromEntries(url.searchParams.entries()));
  
  // Simple CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };
  
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers });
  }
  
  try {
    // No shop provided
    if (!shop) {
      return new Response(
        JSON.stringify({ error: "Missing shop parameter" }), 
        { status: 400, headers }
      );
    }
    
    const cleanedShop = cleanShopDomain(shop);
    console.log("Cleaned shop domain:", cleanedShop);
    
    // No code, start OAuth flow
    if (!code) {
      const state = generateNonce();
      
      try {
        // Save the temporary state and shop to verify later
        await supabase.from('shopify_auth').insert({
          shop: cleanedShop,
          state,
          created_at: new Date().toISOString()
        });
        
        // إنشاء رابط المصادقة مع الرابط الصحيح المضاف للقائمة البيضاء
        const authUrl = `https://${cleanedShop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=write_products,read_products,read_orders,write_orders,write_script_tags,read_themes,write_themes,read_content,write_content&redirect_uri=${encodeURIComponent(AUTH_CALLBACK_URL)}&state=${state}`;
        
        console.log("Generated auth URL:", authUrl);
        
        return new Response(JSON.stringify({
          redirect: authUrl,
          shop: cleanedShop,
          state,
          appUrl: APP_URL,
          callbackUrl: AUTH_CALLBACK_URL
        }), { headers });
      } catch (error) {
        console.error("Error saving auth state:", error);
        return new Response(
          JSON.stringify({ 
            error: "Error initiating authentication",
            details: error instanceof Error ? error.message : "Unknown error"
          }),
          { status: 500, headers }
        );
      }
    } 
    
    // Code is provided - complete the OAuth flow
    if (code && hmac) {
      // Verify hmac if needed
      
      // Exchange code for access token
      const accessTokenResponse = await fetch(
        `https://${cleanedShop}/admin/oauth/access_token`,
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
        console.error("Error response:", errorText);
        throw new Error(`Failed to get access token: ${accessTokenResponse.statusText}`);
      }
      
      const tokenData = await accessTokenResponse.json();
      console.log("Token data received:", { ...tokenData, access_token: "REDACTED" });
      
      // Store the token in Supabase
      const { error: upsertError } = await supabase
        .from('shopify_stores')
        .upsert({
          shop: cleanedShop,
          access_token: tokenData.access_token,
          scope: tokenData.scope,
          updated_at: new Date().toISOString()
        }, { onConflict: 'shop' });
      
      if (upsertError) {
        console.error("Error storing token:", upsertError);
        throw new Error("Failed to store token");
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          shop: cleanedShop,
          message: "Authentication successful"
        }),
        { headers }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers }
    );
    
  } catch (error) {
    console.error("Error in Shopify auth function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers }
    );
  }
});
