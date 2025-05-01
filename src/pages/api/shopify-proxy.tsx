
import { supabase } from '@/integrations/supabase/client';

/**
 * Shopify API Proxy Endpoint
 * This endpoint serves as a proxy between the frontend and the Shopify API
 * to avoid CORS issues with direct API calls from the browser.
 */
export async function POST(request: Request) {
  try {
    // Extract the required data from the request body
    const body = await request.json();
    const { shop, accessToken, query, variables } = body;

    if (!shop || !accessToken || !query) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: shop, accessToken, and query are required' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Ensure shop domain is formatted correctly
    const normalizedShopDomain = shop.includes('myshopify.com') 
      ? shop 
      : `${shop}.myshopify.com`;

    console.log(`Proxying GraphQL request to Shopify for shop: ${normalizedShopDomain}`);
    
    // Make the actual request to Shopify's GraphQL API
    const shopifyUrl = `https://${normalizedShopDomain}/admin/api/2024-01/graphql.json`;
    
    try {
      const response = await fetch(shopifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({ query, variables }),
      });

      // Check if response is JSON by examining content-type header
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received from Shopify API:', contentType);
        const responseText = await response.text();
        console.error('Response text (first 200 chars):', responseText.substring(0, 200));
        
        return new Response(
          JSON.stringify({ 
            error: 'Invalid response from Shopify API - expected JSON but received HTML/text',
            details: 'The server returned HTML instead of JSON, which may indicate an authentication error or invalid shop domain',
            statusCode: response.status,
            contentType: contentType || 'unknown'
          }),
          { 
            status: 502,
            headers: { 'Content-Type': 'application/json' }
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
          headers: { 'Content-Type': 'application/json' }
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
          headers: { 'Content-Type': 'application/json' }
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
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export function GET() {
  return new Response(
    JSON.stringify({ message: 'This endpoint only accepts POST requests' }),
    { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
