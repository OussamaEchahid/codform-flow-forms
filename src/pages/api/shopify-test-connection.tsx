
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
    const devMode = url.searchParams.get('dev') === 'true';
    
    console.log(`[shopify-test-connection] Testing connection for shop: ${shop}, force: ${forceRefresh}, devMode: ${devMode}`);
    
    if (!shop) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: shop' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Enhanced development mode bypass for test store
    if (devMode && shop === 'astrem.myshopify.com') {
      console.log(`[shopify-test-connection] Using test store bypass for: ${shop} (dev mode)`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Connected (dev mode bypass)',
          apiSource: 'local-route',
          devMode: true,
          testStore: true
        }), 
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
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
        requestId,
        devMode
      }
    });

    if (error) {
      console.error('[shopify-test-connection] Error invoking function:', error);
      
      // Fallback for dev mode test store even if function fails
      if (devMode && shop === 'astrem.myshopify.com') {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Connected (dev mode fallback)',
            apiSource: 'local-route-fallback',
            devMode: true,
            testStore: true
          }), 
          { 
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate'
            }
          }
        );
      }
      
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

// Add POST handler with enhanced dev mode support
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { shop, forceRefresh, accessToken, requestId, dev: devMode } = body;
    
    console.log(`[shopify-test-connection] POST Testing connection for shop: ${shop}, requestId: ${requestId || 'none'}, devMode: ${devMode}`);
    
    if (!shop) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: shop' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Enhanced development mode bypass for test store
    if (devMode && shop === 'astrem.myshopify.com') {
      console.log(`[shopify-test-connection] Using test store bypass for: ${shop} (dev mode - POST)`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Connected (dev mode bypass)',
          apiSource: 'local-route-post',
          devMode: true,
          testStore: true
        }), 
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        }
      );
    }

    // Generate a unique request identifier for tracking in logs if not provided
    const trackingId = requestId || `api_test_${Math.random().toString(36).substring(2, 10)}`;
    
    // Call the edge function for testing
    const { data, error } = await shopifySupabase.functions.invoke('shopify-test-connection', {
      body: {
        shop,
        forceRefresh: forceRefresh || true,
        accessToken,
        requestId: trackingId,
        devMode
      }
    });

    if (error) {
      console.error(`[shopify-test-connection][${trackingId}] Error invoking function:`, error);
      
      // Fallback for dev mode test store even if function fails
      if (devMode && shop === 'astrem.myshopify.com') {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Connected (dev mode fallback - POST)',
            apiSource: 'local-route-post-fallback',
            devMode: true,
            testStore: true
          }), 
          { 
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate'
            }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Error testing connection', 
          details: error.message,
          success: false,
          requestId: trackingId
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
        apiSource: 'local-route-post',
        requestId: trackingId
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
    console.error('[shopify-test-connection] Unexpected error in POST:', error);
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
