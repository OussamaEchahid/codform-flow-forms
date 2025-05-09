
/**
 * API route for fetching Shopify access token
 * This provides a method for the client to get the token without exposing it in the frontend
 */
import { shopifyStores } from '@/lib/shopify/supabase-client';

export async function GET(request: Request) {
  try {
    // Extract shop from URL parameters
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    const debug = url.searchParams.get('debug') === 'true';

    console.log(`[shopify-token] Request received for shop: ${shop}`);

    if (!shop) {
      console.error('[shopify-token] Missing shop parameter');
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: shop' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get token from database
    try {
      const { data, error } = await shopifyStores()
        .select('access_token, updated_at')
        .eq('shop', shop)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('[shopify-token] Database error fetching token:', error);
        return new Response(
          JSON.stringify({ error: 'Database error fetching token', details: error.message }), 
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (!data || data.length === 0 || !data[0].access_token) {
        console.error(`[shopify-token] No token found for shop: ${shop}`);
        return new Response(
          JSON.stringify({ error: 'No token found for this shop' }), 
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const tokenAge = new Date().getTime() - new Date(data[0].updated_at).getTime();
      const tokenAgeHours = Math.floor(tokenAge / (1000 * 60 * 60));
      
      if (debug) {
        console.log(`[shopify-token] Token found for ${shop}. Token age: ${tokenAgeHours} hours`);
      }
      
      // Check if token is a placeholder for debugging
      if (data[0].access_token === 'placeholder_token') {
        console.warn(`[shopify-token] Warning: Placeholder token detected for shop: ${shop}`);
      }

      // Return access token
      return new Response(
        JSON.stringify({ 
          accessToken: data[0].access_token,
          shop,
          tokenAge: tokenAgeHours
        }), 
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          }
        }
      );
    } catch (dbError) {
      console.error('[shopify-token] Error querying database:', dbError);
      return new Response(
        JSON.stringify({ error: 'Database query error', details: dbError instanceof Error ? dbError.message : 'Unknown error' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('[shopify-token] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
