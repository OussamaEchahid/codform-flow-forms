
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

  try {
    // Get request parameters
    const { shop, accessToken } = await req.json()
    
    console.log(`Fetching products for shop: ${shop}`);

    if (!shop || !accessToken) {
      console.error("Missing required parameters: shop or accessToken");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: shop or accessToken' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Normalize shop domain
    let normalizedShopDomain = shop
    if (!normalizedShopDomain.includes('myshopify.com')) {
      normalizedShopDomain = `${normalizedShopDomain}.myshopify.com`
    }

    console.log(`Using normalized shop domain: ${normalizedShopDomain}`);

    // Call Shopify GraphQL API to get products
    const graphqlUrl = `https://${normalizedShopDomain}/admin/api/2023-07/graphql.json`
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
            }
          }
        }
      }
    `

    const shopifyResponse = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query })
    })

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error(`Error fetching products. Status: ${shopifyResponse.status}, Response: ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error fetching products from Shopify', 
          status: shopifyResponse.status,
          error: errorText 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // We return 200 with error info in the body
        }
      )
    }

    const shopifyData = await shopifyResponse.json()
    
    // Transform the product data to a simpler format
    const products = shopifyData.data.products.edges.map(edge => {
      const node = edge.node
      const product = {
        id: node.id,
        title: node.title,
        handle: node.handle,
        price: node?.priceRangeV2?.minVariantPrice?.amount,
        images: node.images.edges.map(img => img.node.url)
      }
      return product
    })
    
    console.log(`Successfully fetched ${products.length} products`);
    
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
          
          console.log(`Added shop ${normalizedShopDomain} to database`);
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
          
          console.log(`Updated shop ${normalizedShopDomain} in database`);
        }
      }
    } catch (dbError) {
      console.error('Error updating database:', dbError);
      // We don't fail the request if database update fails
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        products: products,
        count: products.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
