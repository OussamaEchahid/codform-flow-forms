
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // CORS handling - very important for browser clients
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate a unique request ID for tracing
  const requestId = req.headers.get('x-request-id') || `req_test_${Math.random().toString(36).substring(2, 10)}`;
  
  try {
    // Parse the request body
    const { shop, accessToken, forceRefresh, timestamp } = await req.json();
    
    console.log(`[${requestId}] Testing connection for shop: ${shop}`);
    
    if (!shop || !accessToken) {
      throw new Error('Missing required parameters: shop or accessToken');
    }
    
    // Normalize shop domain
    let normalizedShopDomain = shop;
    if (!normalizedShopDomain.includes('myshopify.com')) {
      normalizedShopDomain = `${normalizedShopDomain}.myshopify.com`;
    }
    
    console.log(`[${requestId}] Using normalized shop domain: ${normalizedShopDomain}`);
    
    // Make a simple request to the Shopify API to test the connection
    try {
      console.log(`[${requestId}] Making request to Shopify API to test connection`);
      
      const shopName = normalizedShopDomain.split('.')[0];
      
      // Use GraphQL endpoint with a simple shop query to test the connection
      const graphqlEndpoint = `https://${normalizedShopDomain}/admin/api/2023-10/graphql.json`;
      
      const query = `{
        shop {
          name
          myshopifyDomain
        }
      }`;
      
      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }
      
      if (!data.data || !data.data.shop) {
        throw new Error('Invalid API response structure');
      }
      
      // Connection was successful
      console.log(`[${requestId}] Successfully connected to shop: ${shopName}`);
      
      // Store or update the token in the database
      try {
        // Get Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://mtyfuwdsshlzqwjujavp.supabase.co';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Get existing store
          const { data: existingStore } = await supabase
            .from('shopify_stores')
            .select()
            .eq('shop', normalizedShopDomain)
            .limit(1);
          
          if (!existingStore || existingStore.length === 0) {
            // Create new store record
            await supabase
              .from('shopify_stores')
              .insert({
                shop: normalizedShopDomain,
                access_token: accessToken,
                is_active: true
              });
          } else {
            // Update existing store record
            await supabase
              .from('shopify_stores')
              .update({
                access_token: accessToken,
                is_active: true,
                updated_at: new Date().toISOString()
              })
              .eq('shop', normalizedShopDomain);
          }
        }
      } catch (dbError) {
        console.error(`[${requestId}] Database error:`, dbError);
        // Continue even if database update fails
      }
      
      // Return success response
      console.log(`[${requestId}] Connection test successful for shop: ${shopName}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          shop: shopName,
          shopDomain: normalizedShopDomain,
          message: 'Connection successful'
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        }
      );
    } catch (apiError) {
      console.error(`[${requestId}] Connection test failed:`, apiError);
      
      return new Response(
        JSON.stringify({
          success: false,
          shop,
          message: 'Connection test failed',
          error: apiError instanceof Error ? apiError.message : String(apiError)
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200  // We return 200 with error info in the body for better client handling
        }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Error processing request:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error processing request',
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
})
