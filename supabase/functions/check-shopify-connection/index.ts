
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.18.0";

// Configure CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req: Request) => {
  // Generate request ID for tracking
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] Checking Shopify connection`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    let shop;
    let forceRefresh = false;
    
    // Parse the request body
    try {
      const body = await req.json();
      shop = body.shop;
      forceRefresh = !!body.forceRefresh;
    } catch (e) {
      // Try from URL if body parsing fails
      try {
        const url = new URL(req.url);
        shop = url.searchParams.get('shop');
        forceRefresh = url.searchParams.get('forceRefresh') === 'true';
      } catch (urlError) {
        console.error(`[${requestId}] Error parsing URL:`, urlError);
      }
    }

    if (!shop) {
      throw new Error('Shop parameter is required');
    }
    
    console.log(`[${requestId}] Checking connection for shop: ${shop}, forceRefresh: ${forceRefresh}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Get shop token from database
    const { data: storeData, error: storeError } = await supabaseClient
      .from('shopify_stores')
      .select('shop, access_token, token_type, is_active, updated_at')
      .eq('shop', shop)
      .maybeSingle();
      
    if (storeError) {
      throw new Error(`Error fetching shop data: ${storeError.message}`);
    }
    
    if (!storeData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Shop not found: ${shop}`,
          status: 'not_connected',
          requestId
        }),
        { status: 404, headers: { ...corsHeaders } }
      );
    }
    
    // Check if token is present
    if (!storeData.access_token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Access token not found for shop',
          status: 'token_missing',
          requestId
        }),
        { status: 401, headers: { ...corsHeaders } }
      );
    }
    
    // Verify token with Shopify API (if forced or not cached)
    if (forceRefresh) {
      console.log(`[${requestId}] Testing Shopify token validity`);
      
      try {
        // Use GraphQL Admin API to test token
        const shopDomain = shop.includes('myshopify.com') ? shop : `${shop}.myshopify.com`;
        const graphqlEndpoint = `https://${shopDomain}/admin/api/2023-10/graphql.json`;
        
        const query = `
          {
            shop {
              name
              plan {
                displayName
              }
            }
          }
        `;
        
        const response = await fetch(graphqlEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': storeData.access_token
          },
          body: JSON.stringify({ query })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${requestId}] Shopify API error (${response.status}):`, errorText);
          
          // Check if this is an authentication error
          if (response.status === 401 || response.status === 403) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Shopify authentication failed - token may be expired',
                status: 'token_expired',
                tokenStatus: 'invalid',
                requestId
              }),
              { status: 401, headers: { ...corsHeaders } }
            );
          }
          
          throw new Error(`Shopify API error: ${response.statusText}`);
        }
        
        const shopData = await response.json();
        
        if (shopData.errors) {
          console.error(`[${requestId}] GraphQL errors:`, shopData.errors);
          
          // Check for authentication errors in the GraphQL response
          const errorMessages = shopData.errors.map((err: any) => err.message).join(', ');
          if (errorMessages.toLowerCase().includes('access') || 
              errorMessages.toLowerCase().includes('token') || 
              errorMessages.toLowerCase().includes('auth')) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Shopify authentication failed in GraphQL - token may be expired',
                status: 'token_expired',
                details: errorMessages,
                tokenStatus: 'invalid',
                requestId
              }),
              { status: 401, headers: { ...corsHeaders } }
            );
          }
          
          throw new Error(`GraphQL Error: ${shopData.errors[0]?.message}`);
        }
        
        // Token is valid, update shop status if needed
        if (!storeData.is_active) {
          await supabaseClient
            .from('shopify_stores')
            .update({ is_active: true, updated_at: new Date().toISOString() })
            .eq('shop', shop);
        }
        
        // Return shop data
        return new Response(
          JSON.stringify({ 
            success: true, 
            shop: storeData.shop,
            tokenStatus: 'valid',
            tokenType: storeData.token_type || 'offline',
            isActive: true,
            shopInfo: shopData.data?.shop || null,
            requestId
          }),
          { headers: { ...corsHeaders } }
        );
      } catch (apiError) {
        console.error(`[${requestId}] Error testing Shopify connection:`, apiError);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Error testing Shopify connection: ${apiError.message}`,
            status: 'connection_error',
            tokenStatus: 'unknown',
            requestId
          }),
          { status: 500, headers: { ...corsHeaders } }
        );
      }
    } else {
      // Return cached info
      return new Response(
        JSON.stringify({ 
          success: true, 
          shop: storeData.shop,
          tokenStatus: 'assumed_valid', // Not actually verified
          tokenType: storeData.token_type || 'offline',
          isActive: storeData.is_active,
          lastUpdated: storeData.updated_at,
          note: 'Token not verified, use forceRefresh=true to validate with Shopify API',
          requestId
        }),
        { headers: { ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error",
        requestId,
        timestamp: new Date().toISOString()
      }),
      { status: 400, headers: { ...corsHeaders } }
    );
  }
});
