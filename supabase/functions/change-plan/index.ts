import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsHeaders } from "../_shared/cors.ts";

interface ChangePlanPayload {
  shop: string;
  planId: 'free' | 'basic' | 'premium';
}

const GRAPHQL_API_VERSION = '2023-10';

const planPricing: Record<string, { amount: number; currency: string; name: string }> = {
  basic: { amount: 1185, currency: 'USD', name: 'Basic Plan' }, // $11.85
  premium: { amount: 2285, currency: 'USD', name: 'Premium Plan' }, // $22.85
};

serve(async (req) => {
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

    const origin = req.headers.get('origin') || 'https://codmagnet.com';
    const returnUrl = `${origin}/settings/plans`;

    const mutation = `#graphql
      mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!, $test: Boolean) {
        appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test) {
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
              price: { amount: (pricing.amount / 100).toFixed(2), currencyCode: pricing.currency },
              interval: 'EVERY_30_DAYS',
            },
          },
        },
      ],
      test: false,
    };

    console.log(`📞 Creating subscription for shop: ${shop}, plan: ${planId}`);
    
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
        status: 400,
      });
    }

    const confirmationUrl = sub?.confirmationUrl;
    if (!confirmationUrl) {
      return new Response(JSON.stringify({ error: 'No confirmation URL returned by Shopify' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Optionally mark subscription as pending in DB
    await supabase.from('shop_subscriptions').upsert({
      shop_domain: shop,
      plan_type: planId,
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
