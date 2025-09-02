import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { 
      auth: { persistSession: false } 
    });

    console.log('🔍 Checking for expired subscriptions...');

    // البحث عن الاشتراكات المنتهية الصلاحية
    const { data: expiredSubs, error } = await supabase
      .from('shop_subscriptions')
      .select('*')
      .neq('plan_type', 'free')
      .eq('status', 'active')
      .not('next_billing_date', 'is', null)
      .lt('next_billing_date', new Date().toISOString());

    if (error) {
      console.error('❌ Error fetching expired subscriptions:', error);
      throw error;
    }

    console.log(`📊 Found ${expiredSubs?.length || 0} expired subscriptions`);

    const results = [];

    for (const sub of expiredSubs || []) {
      try {
        console.log(`⏰ Processing expired subscription for ${sub.shop_domain}`);

        // محاولة التحقق من Shopify أولاً
        const { data: tokenData } = await supabase.rpc('get_store_access_token', { 
          p_shop: sub.shop_domain 
        });

        if (tokenData) {
          // التحقق من حالة الاشتراك في Shopify
          const shopifyStatus = await checkShopifySubscriptionStatus(sub.shop_domain, tokenData);
          
          if (shopifyStatus.hasActiveSubscription) {
            // تحديث next_billing_date إذا كان هناك اشتراك نشط
            await supabase
              .from('shop_subscriptions')
              .update({
                next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', sub.id);

            results.push({
              shop: sub.shop_domain,
              action: 'renewed',
              reason: 'Active subscription found in Shopify'
            });
            continue;
          }
        }

        // إرجاع إلى الخطة المجانية
        await supabase
          .from('shop_subscriptions')
          .update({
            plan_type: 'free',
            status: 'active',
            price_amount: 0,
            next_billing_date: null,
            shopify_charge_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', sub.id);

        results.push({
          shop: sub.shop_domain,
          action: 'downgraded_to_free',
          previous_plan: sub.plan_type,
          reason: 'Subscription expired'
        });

        console.log(`✅ Downgraded ${sub.shop_domain} from ${sub.plan_type} to free`);

      } catch (error) {
        console.error(`❌ Error processing ${sub.shop_domain}:`, error);
        results.push({
          shop: sub.shop_domain,
          action: 'error',
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function checkShopifySubscriptionStatus(shop: string, token: string) {
  try {
    const query = `#graphql
      query {
        appInstallation {
          activeSubscriptions {
            id
            status
            lineItems {
              plan {
                pricingDetails {
                  price {
                    amount
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/2024-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      return { hasActiveSubscription: false };
    }

    const data = await response.json();
    const subscriptions = data?.data?.appInstallation?.activeSubscriptions || [];
    
    return {
      hasActiveSubscription: subscriptions.length > 0,
      subscriptions
    };

  } catch (error) {
    console.error('Error checking Shopify subscription:', error);
    return { hasActiveSubscription: false };
  }
}
