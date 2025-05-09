import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Initializing shopify-test-connection function");

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`Test connection request received: ${req.url}`);
  
  try {
    const { shop, accessToken, requestId } = await req.json();
    
    // Log with request ID if provided
    const logPrefix = requestId ? `[${requestId}]` : '';
    console.log(`${logPrefix} Testing connection for shop: ${shop}`);

    if (!shop || !accessToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Missing required parameters: shop and accessToken" 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Normalize shop domain
    const shopDomain = shop.includes('myshopify.com') ? shop : `${shop}.myshopify.com`;
    console.log(`${logPrefix} Using normalized shop domain: ${shopDomain}`);

    // Test API connection by making a simple call
    try {
      const shopResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (!shopResponse.ok) {
        // If response is not OK, check specific status codes
        const responseBody = await shopResponse.text();
        console.error(`${logPrefix} Connection test failed with status ${shopResponse.status}: ${responseBody}`);
        
        // If it's an authentication issue
        if (shopResponse.status === 401 || shopResponse.status === 403) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: "Invalid or expired access token",
              status: shopResponse.status,
              details: responseBody
            }),
            { 
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        // Other error cases
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `API request failed with status ${shopResponse.status}`,
            status: shopResponse.status,
            details: responseBody
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Successfully validated token
      const shopData = await shopResponse.json();
      console.log(`${logPrefix} Connection test successful for shop: ${shopData.shop.name}`);
      
      // Update the shop record in the database to mark as active
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Update shop as active
        const { error } = await supabase
          .from('shopify_stores')
          .update({ is_active: true })
          .eq('shop', shop);
          
        if (error) {
          console.error(`${logPrefix} Error updating shop record:`, error);
        } else {
          console.log(`${logPrefix} Updated shop ${shop} in database`);
        }
      } catch (dbError) {
        console.error(`${logPrefix} Database update error:`, dbError);
        // Continue execution since the API connection was successful
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Connection successful",
          shop: shopData.shop.name,
          shopDomain: shopDomain,
          myshopifyDomain: shopData.shop.myshopify_domain
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (apiError) {
      // Network or other errors
      console.error(`${logPrefix} API connection error:`, apiError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: apiError instanceof Error ? apiError.message : "Unknown API connection error",
          error: apiError instanceof Error ? apiError.name : "NetworkError"
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error("General error in test-connection function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Server error processing connection test",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
