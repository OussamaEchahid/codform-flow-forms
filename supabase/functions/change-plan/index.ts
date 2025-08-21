import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('Change plan function started');
  console.log('Method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    const body = await req.text();
    console.log('Raw body:', body);

    if (!body) {
      return new Response(JSON.stringify({ error: 'Empty request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let requestData;
    try {
      requestData = JSON.parse(body);
      console.log('Parsed JSON:', requestData);
    } catch (e) {
      console.log('JSON parse error:', e);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { shop, planId } = requestData;
    console.log('Shop:', shop);
    console.log('Plan ID:', planId);

    if (!shop || !planId) {
      console.log('Missing required fields');
      return new Response(JSON.stringify({
        error: 'Missing shop or planId',
        received: { shop, planId }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRole) {
      console.log('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${serviceRole}` } }
    });

    if (planId === 'free') {
      console.log('Processing free plan upgrade');
      const { data, error } = await supabase.rpc('upgrade_shop_plan', {
        p_shop_domain: shop,
        p_new_plan: 'free',
        p_shopify_charge_id: null
      });

      if (error) {
        console.log('Free plan upgrade error:', error);
        return new Response(JSON.stringify({
          error: 'Failed to upgrade to free plan',
          details: error.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      console.log('Free plan upgrade successful');
      return new Response(JSON.stringify({
        success: true,
        message: 'Successfully upgraded to free plan'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log('Processing paid plan:', planId);

    const { data: storeRow, error: storeError } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('shop', shop)
      .single();

    if (storeError || !storeRow?.access_token) {
      console.log('Shop not found or no access token:', storeError);
      return new Response(JSON.stringify({
        error: 'Shop not found or not authenticated'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const planPricing: Record<string, { amount: number; currency: string; name: string }> = {
      basic: { amount: 1185, currency: 'USD', name: 'Basic Plan' },
      premium: { amount: 2285, currency: 'USD', name: 'Premium Plan' },
    };

    const planConfig = planPricing[planId as keyof typeof planPricing];
    if (!planConfig) {
      console.log('Invalid plan ID:', planId);
      return new Response(JSON.stringify({ 
        error: 'Invalid plan ID',
        validPlans: Object.keys(planPricing)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Creating Shopify subscription...');
    const subscriptionMutation = `
      mutation appSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!) {
        appSubscriptionCreate(name: $name, lineItems: $lineItems, returnUrl: $returnUrl) {
          appSubscription {
            id
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      name: planConfig.name,
      lineItems: [{
        plan: {
          appRecurringPricingDetails: {
            price: { amount: planConfig.amount / 100, currencyCode: planConfig.currency }
          }
        }
      }],
      returnUrl: `https://${shop}/admin/apps/cod-magnet-1/plans?plan=${planId}&status=success`
    };

    const shopifyResponse = await fetch(`https://${shop}/admin/api/2025-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': storeRow.access_token,
      },
      body: JSON.stringify({ query: subscriptionMutation, variables }),
    });

    const shopifyData = await shopifyResponse.json();
    console.log('Shopify response:', shopifyData);

    if (shopifyData.errors || shopifyData.data?.appSubscriptionCreate?.userErrors?.length > 0) {
      console.log('Shopify subscription creation failed');
      return new Response(JSON.stringify({
        error: 'Failed to create Shopify subscription',
        details: shopifyData.errors || shopifyData.data?.appSubscriptionCreate?.userErrors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const confirmationUrl = shopifyData.data?.appSubscriptionCreate?.confirmationUrl;
    if (!confirmationUrl) {
      console.log('No confirmation URL returned');
      return new Response(JSON.stringify({ error: 'No confirmation URL returned' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Subscription created, confirmation URL:', confirmationUrl);

    const { error: upsertError } = await supabase.from('shop_subscriptions').upsert({
      shop_domain: shop,
      plan_type: planId,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'shop_domain' });

    if (upsertError) {
      console.log('Warning: Failed to update subscription in DB:', upsertError);
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
    console.log('Unexpected error:', err);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});