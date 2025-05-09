
/**
 * API route fallback for fetching Shopify products
 * This provides a backup method when the edge function fails
 */
export async function GET(request: Request) {
  try {
    // Extract shop from URL parameters
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    const debug = url.searchParams.get('debug') === 'true';
    const requestId = `api_${Math.random().toString(36).substring(2, 10)}`;

    console.log(`[${requestId}] API route: fetching products for shop ${shop}`);

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

    // Get access token from Supabase database
    try {
      console.log(`[${requestId}] Fetching token for shop: ${shop}`);
      
      const tokenResponse = await fetch(`${url.origin}/api/shopify-token?shop=${encodeURIComponent(shop)}&debug=true`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      
      if (!tokenResponse.ok) {
        console.error(`[${requestId}] Token fetch failed with status ${tokenResponse.status}`);
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to fetch token: ${tokenResponse.status}, ${errorText}`);
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
      
      console.log(`[${requestId}] Making GraphQL request to Shopify Admin API`);
      
      // Make the GraphQL request to Shopify with retries
      let retryCount = 0;
      let shopifyResponse;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          shopifyResponse = await fetch(graphqlEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken,
              'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({ query: graphqlQuery })
          });
          
          break; // Success, exit loop
        } catch (fetchError) {
          retryCount++;
          console.error(`[${requestId}] Fetch attempt ${retryCount} failed:`, fetchError);
          
          if (retryCount >= maxRetries) {
            throw fetchError;
          }
          
          // Wait before retrying with exponential backoff
          const delay = Math.min(100 * Math.pow(2, retryCount), 2000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (!shopifyResponse) {
        throw new Error('Failed to get a response from Shopify API after retries');
      }
      
      if (!shopifyResponse.ok) {
        const errorText = await shopifyResponse.text();
        console.error(`[${requestId}] Shopify API error (${shopifyResponse.status}):`, errorText);
        
        // Special handling for common error types
        if (shopifyResponse.status === 401) {
          return new Response(
            JSON.stringify({ 
              error: { 
                message: 'Authentication failed - token may be expired',
                status: shopifyResponse.status,
                details: errorText.substring(0, 200)
              } 
            }), 
            { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        
        throw new Error(`Shopify API error: ${shopifyResponse.status}, ${errorText.substring(0, 200)}`);
      }
      
      const shopifyData = await shopifyResponse.json();
      
      if (shopifyData.errors) {
        console.error(`[${requestId}] GraphQL errors:`, shopifyData.errors);
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
        console.error(`[${requestId}] Invalid response format from Shopify:`, shopifyData);
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
      
      console.log(`[${requestId}] Successfully fetched ${products.length} products`);
      
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
      console.error(`[${requestId}] Error fetching products:`, error);
      return new Response(
        JSON.stringify({ 
          error: { 
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: debug ? (error instanceof Error ? error.stack : undefined) : undefined
          } 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Fatal error in API route:', error);
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
