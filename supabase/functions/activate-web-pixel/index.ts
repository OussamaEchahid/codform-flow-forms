import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = Math.random().toString(36).slice(2, 8);

  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    let { shop, accountID } = body as { shop?: string; accountID?: string };

    if (!shop) {
      return new Response(JSON.stringify({ success: false, error: 'MISSING_SHOP', message: 'shop is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normalize shop domain
    if (!shop.includes('.myshopify.com')) {
      shop = `${shop}.myshopify.com`;
    }

    // Default accountID to codmagnet.com if not provided
    if (!accountID || String(accountID).trim().length === 0) {
      accountID = 'codmagnet.com';
    }

    console.log(`[${requestId}] Activating web pixel for shop=${shop}, accountID=${accountID}`);

    // Fetch access token for the store
    const { data: store, error: storeError } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('shop', shop)
      .single();

    if (storeError) {
      console.error(`[${requestId}] DB error`, storeError);
      return new Response(JSON.stringify({ success: false, error: 'DB_ERROR', message: storeError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!store?.access_token) {
      return new Response(JSON.stringify({ success: false, error: 'MISSING_TOKEN', message: 'Store access token not found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build GraphQL request
    const graphqlUrl = `https://${shop}/admin/api/2025-04/graphql.json`;
    const query = `mutation webPixelCreate($settings: JSON!) {\n  webPixelCreate(webPixel: { settings: $settings }) {\n    userErrors { field message }\n    webPixel { id settings }\n  }\n}`;

    const variables = {
      settings: { accountID },
    };
    const shopifyResp = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': store.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await shopifyResp.json().catch(() => null);

    // Shopify GraphQL قد يعيد status 200 مع أخطاء في الحقل errors
    if (json?.errors && Array.isArray(json.errors) && json.errors.length > 0) {
      console.error(`[${requestId}] Shopify GraphQL errors`, json.errors);
      return new Response(JSON.stringify({
        success: false,
        error: 'GRAPHQL_ERRORS',
        message: json.errors[0]?.message || 'GraphQL returned errors',
        errors: json.errors,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!shopifyResp.ok) {
      console.error(`[${requestId}] Shopify error status`, shopifyResp.status, json);
      return new Response(JSON.stringify({
        success: false,
        error: 'SHOPIFY_ERROR',
        status: shopifyResp.status,
        message: json?.errors?.[0]?.message || shopifyResp.statusText,
        raw: json,
      }), { status: shopifyResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const result = json?.data?.webPixelCreate;
    const userErrors = result?.userErrors || [];

    if (userErrors.length > 0) {
      const msg = userErrors.map((e: any) => e.message).join('; ');
      console.warn(`[${requestId}] webPixelCreate userErrors`, userErrors);
      return new Response(JSON.stringify({ success: false, error: 'USER_ERRORS', message: msg, userErrors, raw: json }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const created = result?.webPixel;

    console.log(`[${requestId}] Web pixel created`, created);
    return new Response(JSON.stringify({ success: true, webPixel: created }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Unhandled error', err);
    return new Response(JSON.stringify({ success: false, error: 'UNHANDLED', message: err?.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});