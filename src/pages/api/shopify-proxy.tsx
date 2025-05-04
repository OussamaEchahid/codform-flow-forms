
/**
 * Shopify API Proxy Endpoint
 * This endpoint serves as a proxy between the frontend and the Shopify API
 * to avoid CORS issues with direct API calls from the browser.
 */
export async function POST(request: Request) {
  try {
    // Extract the required data from the request body
    const body = await request.json();
    const { shop, accessToken, query, variables, timestamp, requestId } = body;

    if (!shop || !accessToken || !query) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: shop, accessToken, and query are required' 
        }), 
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // Ensure shop domain is formatted correctly
    const normalizedShopDomain = shop.includes('myshopify.com') 
      ? shop 
      : `${shop}.myshopify.com`;

    console.log(`Proxying GraphQL request to Shopify for shop: ${normalizedShopDomain}`);
    
    // Log request information
    console.log('Request details:', {
      shopDomain: normalizedShopDomain,
      queryFirstChars: query.substring(0, 50) + '...',
      timestamp: timestamp || 'not provided',
      requestId: requestId || 'not provided',
      accessTokenPresent: accessToken ? true : false,
      accessTokenLength: accessToken ? accessToken.length : 0,
      requestTime: new Date().toISOString()
    });
    
    try {
      const response = await fetch(`https://${normalizedShopDomain}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        body: JSON.stringify({ query, variables }),
        // إضافة خيارات لمنع التخزين المؤقت
        cache: 'no-store',
      });

      // Check if response is JSON by examining content-type header
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received from Shopify API:', contentType);
        const responseText = await response.text();
        console.error('Response text (first 500 chars):', responseText.substring(0, 500));
        
        // If the response contains <!DOCTYPE html> or similar, it's likely an authentication error
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          return new Response(
            JSON.stringify({ 
              error: 'Authentication error with Shopify API',
              details: 'The server returned an HTML page instead of JSON data. This usually indicates an invalid access token or incorrect shop domain.',
              statusCode: response.status,
              contentType: contentType || 'unknown'
            }),
            { 
              status: 401,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
              }
            }
          );
        }
        
        // Generic non-JSON response error
        return new Response(
          JSON.stringify({ 
            error: 'Invalid response from Shopify API - expected JSON but received HTML/text',
            details: 'The server returned non-JSON content, which may indicate an authentication error or invalid shop domain',
            statusCode: response.status,
            contentType: contentType || 'unknown'
          }),
          { 
            status: 502,
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            }
          }
        );
      }

      // Parse the Shopify response
      const data = await response.json();
      
      // Return the Shopify response data
      return new Response(
        JSON.stringify(data),
        { 
          status: response.status,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    } catch (fetchError) {
      console.error('Error making request to Shopify API:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to communicate with Shopify API',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }
  } catch (error) {
    console.error('Error in Shopify proxy handler:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Server error processing request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}

export function GET() {
  return new Response(
    JSON.stringify({ message: 'This endpoint only accepts POST requests' }),
    { 
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    }
  );
}
