
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const PLACEHOLDER_TOKEN = 'placeholder_token';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = `update_token_${Math.random().toString(36).substring(2, 8)}`;
  console.log(`[${requestId}] Token update request received`);

  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error(`[${requestId}] Failed to parse request body:`, e);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { shop, token } = body;

    if (!shop || !token) {
      console.error(`[${requestId}] Missing required parameters: shop=${!!shop}, token=${!!token}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: shop and token' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Don't allow placeholder tokens
    if (token === PLACEHOLDER_TOKEN) {
      console.error(`[${requestId}] Attempted to set placeholder token for ${shop}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot set placeholder_token as a valid token' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalize shop domain
    const normalizedShopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
    console.log(`[${requestId}] Updating token for shop: ${normalizedShopDomain}`);

    // Test the token first to make sure it's valid
    try {
      console.log(`[${requestId}] Testing token validity before updating`);
      const testResponse = await fetch(`https://${normalizedShopDomain}/admin/api/2023-10/shop.json`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token
        }
      });

      if (!testResponse.ok) {
        console.error(`[${requestId}] Token validation failed with status ${testResponse.status}`);
        return new Response(
          JSON.stringify({ success: false, error: `Invalid token. Shopify API returned status ${testResponse.status}` }),
          { headers: corsHeaders }
        );
      }

      // Parse the response to further validate
      const shopData = await testResponse.json();
      if (!shopData || !shopData.shop) {
        console.error(`[${requestId}] Invalid response format from Shopify API during token test`);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid response from Shopify API during token validation' }),
          { headers: corsHeaders }
        );
      }

      console.log(`[${requestId}] Token validated successfully for shop: ${normalizedShopDomain}`);
    } catch (testError) {
      console.error(`[${requestId}] Error testing token:`, testError);
      return new Response(
        JSON.stringify({ success: false, error: `Error validating token: ${testError.message || 'Unknown error'}` }),
        { headers: corsHeaders }
      );
    }

    // Token is valid, update in database
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://mtyfuwdsshlzqwjujavp.supabase.co';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Check if the store exists
      const { data: existingStore, error: queryError } = await supabase
        .from('shopify_stores')
        .select('id')
        .eq('shop', normalizedShopDomain)
        .limit(1);

      if (queryError) {
        throw queryError;
      }

      let result;
      if (!existingStore || existingStore.length === 0) {
        // Create new store
        result = await supabase
          .from('shopify_stores')
          .insert({
            shop: normalizedShopDomain,
            access_token: token,
            token_type: 'offline',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        console.log(`[${requestId}] Created new store entry for ${normalizedShopDomain}`);
      } else {
        // Update existing store
        result = await supabase
          .from('shopify_stores')
          .update({
            access_token: token,
            token_type: 'offline',
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('shop', normalizedShopDomain);
        
        console.log(`[${requestId}] Updated existing store entry for ${normalizedShopDomain}`);
      }

      if (result.error) {
        throw result.error;
      }

      // Clear any placeholder tokens
      try {
        await supabase
          .from('shopify_stores')
          .update({ access_token: null })
          .eq('access_token', PLACEHOLDER_TOKEN);
        
        console.log(`[${requestId}] Cleared any placeholder tokens`);
      } catch (cleanupError) {
        console.error(`[${requestId}] Error cleaning placeholder tokens:`, cleanupError);
        // Non-fatal error, continue
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Token updated successfully',
          shop: normalizedShopDomain
        }),
        { headers: corsHeaders }
      );
    } catch (dbError) {
      console.error(`[${requestId}] Database error:`, dbError);
      return new Response(
        JSON.stringify({ success: false, error: `Database error: ${dbError.message || 'Unknown error'}` }),
        { headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: `Unexpected error: ${error.message || 'Unknown error'}` }),
      { headers: corsHeaders }
    );
  }
});
