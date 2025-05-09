
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
      const response = await fetch(`https://${shopDomain}/admin/api/2023-10/shop.json`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
          // Prevent caching
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        // Add cache busting query param
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Shopify API returned ${response.status}: ${await response.text()}`);
      }

      const shopData = await response.json();
      const shopName = shopData.shop?.name || 'unknown';

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
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      console.error(`Error testing connection:`, error);

      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to connect to Shopify API: ${error.message}`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,  // Unauthorized if token is invalid
        }
      );
    }
  } catch (error) {
    console.error(`Unhandled server error:`, error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Server error: ${error.message}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/shopify-test-connection' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"shop":"example.myshopify.com","accessToken":"shpat_..."}'
