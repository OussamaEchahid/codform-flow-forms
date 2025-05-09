
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  shop: string;
  accessToken: string;
  requestId?: string;
  timestamp?: number;
  forceRefresh?: boolean;
  maxRetries?: number;
}

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
      if (error.name !== 'TypeError' && error.name !== 'NetworkError') {
        throw error;
      }
    }
  }
  
  throw lastError || new Error('All fetch attempts failed');
}

serve(async (req) => {
  console.log(`Initializing shopify-test-connection function`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Test connection request received:', req.url);

  try {
    // Parse request body
    const payload: RequestPayload = await req.json();
    let { shop, accessToken, forceRefresh } = payload;
    const requestId = payload.requestId || `req_test_${Math.random().toString(36).substring(2, 8)}`;
    const maxRetries = payload.maxRetries || 3;

    if (!shop || !accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing shop or accessToken in request',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
    const supabase = createClient(supabaseUrl, supabaseKey);

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
        throw new Error(`Shopify API returned ${response.status}: ${errorText}`);
      }

      const shopData = await response.json();
      const shopName = shopData.shop?.name || 'unknown';
      
      console.log(`[${requestId}] Successfully connected to shop: ${shopName}`);

      // Update shop record in database to mark as active
      if (forceRefresh) {
        const { data: updateData, error: updateError } = await supabase
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
      }

      console.log(`[${requestId}] Connection test successful for shop: ${shopName}`);

      return new Response(
        JSON.stringify({
          success: true,
          shop: shopName,
          domain: shopDomain,
          details: shopData.shop
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      console.error(`[${requestId}] Error testing connection:`, error);

      // Determine if this is an authorization error or something else
      const errorMessage = error.message || 'Unknown error';
      const status = errorMessage.includes('401') ? 401 : 
                     errorMessage.includes('403') ? 403 : 
                     errorMessage.includes('429') ? 429 : 500;

      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to connect to Shopify API: ${errorMessage}`,
          errorType: status === 401 || status === 403 ? 'auth' : 
                    status === 429 ? 'rate_limit' : 'server',
          status
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status,
        }
      );
    }
  } catch (error) {
    console.error(`Unhandled server error:`, error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Server error: ${error.message}`,
        errorType: 'server'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
