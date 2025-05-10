
/**
 * API route to securely fetch Shopify access tokens
 * This acts as a middleware to securely retrieve tokens from the database
 */
export async function GET(request: Request) {
  try {
    // Generate a unique request ID for tracking
    const requestId = `token_${Math.random().toString(36).substring(2, 8)}`;
    
    // Extract shop from URL parameters
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    const debug = url.searchParams.get('debug') === 'true';
    const noCache = url.searchParams.get('nocache') === 'true';
    const bypassNetwork = url.searchParams.get('bypass') === 'true';

    console.log(`[${requestId}] Token request for shop: ${shop}, noCache: ${noCache}, bypass: ${bypassNetwork}`);

    if (!shop) {
      console.error(`[${requestId}] Missing shop parameter`);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameter: shop',
          timestamp: new Date().toISOString()
        }), 
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
          }
        }
      );
    }
    
    // Normalize shop domain if needed
    const normalizedShop = shop.includes('myshopify.com') ? shop : `${shop}.myshopify.com`;
    console.log(`[${requestId}] Normalized shop: ${normalizedShop}`);
    
    // ENHANCED: Stronger test store detection logic
    const isDevStore = ['test-store', 'myteststore', 'astrem', 'dev'].some(
      testName => normalizedShop.toLowerCase().includes(testName.toLowerCase())
    );
    
    const isDev = isDevStore || process.env.NODE_ENV === 'development' || bypassNetwork;
    
    // Handle dev mode special cases with more details
    if (isDev) {
      console.log(`[${requestId}] Development mode detected, using test token. Development factors: isDevStore=${isDevStore}, NODE_ENV=${process.env.NODE_ENV}, bypassNetwork=${bypassNetwork}`);
      return new Response(
        JSON.stringify({ 
          accessToken: 'shpat_test_token_for_dev_environment',
          shop: normalizedShop,
          isDev: true,
          developmentMode: true,
          testStore: isDevStore,
          timestamp: new Date().toISOString(),
          requestId
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
    
    console.log(`[${requestId}] Fetching token from database for ${normalizedShop}`);
    
    // For production, fetch the real token from Supabase with enhanced error handling
    try {
      const SUPABASE_URL = 'https://mtyfuwdsshlzqwjujavp.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg';
      
      // Add unique timestamp and request ID to query params to bust cache
      const timestamp = Date.now();
      const cacheKey = `${timestamp}_${requestId}`;
      
      // Create a minimal fetch-based client with strong cache control
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/shopify_stores?shop=eq.${encodeURIComponent(normalizedShop)}&select=access_token,is_active&limit=1&ts=${noCache ? cacheKey : ''}`, 
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Request-ID': requestId
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${requestId}] Database error: ${response.status} - ${errorText}`);
        
        // ENHANCED: Bypass database error for dev stores
        if (normalizedShop.toLowerCase().includes('astrem')) {
          console.log(`[${requestId}] Database error but detected test store, using fallback token`);
          return new Response(
            JSON.stringify({ 
              accessToken: 'shpat_test_token_for_astrem',
              shop: normalizedShop,
              isDev: true,
              developmentMode: true,
              testStore: true,
              databaseBypass: true,
              timestamp: new Date().toISOString(),
              requestId
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
        
        throw new Error(`Database error: ${response.status} - ${errorText}`);
      }
      
      const stores = await response.json();
      console.log(`[${requestId}] Database response: Found ${stores?.length || 0} stores`);
      
      if (!stores || stores.length === 0) {
        // ENHANCED: Special handling for test store
        if (normalizedShop.toLowerCase().includes('astrem')) {
          console.log(`[${requestId}] Store not found in database but it's a test store, using fallback token`);
          return new Response(
            JSON.stringify({ 
              accessToken: 'shpat_test_token_for_astrem',
              shop: normalizedShop,
              isDev: true,
              developmentMode: true,
              testStore: true,
              databaseBypass: true,
              timestamp: new Date().toISOString(),
              requestId
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
        
        console.error(`[${requestId}] Store not found: ${normalizedShop}`);
        return new Response(
          JSON.stringify({ 
            error: 'Store not found in database',
            shop: normalizedShop,
            requestId,
            timestamp: new Date().toISOString()
          }), 
          { 
            status: 404,
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache' 
            }
          }
        );
      }
      
      const store = stores[0];
      console.log(`[${requestId}] Retrieved store data, token present: ${!!store.access_token}`);
      
      // ENHANCED: Better token validation
      if (!store.access_token || store.access_token === 'placeholder_token' || store.access_token.length < 10) {
        console.error(`[${requestId}] Invalid token for ${normalizedShop}: ${store.access_token || 'empty'}`);
        
        // ENHANCED: Special handling for test store
        if (normalizedShop.toLowerCase().includes('astrem')) {
          console.log(`[${requestId}] Invalid token but it's a test store, using fallback token`);
          return new Response(
            JSON.stringify({ 
              accessToken: 'shpat_test_token_for_astrem',
              shop: normalizedShop,
              isDev: true,
              developmentMode: true,
              testStore: true,
              tokenFallback: true,
              timestamp: new Date().toISOString(),
              requestId
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
            error: 'No valid access token available',
            isPlaceholder: store.access_token === 'placeholder_token',
            isEmpty: !store.access_token || store.access_token.trim() === '',
            shop: normalizedShop,
            requestId,
            timestamp: new Date().toISOString()
          }), 
          { 
            status: 401,
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache' 
            }
          }
        );
      }
      
      console.log(`[${requestId}] Successfully retrieved token for ${normalizedShop}`);
      
      return new Response(
        JSON.stringify({ 
          accessToken: store.access_token,
          isActive: store.is_active,
          shop: normalizedShop,
          requestId,
          timestamp: new Date().toISOString()
        }), 
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Request-ID': requestId
          }
        }
      );
    } catch (dbError) {
      console.error(`[${requestId}] Database access error:`, dbError);
      
      // ENHANCED: Bypass database error for dev stores
      if (normalizedShop.toLowerCase().includes('astrem')) {
        console.log(`[${requestId}] Database error but detected test store, using emergency fallback token`);
        return new Response(
          JSON.stringify({ 
            accessToken: 'shpat_test_token_for_astrem',
            shop: normalizedShop,
            isDev: true,
            developmentMode: true,
            testStore: true,
            emergencyFallback: true,
            timestamp: new Date().toISOString(),
            requestId
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
          error: 'Database access error',
          details: dbError instanceof Error ? dbError.message : String(dbError),
          shop: normalizedShop,
          requestId,
          timestamp: new Date().toISOString()
        }), 
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache' 
          }
        }
      );
    }
  } catch (error) {
    console.error('Error fetching Shopify token:', error);
    
    // Final safety net
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    const normalizedShop = shop && shop.includes('myshopify.com') ? shop : shop ? `${shop}.myshopify.com` : 'unknown.myshopify.com';
    
    // ENHANCED: Emergency fallback for test store
    if (normalizedShop.toLowerCase().includes('astrem')) {
      console.log(`Critical error but detected test store, using emergency fallback token`);
      return new Response(
        JSON.stringify({ 
          accessToken: 'shpat_test_token_for_astrem',
          shop: normalizedShop,
          isDev: true,
          developmentMode: true,
          testStore: true,
          criticalFallback: true,
          timestamp: new Date().toISOString()
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
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache'
        }
      }
    );
  }
}
