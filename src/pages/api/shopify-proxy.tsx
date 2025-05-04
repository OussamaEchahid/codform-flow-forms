
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
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store',
          }
        }
      );
    }

    // Ensure shop domain is formatted correctly
    const normalizedShopDomain = shop.includes('myshopify.com') 
      ? shop 
      : `${shop}.myshopify.com`;

    console.log(`Proxying GraphQL request to Shopify for shop: ${normalizedShopDomain}`);
    
    // Determine token type and set up appropriate API path
    const isAdminToken = accessToken.startsWith('shpat_');
    const apiPath = isAdminToken 
      ? '/admin/api/2024-01/graphql.json' 
      : '/admin/api/2024-01/graphql.json'; // Same path, different token type
    
    // Log request information with additional debug info
    console.log('Request details:', {
      shopDomain: normalizedShopDomain,
      queryFirstChars: query.substring(0, 50) + '...',
      timestamp: timestamp || 'not provided',
      requestId: requestId || 'not provided',
      accessTokenPresent: accessToken ? true : false,
      accessTokenLength: accessToken ? accessToken.length : 0,
      accessTokenFirstChars: accessToken ? accessToken.substring(0, 5) + '...' : 'none',
      accessTokenType: isAdminToken ? 'admin' : 'offline',
      requestTime: new Date().toISOString(),
      apiPath: apiPath,
      uniqueId: Math.random().toString(36).substring(2, 9) // Add unique ID to prevent any caching
    });
    
    try {
      // Generate a unique cache-busting URL with timestamp and random string
      const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const response = await fetch(`https://${normalizedShopDomain}${apiPath}?cb=${cacheBuster}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Request-ID': requestId || Math.random().toString(36).substring(2, 15),
        },
        body: JSON.stringify({ query, variables }),
        cache: 'no-store',
      });

      // Check if response is JSON by examining content-type header
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received from Shopify API:', contentType);
        const responseText = await response.text();
        console.error('Response text (first 500 chars):', responseText.substring(0, 500));
        
        // Detect authentication errors more accurately
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html') || response.status === 401 || response.status === 403) {
          return new Response(
            JSON.stringify({ 
              error: 'Authentication error with Shopify API',
              details: 'Your access token is invalid or has expired. Please reconnect your Shopify store.',
              statusCode: response.status,
              contentType: contentType || 'unknown',
              errorType: 'token_expired',
              tokenType: isAdminToken ? 'admin' : 'offline',
              timestamp: Date.now()
            }),
            { 
              status: 401,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
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
            contentType: contentType || 'unknown',
            errorType: 'invalid_response',
            timestamp: Date.now()
          }),
          { 
            status: 502,
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0',
            }
          }
        );
      }

      // Parse the Shopify response
      const data = await response.json();
      
      // Check for GraphQL errors that might indicate token issues
      if (data.errors) {
        const errorMessages = data.errors.map((err: any) => err.message).join(', ');
        console.log('GraphQL errors received:', errorMessages);
        
        // Check if any errors are related to authentication
        if (errorMessages.toLowerCase().includes('access') || 
            errorMessages.toLowerCase().includes('token') || 
            errorMessages.toLowerCase().includes('auth') ||
            errorMessages.toLowerCase().includes('unauthorized')) {
          
          return new Response(
            JSON.stringify({ 
              error: 'Shopify API authentication error',
              details: 'Your access token may have expired. Please reconnect your Shopify store.',
              errorMessages,
              errorType: 'token_expired',
              tokenType: isAdminToken ? 'admin' : 'offline',
              timestamp: Date.now()
            }),
            { 
              status: 401,
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
              }
            }
          );
        }
      }
      
      // Return the Shopify response data
      return new Response(
        JSON.stringify(data),
        { 
          status: response.status,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
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
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          errorType: 'api_communication_error',
          timestamp: Date.now()
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
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
        details: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'server_error',
        timestamp: Date.now()
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    }
  );
}
