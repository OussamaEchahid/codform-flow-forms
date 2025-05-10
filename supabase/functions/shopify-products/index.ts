
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate a unique request ID for tracking
  const requestId = `edge_${Math.random().toString(36).substring(2, 8)}`;
  console.log(`[${requestId}] Request received`);

  try {
    // Get request parameters
    const contentType = req.headers.get('content-type') || '';
    let params;
    
    if (contentType.includes('application/json')) {
      params = await req.json();
    } else {
      // For GET requests or other content types
      const url = new URL(req.url);
      params = {
        shop: url.searchParams.get('shop'),
        accessToken: url.searchParams.get('accessToken'),
        forceRefresh: url.searchParams.get('forceRefresh') === 'true'
      };
    }
    
    const { shop, accessToken, forceRefresh } = params;
    
    console.log(`[${requestId}] Processing request for shop: ${shop}, forceRefresh: ${forceRefresh}`);

    if (!shop) {
      console.error(`[${requestId}] Missing shop parameter`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameter: shop',
          requestId 
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

    // Debugging: Check access token
    if (!accessToken) {
      console.log(`[${requestId}] No access token provided, retrieving from database`);
      
      // Get supabase credentials
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials are missing');
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Normalize shop domain
      let normalizedShopDomain = shop;
      if (!normalizedShopDomain.includes('myshopify.com')) {
        normalizedShopDomain = `${normalizedShopDomain}.myshopify.com`;
      }
      
      // Get token from database
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', normalizedShopDomain)
        .maybeSingle();
        
      if (storeError) {
        console.error(`[${requestId}] Error retrieving token from database:`, storeError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Database error when retrieving token',
            details: storeError.message,
            requestId
          }),
          { 
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 500 
          }
        );
      }
      
      if (!storeData || !storeData.access_token || storeData.access_token === 'placeholder_token') {
        console.error(`[${requestId}] No valid token found for shop: ${normalizedShopDomain}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No valid access token available for this shop',
            isPlaceholder: storeData?.access_token === 'placeholder_token',
            requestId
          }),
          { 
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 401 
          }
        );
      }
      
      // Use token from database
      params.accessToken = storeData.access_token;
      console.log(`[${requestId}] Retrieved token from database for shop ${normalizedShopDomain}`);
    }

    // Normalize shop domain
    let normalizedShopDomain = shop;
    if (!normalizedShopDomain.includes('myshopify.com')) {
      normalizedShopDomain = `${normalizedShopDomain}.myshopify.com`;
    }

    console.log(`[${requestId}] Using normalized shop domain: ${normalizedShopDomain}`);

    // Call Shopify GraphQL API to get products - SIMPLER QUERY
    const graphqlUrl = `https://${normalizedShopDomain}/admin/api/2023-10/graphql.json`;
    
    // We'll use a very simple and reliable query format
    const query = `
      {
        products(first: 10) {
          edges {
            node {
              id
              title
              handle
              featuredImage {
                url
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    `;

    console.log(`[${requestId}] Making GraphQL request to Shopify`);

    try {
      // Make request with proper headers and a simplified query
      const shopifyResponse = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': params.accessToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      
      // Handle response error status
      if (!shopifyResponse.ok) {
        const errorText = await shopifyResponse.text();
        console.error(`[${requestId}] Shopify API error: ${shopifyResponse.status}, ${errorText.substring(0, 200)}`);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Error from Shopify API (${shopifyResponse.status})`, 
            statusCode: shopifyResponse.status,
            error: errorText.substring(0, 300),
            shop: normalizedShopDomain,
            requestId
          }),
          { 
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }, 
            status: 200  // Return 200 with error details for better client handling
          }
        );
      }
      
      // Parse and validate response data
      const responseData = await shopifyResponse.json();
      
      if (responseData.errors) {
        console.error(`[${requestId}] GraphQL errors:`, responseData.errors);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'GraphQL errors', 
            errors: responseData.errors,
            shop: normalizedShopDomain,
            requestId
          }),
          { 
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }, 
            status: 200 
          }
        );
      }
      
      if (!responseData.data || !responseData.data.products || !responseData.data.products.edges) {
        console.error(`[${requestId}] Invalid response format:`, responseData);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Invalid response format from Shopify',
            responseData,
            shop: normalizedShopDomain,
            requestId
          }),
          { 
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }, 
            status: 200 
          }
        );
      }
      
      // Transform products to a simpler format
      const products = responseData.data.products.edges.map((edge: any) => {
        const node = edge.node;
        const variant = node.variants.edges[0]?.node;

        return {
          id: node.id,
          title: node.title,
          handle: node.handle,
          price: variant?.price || "0.00",
          available: variant?.availableForSale || false,
          images: node.featuredImage ? [node.featuredImage.url] : [],
          variants: node.variants.edges.map((v: any) => ({
            id: v.node.id,
            price: v.node.price,
            available: v.node.availableForSale
          }))
        };
      });
      
      console.log(`[${requestId}] Successfully fetched ${products.length} products`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          products,
          count: products.length,
          shop: normalizedShopDomain,
          requestId,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }, 
          status: 200 
        }
      );
    } catch (error) {
      console.error(`[${requestId}] Error in Shopify request:`, error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error making request to Shopify API',
          error: error instanceof Error ? error.message : String(error),
          shop: normalizedShopDomain,
          requestId
        }),
        { 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }, 
          status: 200 
        }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        trace: error instanceof Error ? error.stack : null,
        requestId
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }, 
        status: 500 
      }
    );
  }
});
