import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface ChangePlanPayload {
  shop: string;
  planId: 'free' | 'basic' | 'premium';
}

const GRAPHQL_API_VERSION = '2025-04';

const planPricing: Record<string, { amount: number; currency: string; name: string }> = {
  basic: { amount: 1185, currency: 'USD', name: 'Basic Plan' }, // $11.85
  premium: { amount: 2285, currency: 'USD', name: 'Premium Plan' }, // $22.85
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Change plan request received:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', requestBody);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { shop, planId } = requestBody as ChangePlanPayload;
    console.log('Processing plan change:', { shop, planId });

    if (!shop || !planId) {
      return new Response(JSON.stringify({ error: 'Missing shop or planId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRole) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${serviceRole}` } }
    });

    // Free plan: just update DB
    if (planId === 'free') {
      console.log('Upgrading to free plan for shop:', shop);
      const { data, error } = await supabase.rpc('upgrade_shop_plan', {
        p_shop_domain: shop,
        p_new_plan: 'free',
        p_shopify_charge_id: null
      });

      if (error) {
        console.error('Error upgrading to free plan:', error);
        return new Response(JSON.stringify({ error: 'Failed to upgrade to free plan', details: error.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      console.log('Successfully upgraded to free plan');
      return new Response(JSON.stringify({ success: true, message: 'Successfully upgraded to free plan' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // For paid plans, create a Shopify subscription and return confirmation URL
    console.log('Processing paid plan upgrade for:', { shop, planId });

    // Fetch access token for the shop
    const { data: storeRow, error: storeError } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('shop', shop)
      .single();

    if (storeError) {
      console.error('Error fetching store data:', storeError);
      return new Response(JSON.stringify({ error: 'Failed to fetch store data', details: storeError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!storeRow?.access_token) {
      console.error('No access token found for shop:', shop);
      return new Response(JSON.stringify({ error: 'Shop access token not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const token = storeRow.access_token as string;
    const pricing = planPricing[planId];

    if (!pricing) {
      console.error('Invalid plan ID:', planId);
      return new Response(JSON.stringify({ error: 'Unsupported plan' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Using pricing:', pricing);

    const origin = req.headers.get('origin') || 'https://codmagnet.com';
    const returnUrl = `${origin}/subscription-callback`;

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

    console.log('Making Shopify API request with variables:', variables);

    const resp = await fetch(`https://${shop}/admin/api/${GRAPHQL_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    if (!resp.ok) {
      console.error('Shopify API request failed:', resp.status, resp.statusText);
      return new Response(JSON.stringify({ error: 'Failed to create subscription', details: `HTTP ${resp.status}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const json = await resp.json();
    console.log('Shopify API response:', json);

    const sub = json?.data?.appSubscriptionCreate;
    if (sub?.userErrors?.length) {
      console.error('Shopify billing errors:', sub.userErrors);
      return new Response(JSON.stringify({
        error: 'Shopify billing error',
        details: sub.userErrors.map((e: any) => e.message).join(', ')
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const confirmationUrl = sub?.confirmationUrl;
    if (!confirmationUrl) {
      console.error('No confirmation URL returned by Shopify');
      return new Response(JSON.stringify({ error: 'No confirmation URL returned by Shopify' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Subscription created successfully, confirmation URL:', confirmationUrl);

    // Mark subscription as pending in DB
    const { error: upsertError } = await supabase.from('shop_subscriptions').upsert({
      shop_domain: shop,
      plan_type: planId,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'shop_domain' });

    if (upsertError) {
      console.error('Error updating subscription in DB:', upsertError);
      // Don't fail the request, just log the error
    }

    return new Response(JSON.stringify({
      success: true,
      url: confirmationUrl,
      message: 'Subscription created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('change-plan error:', err);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
