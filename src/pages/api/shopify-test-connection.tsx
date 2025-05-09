
/**
 * API route for testing Shopify connection
 * This provides a client-side method to test connection without exposing tokens
 */
import { shopifySupabase } from '@/lib/shopify/supabase-client';

export async function GET(request: Request) {
  try {
    // Extract parameters
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    const forceRefresh = url.searchParams.get('force') === 'true';
    
    console.log(`[shopify-test-connection] Testing connection for shop: ${shop}, force: ${forceRefresh}`);
    
    if (!shop) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: shop' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate a unique request identifier for tracking in logs
    const requestId = `api_test_${Math.random().toString(36).substring(2, 10)}`;
    
    // Call the edge function for testing
    const { data, error } = await shopifySupabase.functions.invoke('shopify-test-connection', {
      body: {
        shop,
        forceRefresh,
        requestId
      }
    });

    if (error) {
      console.error('[shopify-test-connection] Error invoking function:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Error testing connection', 
          details: error.message,
          success: false
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Return result
    return new Response(
      JSON.stringify({
        ...data,
        apiSource: 'local-route'
      }), 
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('[shopify-test-connection] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
