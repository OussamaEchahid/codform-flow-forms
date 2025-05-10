
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Configure CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Generate a unique request ID for tracking
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] Connection check request received`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Parse request data
    let data;
    try {
      data = await req.json();
    } catch (e) {
      const url = new URL(req.url);
      data = {
        shop: url.searchParams.get("shop"),
        token: url.searchParams.get("token")
      };
    }

    const { shop, token } = data;
    
    console.log(`[${requestId}] Checking connection for shop: ${shop}`);

    if (!shop) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required parameter: shop",
          requestId 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Normalize shop domain
    const shopDomain = shop.includes("myshopify.com") ? shop : `${shop}.myshopify.com`;

    // Get access token if not provided
    let accessToken = token;
    
    if (!accessToken) {
      console.log(`[${requestId}] No token provided, fetching from database`);
      
      // Get Supabase credentials from environment
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Database credentials not available");
      }
      
      // Connect to Supabase
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Get token from shopify_stores table
      const { data: storeData, error: dbError } = await supabase
        .from("shopify_stores")
        .select("access_token")
        .eq("shop", shopDomain)
        .maybeSingle();
      
      if (dbError) {
        console.error(`[${requestId}] Database error:`, dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      if (!storeData || !storeData.access_token) {
        console.log(`[${requestId}] No token found for shop: ${shopDomain}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            connected: false,
            error: "No access token available for this shop",
            requestId
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200  // We use 200 with error in body for better client handling
          }
        );
      }
      
      if (storeData.access_token === 'placeholder_token') {
        console.log(`[${requestId}] Placeholder token found for ${shopDomain}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            connected: false,
            error: "Placeholder token detected",
            isPlaceholder: true,
            shop: shopDomain,
            requestId
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
          }
        );
      }
      
      accessToken = storeData.access_token;
      console.log(`[${requestId}] Token retrieved from database`);
    }

    // We'll use a very simple GraphQL query to verify connection
    const simpleQuery = `
      {
        shop {
          name
        }
      }
    `;

    // Make GraphQL request to Shopify
    console.log(`[${requestId}] Testing connection to Shopify Admin API for ${shopDomain}`);
    
    try {
      const graphqlResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken
        },
        body: JSON.stringify({ query: simpleQuery })
      });

      if (!graphqlResponse.ok) {
        const errorText = await graphqlResponse.text();
        console.error(`[${requestId}] Shopify API error: ${graphqlResponse.status}, ${errorText.substring(0, 200)}`);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            connected: false,
            error: `Shopify API error: ${graphqlResponse.status}`,
            details: errorText.substring(0, 200),
            shop: shopDomain,
            requestId
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200  // We use 200 with error details for better client handling
          }
        );
      }

      const responseData = await graphqlResponse.json();
      
      // Check for GraphQL errors
      if (responseData.errors) {
        console.error(`[${requestId}] GraphQL errors:`, responseData.errors);
        return new Response(
          JSON.stringify({ 
            success: false, 
            connected: false,
            error: "GraphQL errors",
            errors: responseData.errors,
            shop: shopDomain,
            requestId
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
          }
        );
      }

      // Check if data exists and contains shop name
      if (!responseData.data || !responseData.data.shop) {
        console.error(`[${requestId}] Invalid response format:`, responseData);
        return new Response(
          JSON.stringify({ 
            success: false, 
            connected: false,
            error: "Invalid response format from Shopify",
            shop: shopDomain,
            requestId
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
          }
        );
      }

      // Connection successful
      const shopName = responseData.data.shop.name || shopDomain;
      console.log(`[${requestId}] Connection successful to shop: ${shopName}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          connected: true,
          shop: shopDomain,
          shopName,
          requestId
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    } catch (graphqlError) {
      console.error(`[${requestId}] GraphQL request error:`, graphqlError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          connected: false,
          error: "Error connecting to Shopify API",
          details: graphqlError instanceof Error ? graphqlError.message : String(graphqlError),
          shop: shopDomain,
          requestId
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        connected: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
        requestId
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
