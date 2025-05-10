
/**
 * API route fallback for fetching Shopify products
 * This provides a backup method when the edge function fails
 */
export async function GET(request: Request) {
  try {
    // Generate a unique request ID for tracking
    const requestId = `api_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`[${requestId}] API route: Starting products fetch`);

    // Extract shop from URL parameters
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    const debug = url.searchParams.get('debug') === 'true';

    console.log(`[${requestId}] API route: Request for shop ${shop}`);

    if (!shop) {
      return new Response(
        JSON.stringify({ 
          error: { message: 'Missing required parameter: shop' },
          requestId
        }), 
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache'
          }
        }
      );
    }

    // Get access token from token API
    try {
      console.log(`[${requestId}] Fetching token for shop: ${shop}`);
      
      // Add strong cache-busting parameters
      const timestamp = Date.now();
      const tokenResponse = await fetch(`${url.origin}/api/shopify-token?shop=${encodeURIComponent(shop)}&ts=${timestamp}&rid=${requestId}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
          'X-Request-ID': requestId
        }
      });
      
      if (!tokenResponse.ok) {
        console.error(`[${requestId}] Token fetch failed: ${tokenResponse.status}`);
        const errorText = await tokenResponse.text();
        throw new Error(`Token fetch failed: ${tokenResponse.status}, ${errorText}`);
      }
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(`Token error: ${tokenData.error}`);
      }
      
      const accessToken = tokenData.accessToken;
      
      if (!accessToken) {
        throw new Error('No access token available');
      }
      
      console.log(`[${requestId}] Token successfully retrieved for ${shop}`);
      
      // Now that we have the token, call Shopify API with a simplified query
      const shopDomain = shop.includes('myshopify.com') ? shop : `${shop}.myshopify.com`;
      const graphqlEndpoint = `https://${shopDomain}/admin/api/2023-10/graphql.json`;
      
      // Use a very simple query to maximize chances of success
      const graphqlQuery = `
        {
          shop {
            name
            id
          }
          products(first: 10) {
            edges {
              node {
                id
                title
                handle
                featuredImage {
                  url
                }
              }
            }
          }
        }
      `;
      
      console.log(`[${requestId}] Making GraphQL request to Shopify Admin API`);
      
      // Make GraphQL request
      const shopifyResponse = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({ query: graphqlQuery })
      });
      
      if (!shopifyResponse.ok) {
        const errorText = await shopifyResponse.text();
        console.error(`[${requestId}] Shopify API error: ${shopifyResponse.status}, ${errorText}`);
        
        // Special handling for auth errors
        if (shopifyResponse.status === 401) {
          return new Response(
            JSON.stringify({ 
              error: { message: 'Authentication failed - token may be expired' },
              status: shopifyResponse.status,
              requestId
            }), 
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        throw new Error(`Shopify API error: ${shopifyResponse.status}, ${errorText.substring(0, 100)}`);
      }
      
      const shopifyData = await shopifyResponse.json();
      
      if (shopifyData.errors) {
        console.error(`[${requestId}] GraphQL errors:`, shopifyData.errors);
        return new Response(
          JSON.stringify({ 
            error: { message: 'GraphQL errors', details: shopifyData.errors },
            requestId
          }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Make sure we got valid data
      if (!shopifyData.data || !shopifyData.data.products || !shopifyData.data.products.edges) {
        console.error(`[${requestId}] Invalid response format:`, shopifyData);
        return new Response(
          JSON.stringify({ 
            error: { message: 'Invalid response format from Shopify' },
            requestId
          }), 
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Extract shop name for additional verification
      const shopName = shopifyData.data.shop?.name || 'Unknown Shop';
      console.log(`[${requestId}] Connected to shop: ${shopName}`);
      
      // Transform products to a simpler format
      const products = shopifyData.data.products.edges.map((edge: any) => {
        const node = edge.node;
        return {
          id: node.id,
          title: node.title,
          handle: node.handle,
          images: node.featuredImage ? [node.featuredImage.url] : []
        };
      });
      
      console.log(`[${requestId}] Successfully fetched ${products.length} products from ${shopName}`);
      
      // Return successful response
      return new Response(
        JSON.stringify({ 
          success: true,
          products,
          shopName,
          source: 'api-route',
          requestId
        }), 
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    } catch (error) {
      console.error(`[${requestId}] Error fetching products:`, error);
      return new Response(
        JSON.stringify({ 
          error: { 
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: debug ? (error instanceof Error ? error.stack : undefined) : undefined,
            requestId
          } 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Fatal error in API route:', error);
    return new Response(
      JSON.stringify({ 
        error: { message: error instanceof Error ? error.message : 'Unknown error' } 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
