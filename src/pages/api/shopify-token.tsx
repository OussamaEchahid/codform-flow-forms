
/**
 * API route to securely fetch Shopify access tokens
 * This acts as a middleware to securely retrieve tokens from the database
 */
export async function GET(request: Request) {
  try {
    // Extract shop from URL parameters
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    const debug = url.searchParams.get('debug') === 'true';

    if (!shop) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameter: shop' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Normalize shop domain if needed
    const normalizedShop = shop.includes('myshopify.com') ? shop : `${shop}.myshopify.com`;
    
    // Handle dev mode special cases
    const isDevStore = ['test-store', 'myteststore', 'astrem'].some(
      testName => normalizedShop.toLowerCase().includes(testName.toLowerCase())
    );
    
    if (isDevStore || process.env.NODE_ENV === 'development') {
      console.log('Development mode detected, using test token');
      return new Response(
        JSON.stringify({ 
          accessToken: 'shpat_test_token_for_dev_environment',
          shop: normalizedShop,
          isDev: true
        }), 
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For production, fetch the real token from Supabase
    const SUPABASE_URL = 'https://mtyfuwdsshlzqwjujavp.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg';
    
    // Create a minimal fetch-based client since we don't want to import the full Supabase client here
    const response = await fetch(`${SUPABASE_URL}/rest/v1/shopify_stores?shop=eq.${encodeURIComponent(normalizedShop)}&select=access_token,is_active&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Database error: ${response.status} - ${errorText}`);
    }
    
    const stores = await response.json();
    
    if (!stores || stores.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Store not found in database' 
        }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const store = stores[0];
    
    if (!store.access_token || store.access_token === 'placeholder_token') {
      return new Response(
        JSON.stringify({ 
          error: 'No valid access token available' 
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        accessToken: store.access_token,
        isActive: store.is_active,
        shop: normalizedShop
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching Shopify token:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
