
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

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
        accessToken: url.searchParams.get('accessToken')
      };
    }
    
    const { shop, accessToken } = params;
    
    console.log(`[${requestId}] Processing request for shop: ${shop}`);

    if (!shop || !accessToken) {
      console.error(`[${requestId}] Missing required parameters: shop=${!!shop}, accessToken=${!!accessToken}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: shop or accessToken' 
        }),
        { 
          headers: { ...corsHeaders },
          status: 400 
        }
      )
    }

    // Normalize shop domain
    let normalizedShopDomain = shop
    if (!normalizedShopDomain.includes('myshopify.com')) {
      normalizedShopDomain = `${normalizedShopDomain}.myshopify.com`
    }

    console.log(`[${requestId}] Using normalized shop domain: ${normalizedShopDomain}`);

    // Call Shopify GraphQL API to get products
    const graphqlUrl = `https://${normalizedShopDomain}/admin/api/2023-10/graphql.json` // Updated API version
    const query = `
      {
        products(first: 50) {
          edges {
            node {
              id
              title
              handle
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 1) {
                edges {
                  node {
                    url
                  }
                }
              }
              variants(first: 5) {
                edges {
                  node {
                    id
                    title
                    price: priceV2 {
                      amount
                      currencyCode
                    }
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    ` // Updated query with price: priceV2 alias to match newer Shopify API

    let retryCount = 0;
    const maxRetries = 2;
    let shopifyResponse;
    let lastError;
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`[${requestId}] Making GraphQL request to Shopify - attempt ${retryCount + 1}/${maxRetries + 1}`);
        shopifyResponse = await fetch(graphqlUrl, {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ query })
        });
        
        // Break on any response (even error responses)
        break;
      } catch (error) {
        lastError = error;
        retryCount++;
        
        if (retryCount > maxRetries) {
          console.error(`[${requestId}] All retry attempts failed:`, error);
          break;
        }
        
        // Add exponential backoff
        const delay = Math.min(100 * Math.pow(2, retryCount), 1000);
        console.log(`[${requestId}] Retry attempt ${retryCount}/${maxRetries}, waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If all retries failed with network errors
    if (!shopifyResponse) {
      console.error(`[${requestId}] Failed to connect to Shopify API after ${maxRetries + 1} attempts`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to connect to Shopify API after multiple attempts', 
          error: lastError instanceof Error ? lastError.message : String(lastError)
        }),
        { 
          headers: corsHeaders,
          status: 200 // We return 200 with error info in the body for better client handling
        }
      )
    }

    // Handle HTTP error responses
    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error(`[${requestId}] Error fetching products. Status: ${shopifyResponse.status}, Response: ${errorText}`);
      
      // Special handling for common errors
      if (shopifyResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Authentication failed - token may be expired or invalid',
            status: shopifyResponse.status
          }),
          { headers: corsHeaders, status: 200 }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Error fetching products from Shopify: ${shopifyResponse.status}`, 
          status: shopifyResponse.status,
          error: errorText.substring(0, 200)
        }),
        { 
          headers: corsHeaders,
          status: 200 // We return 200 with error info in the body
        }
      )
    }

    // Process the successful response
    try {
      const shopifyData = await shopifyResponse.json();
      
      if (shopifyData.errors) {
        console.error(`[${requestId}] GraphQL errors:`, shopifyData.errors);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'GraphQL errors', 
            errors: shopifyData.errors
          }),
          { headers: corsHeaders, status: 200 }
        )
      }
      
      if (!shopifyData.data || !shopifyData.data.products || !shopifyData.data.products.edges) {
        console.error(`[${requestId}] Invalid response format from Shopify:`, shopifyData);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Invalid response format from Shopify'
          }),
          { headers: corsHeaders, status: 200 }
        )
      }
      
      // Transform the product data to a simpler format
      const products = shopifyData.data.products.edges.map(edge => {
        const node = edge.node;
        const product = {
          id: node.id,
          title: node.title,
          handle: node.handle,
          price: node?.priceRangeV2?.minVariantPrice?.amount,
          images: node.images?.edges?.map(img => img.node.url) || [],
          variants: (node.variants?.edges || []).map(variant => ({
            id: variant.node.id,
            title: variant.node.title,
            price: variant.node.price?.amount,
            available: variant.node.availableForSale,
          }))
        }
        return product;
      });
      
      console.log(`[${requestId}] Successfully fetched ${products.length} products`);
      
      // Store the shop in database if it doesn't exist
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://mtyfuwdsshlzqwjujavp.supabase.co'
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if (supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey)
          
          // Check if the store exists in the database
          const { data: existingStore } = await supabase
            .from('shopify_stores')
            .select()
            .eq('shop', normalizedShopDomain)
            .limit(1)
          
          if (!existingStore || existingStore.length === 0) {
            // Store doesn't exist, let's create it
            await supabase
              .from('shopify_stores')
              .insert({
                shop: normalizedShopDomain,
                access_token: accessToken,
                is_active: true
              })
            
            console.log(`[${requestId}] Added shop ${normalizedShopDomain} to database`);
          } else {
            // Store exists, update the token and set as active
            await supabase
              .from('shopify_stores')
              .update({
                access_token: accessToken,
                is_active: true,
                updated_at: new Date().toISOString()
              })
              .eq('shop', normalizedShopDomain)
            
            console.log(`[${requestId}] Updated shop ${normalizedShopDomain} in database`);
          }
        }
      } catch (dbError) {
        console.error(`[${requestId}] Error updating database:`, dbError);
        // We don't fail the request if database update fails
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          products: products,
          count: products.length
        }),
        { 
          headers: corsHeaders,
          status: 200 
        }
      )
    } catch (parseError) {
      console.error(`[${requestId}] Error parsing Shopify response:`, parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error parsing Shopify response',
          error: parseError instanceof Error ? parseError.message : String(parseError)
        }),
        { headers: corsHeaders, status: 200 }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Error processing request:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      { 
        headers: corsHeaders,
        status: 500 
      }
    )
  }
})
