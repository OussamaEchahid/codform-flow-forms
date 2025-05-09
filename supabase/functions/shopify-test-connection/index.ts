
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
}

interface RequestPayload {
  shop: string;
  accessToken: string;
  requestId?: string;
  timestamp?: number;
  forceRefresh?: boolean;
  maxRetries?: number;
  checkPermissions?: boolean;
}

// Required Shopify scopes for our application
const REQUIRED_SCOPES = [
  'write_products', 
  'read_products',
  'read_orders',
  'write_orders',
  'write_script_tags',
  'read_themes',
  'write_themes',
  'read_content',
  'write_content',
  // Metaobjects require this scope (not in our app yet)
  // 'write_metaobject_definitions'
];

// Helper to add retries for fetch requests
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Exponential backoff
      if (attempt > 0) {
        const delay = Math.min(100 * Math.pow(2, attempt), 2000);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const response = await fetch(url, options);
      
      // Retry on server errors (5xx)
      if (response.status >= 500 && response.status < 600 && attempt < maxRetries - 1) {
        console.log(`Server error: ${response.status}, will retry`);
        continue;
      }
      
      return response;
    } catch (error) {
      console.error(`Fetch attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // Only retry on network errors
      if (error instanceof TypeError || error.name === 'NetworkError') {
        if (attempt < maxRetries - 1) {
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error('All fetch attempts failed');
}

// Check if the token has all required permissions
async function checkTokenPermissions(shop: string, accessToken: string, requestId: string): Promise<{
  valid: boolean;
  missingScopes: string[];
  currentScopes: string[];
  hasMetaobjectPermission: boolean;
}> {
  try {
    console.log(`[${requestId}] Checking token permissions/scopes`);
    
    // Make a request to get the current access scopes
    const response = await fetchWithRetry(`https://${shop}/admin/oauth/access_scopes.json`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
        'Cache-Control': 'no-store',
      },
    }, 2);

    if (!response.ok) {
      console.error(`[${requestId}] Failed to get access scopes: ${response.status}`);
      return { 
        valid: false, 
        missingScopes: REQUIRED_SCOPES, 
        currentScopes: [],
        hasMetaobjectPermission: false
      };
    }

    const data = await response.json();
    const currentScopes = data.access_scopes.map((scope: any) => scope.handle);
    
    console.log(`[${requestId}] Current access scopes:`, currentScopes);
    
    // Check for metaobject permission specifically
    const hasMetaobjectPermission = currentScopes.includes('write_metaobject_definitions');
    
    // Check if all required scopes are present
    const missingScopes = REQUIRED_SCOPES.filter(scope => !currentScopes.includes(scope));
    
    if (missingScopes.length > 0) {
      console.log(`[${requestId}] Missing scopes:`, missingScopes);
      return { 
        valid: false, 
        missingScopes, 
        currentScopes,
        hasMetaobjectPermission
      };
    }
    
    return { 
      valid: true, 
      missingScopes: [], 
      currentScopes,
      hasMetaobjectPermission
    };
  } catch (error) {
    console.error(`[${requestId}] Error checking permissions:`, error);
    return { 
      valid: false, 
      missingScopes: REQUIRED_SCOPES, 
      currentScopes: [],
      hasMetaobjectPermission: false 
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestIdPart = Math.random().toString(36).substring(2, 8);

  try {
    // Parse request body
    let payload: RequestPayload;
    const contentType = req.headers.get('content-type') || '';
    
    try {
      if (contentType.includes('application/json')) {
        payload = await req.json();
      } else {
        // For GET requests or URL parameters
        const url = new URL(req.url);
        payload = {
          shop: url.searchParams.get('shop') || '',
          accessToken: url.searchParams.get('accessToken') || '',
          requestId: url.searchParams.get('requestId') || `req_test_${requestIdPart}`,
          forceRefresh: url.searchParams.get('forceRefresh') === 'true'
        };
      }
    } catch (parseError) {
      console.error('Error parsing request payload:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid request format',
          error: parseError instanceof Error ? parseError.message : 'Failed to parse request body'
        }),
        {
          headers: { ...corsHeaders },
          status: 400,
        }
      );
    }
    
    let { shop, accessToken, forceRefresh, checkPermissions } = payload;
    const requestId = payload.requestId || `req_test_${requestIdPart}`;
    const maxRetries = payload.maxRetries || 3;

    if (!shop) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing shop in request',
        }),
        {
          headers: { ...corsHeaders },
          status: 400,
        }
      );
    }

    console.log(`[${requestId}] Testing connection for shop: ${shop}`);

    // Normalize shop domain
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
    console.log(`[${requestId}] Using normalized shop domain: ${shopDomain}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error(`[${requestId}] Missing Supabase credentials`);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Server configuration error - missing database credentials',
        }),
        {
          headers: { ...corsHeaders },
          status: 500,
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If accessToken is not provided, try to get it from the database
    if (!accessToken) {
      try {
        console.log(`[${requestId}] No token provided, fetching from database`);
        
        const { data: tokenData, error: tokenError } = await supabase
          .from('shopify_stores')
          .select('access_token')
          .eq('shop', shopDomain)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1);
        
        if (tokenError || !tokenData || tokenData.length === 0) {
          console.error(`[${requestId}] Error fetching token:`, tokenError || "No token found");
          return new Response(
            JSON.stringify({
              success: false,
              message: 'No active token found for this shop',
            }),
            {
              headers: { ...corsHeaders },
              status: 404,
            }
          );
        }
        
        accessToken = tokenData[0].access_token;
        
        if (!accessToken) {
          console.error(`[${requestId}] Token is empty or invalid`);
          return new Response(
            JSON.stringify({
              success: false,
              message: 'No valid token found for this shop',
            }),
            {
              headers: { ...corsHeaders },
              status: 404,
            }
          );
        }
        
        console.log(`[${requestId}] Successfully retrieved token from database`);
      } catch (dbError) {
        console.error(`[${requestId}] Database error fetching token:`, dbError);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Error retrieving token from database',
            error: dbError instanceof Error ? dbError.message : String(dbError),
          }),
          {
            headers: { ...corsHeaders },
            status: 500,
          }
        );
      }
    }

    // Test access token by fetching shop info from Shopify
    try {
      // Add random cache-busting query parameter
      const cacheBuster = `?timestamp=${Date.now()}&_=${Math.random().toString(36).substring(2)}`;
      
      console.log(`[${requestId}] Making request to Shopify API to test connection`);
      
      const response = await fetchWithRetry(`https://${shopDomain}/admin/api/2023-10/shop.json${cacheBuster}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
          // Prevent caching
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }, maxRetries);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${requestId}] Shopify API error (${response.status}):`, errorText);
        
        // Special handling for common errors
        if (response.status === 401) {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Authentication failed - token is invalid or expired',
              status: response.status,
              tokenError: true,
              isTokenExpired: true
            }),
            {
              headers: { ...corsHeaders },
              status: 200, // Return 200 with error info in body
            }
          );
        }
        
        throw new Error(`Shopify API returned ${response.status}: ${errorText}`);
      }

      const shopData = await response.json();
      const shopName = shopData.shop?.name || 'unknown';
      
      console.log(`[${requestId}] Successfully connected to shop: ${shopName}`);
      
      // Check permissions if requested
      let permissionsResult = { 
        valid: true, 
        missingScopes: [], 
        currentScopes: [],
        hasMetaobjectPermission: true 
      };
      
      if (checkPermissions) {
        permissionsResult = await checkTokenPermissions(shopDomain, accessToken, requestId);
        console.log(`[${requestId}] Permissions check result:`, permissionsResult);
      }

      // Update shop record in database to mark as active
      if (forceRefresh) {
        try {
          const { error: updateError } = await supabase
            .from('shopify_stores')
            .update({
              access_token: accessToken,
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('shop', shopDomain);

          if (updateError) {
            console.error(`[${requestId}] Error updating shop in database:`, updateError);
          } else {
            console.log(`[${requestId}] Updated shop ${shopDomain} in database`);
          }
        } catch (updateError) {
          console.error(`[${requestId}] Exception updating database:`, updateError);
          // Don't fail the request if the update fails
        }
      }

      console.log(`[${requestId}] Connection test successful for shop: ${shopName}`);

      return new Response(
        JSON.stringify({
          success: true,
          shop: shopName,
          domain: shopDomain,
          permissions: checkPermissions ? {
            valid: permissionsResult.valid,
            missingScopes: permissionsResult.missingScopes,
            currentScopes: permissionsResult.currentScopes,
            hasMetaobjectPermission: permissionsResult.hasMetaobjectPermission
          } : undefined,
        }),
        {
          headers: { ...corsHeaders },
          status: 200,
        }
      );

    } catch (error) {
      console.error(`[${requestId}] Error testing connection:`, error);
      
      // Try to determine if it's a network error
      const isNetworkError = error instanceof TypeError || 
                            (error instanceof Error && (
                              error.message?.includes('Failed to fetch') || 
                              error.message?.includes('NetworkError') ||
                              error.name === 'TypeError'
                            ));
                            
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error testing connection: ${error instanceof Error ? error.message : String(error)}`,
          isNetworkError,
        }),
        {
          headers: { ...corsHeaders },
          status: 200, // Return 200 with error info in body
        }
      );
    }
  } catch (error) {
    console.error(`[${requestIdPart}] Error processing request:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error processing request: ${error instanceof Error ? error.message : String(error)}`,
      }),
      {
        headers: { ...corsHeaders },
        status: 500,
      }
    );
  }
});
