
/**
 * API route fallback for fetching Shopify products
 * This provides a backup method when the edge function fails
 */
export async function GET(request: Request) {
  try {
    // Extract shop from URL parameters
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');

    if (!shop) {
      return new Response(
        JSON.stringify({ 
          error: { message: 'Missing required parameter: shop' } 
        }), 
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          }
        }
      );
    }

    console.log(`API route: fetching products for shop ${shop}`);
    
    // Get access token from Supabase database
    const tokenResponse = await fetch(`${url.origin}/api/shopify-token?shop=${encodeURIComponent(shop)}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
    
    if (!tokenResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: { message: `Failed to fetch token: ${tokenResponse.status}` } 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.accessToken;
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          error: { message: 'No access token available' } 
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Call Shopify Admin API directly from this endpoint as a fallback
    const shopDomain = shop.includes('myshopify.com') ? shop : `${shop}.myshopify.com`;
    const graphqlEndpoint = `https://${shopDomain}/admin/api/2023-07/graphql.json`;
    
    const graphqlQuery = `
      query {
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
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    priceV2 {
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
    `;
    
    // Make the GraphQL request to Shopify
    const shopifyResponse = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({ query: graphqlQuery })
    });
    
    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error('Shopify API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: { 
            message: `Shopify API error: ${shopifyResponse.status}`,
            details: errorText.substring(0, 200) 
          } 
        }), 
        { 
          status: shopifyResponse.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const shopifyData = await shopifyResponse.json();
    
    if (shopifyData.errors) {
      return new Response(
        JSON.stringify({ 
          error: { 
            message: 'GraphQL errors', 
            details: shopifyData.errors
          } 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!shopifyData.data || !shopifyData.data.products || !shopifyData.data.products.edges) {
      return new Response(
        JSON.stringify({ 
          error: { message: 'Invalid response format from Shopify' } 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Transform products into the expected format
    const products = shopifyData.data.products.edges.map((edge: any) => {
      const node = edge.node;
      let images: string[] = [];
      
      if (node.images && node.images.edges && Array.isArray(node.images.edges)) {
        images = node.images.edges.map((img: any) => img.node.url);
      }

      let variants: any[] = [];
      if (node.variants && node.variants.edges && Array.isArray(node.variants.edges)) {
        variants = node.variants.edges.map((variant: any) => ({
          id: variant.node.id,
          title: variant.node.title,
          price: variant.node.priceV2.amount,
          available: variant.node.availableForSale,
        }));
      }

      return {
        id: node.id,
        title: node.title,
        handle: node.handle,
        price: node.priceRangeV2?.minVariantPrice?.amount || '0',
        images: images,
        variants: variants,
      };
    });
    
    // Return successful response
    return new Response(
      JSON.stringify({ 
        success: true,
        products,
        source: 'api-route'
      }), 
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        }
      }
    );
    
  } catch (error) {
    console.error('Error in API route:', error);
    return new Response(
      JSON.stringify({ 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error',
        } 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
