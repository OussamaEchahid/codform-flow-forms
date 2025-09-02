import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { buildCorsHeaders } from "../_shared/cors.ts";

interface ChangePlanPayload {
  shop: string;
  planId: 'free' | 'basic' | 'premium';
}

const GRAPHQL_API_VERSION = '2025-07';

const planPricing: Record<string, { amount: number; currency: string; name: string }> = {
  basic: { amount: 1185, currency: 'USD', name: 'Basic Plan' }, // $11.85
  premium: { amount: 2285, currency: 'USD', name: 'Premium Plan' }, // $22.85
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { shop, planId } = (await req.json()) as ChangePlanPayload;
    if (!shop || !planId) {
      return new Response(JSON.stringify({ error: 'Missing shop or planId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    // Free plan: just update DB
    if (planId === 'free') {
      const { error } = await supabase.rpc('upgrade_shop_plan', { p_shop_domain: shop, p_new_plan: 'free' });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // For paid plans, create a Shopify subscription and return confirmation URL
    // Fetch access token for the shop
    const { data: storeRow, error: storeError } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('shop', shop)
      .maybeSingle();

    if (storeError) throw storeError;
    if (!storeRow?.access_token) {
      return new Response(JSON.stringify({ error: 'Shop access token not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const token = storeRow.access_token as string;
    const pricing = planPricing[planId];
    if (!pricing) {
      return new Response(JSON.stringify({ error: 'Unsupported plan' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Detect if this is a partner development store so we can set test=true
    // Multiple detection methods for better reliability
    let isDevStore = false;

    // Method 1: Check if shop domain ends with .myshopify.com (development stores)
    const isDomainBasedDevStore = shop.includes('.myshopify.com');

    // Method 2: Query shop plan for partnerDevelopment flag
    const shopQuery = `#graphql
      query { shop { plan { partnerDevelopment } } }
    `;
    const planResp = await fetch(`https://${shop}/admin/api/${GRAPHQL_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query: shopQuery })
    });

    let isPlanBasedDevStore = false;
    if (planResp.ok) {
      const planJson = await planResp.json();
      isPlanBasedDevStore = !!planJson?.data?.shop?.plan?.partnerDevelopment;
    } else {
      console.warn(`⚠️ Failed to detect shop plan (HTTP ${planResp.status}). Using domain-based detection.`);
    }

    // Consider it a dev store if either method indicates it
    isDevStore = isDomainBasedDevStore || isPlanBasedDevStore;

    console.log(`🔍 Development store detection:
      - Domain-based (.myshopify.com): ${isDomainBasedDevStore}
      - Plan-based (partnerDevelopment): ${isPlanBasedDevStore}
      - Final result: ${isDevStore}`);

    // Allow forcing test mode via environment variable for easier dev testing
    const forceTest = (globalThis.Deno && globalThis.Deno.env.get('SHOPIFY_BILLING_FORCE_TEST') === 'true');

    const returnUrl = `${supabaseUrl}/functions/v1/subscription-success?shop=${encodeURIComponent(shop)}&plan=${encodeURIComponent(planId)}`;

    const mutation = `#graphql
      mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!, $test: Boolean, $replacementBehavior: AppSubscriptionReplacementBehavior) {
        appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test, replacementBehavior: $replacementBehavior) {
          userErrors { field message }
          confirmationUrl
          appSubscription { id }
        }
      }
    `;

    const variables = {
      name: pricing.name,
      returnUrl,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: { amount: (pricing.amount / 100), currencyCode: pricing.currency },
              interval: 'EVERY_30_DAYS',
            },
          },
        },
      ],
      test: (forceTest || isDevStore),
      replacementBehavior: 'APPLY_IMMEDIATELY',
    };

    console.log(`📞 Creating subscription for shop: ${shop}, plan: ${planId}`);
    console.log(`🧪 Test mode settings:
      - Force test: ${forceTest}
      - Is dev store: ${isDevStore}
      - Final test value: ${forceTest || isDevStore}`);
    console.log(`📋 Subscription variables:`, JSON.stringify(variables, null, 2));

    const resp = await fetch(`https://${shop}/admin/api/${GRAPHQL_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    if (!resp.ok) {
      console.error(`❌ HTTP error: ${resp.status} ${resp.statusText}`);
      throw new Error(`Shopify API error: ${resp.status} ${resp.statusText}`);
    }

    const json = await resp.json();
    console.log('📋 Shopify API response:', JSON.stringify(json, null, 2));

    const sub = json?.data?.appSubscriptionCreate;
    if (sub?.userErrors?.length) {
      console.error('❌ Shopify billing errors:', sub.userErrors);
      return new Response(JSON.stringify({
        error: 'Subscription creation failed',
        details: sub.userErrors,
        suggestion: 'Please ensure your app has the correct billing permissions in Shopify Partners Dashboard'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const confirmationUrl = sub?.confirmationUrl;
    if (!confirmationUrl) {
      return new Response(JSON.stringify({ error: 'No confirmation URL returned by Shopify' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Mark subscription request as pending in DB WITHOUT changing active plan
    await supabase.from('shop_subscriptions').upsert({
      shop_domain: shop,
      requested_plan_type: planId,
      requested_at: new Date().toISOString(),
      status: 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'shop_domain' });

    return new Response(JSON.stringify({ url: confirmationUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('change-plan error:', message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
