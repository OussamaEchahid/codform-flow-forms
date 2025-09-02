import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

// This function scans pending subscriptions and promotes them to ACTIVE
// if Shopify reports any activeSubscriptions for the shop.

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    const url = new URL(req.url);
    const targetShop = url.searchParams.get('shop'); // optional single shop

    console.log('🧩 === RECONCILE SUBSCRIPTIONS STARTED ===');
    console.log('🧩 Target shop:', targetShop);
    console.log('🧩 Timestamp:', new Date().toISOString());

    // Fetch pending subscriptions (optionally filter by shop)
    const { data: pending, error: pendErr } = await supabase
      .from('shop_subscriptions')
      .select('shop_domain, requested_plan_type, status')
      .eq('status', 'pending')
      .maybeSingle();

    console.log('🧩 Pending subscriptions query result:', { pending, pendErr });

    // If specific shop requested, query it explicitly
    let shops: Array<{ shop_domain: string; requested_plan_type: string | null }> = [];
    if (targetShop) {
      console.log('🧩 Querying specific shop:', targetShop);
      const { data, error } = await supabase
        .from('shop_subscriptions')
        .select('shop_domain, requested_plan_type, status')
        .eq('shop_domain', targetShop)
        .limit(1);
      if (error) throw error;
      shops = data || [];
      console.log('🧩 Target shop query result:', shops);
    } else {
      console.log('🧩 Querying all pending subscriptions');
      const { data, error } = await supabase
        .from('shop_subscriptions')
        .select('shop_domain, requested_plan_type')
        .eq('status', 'pending');
      if (error) throw error;
      shops = data || [];
      console.log('🧩 Pending shops query result:', shops);
    }

    console.log('🧩 Final shops to process:', shops);
    const results: any[] = [];

    for (const s of shops) {
      const shop = s.shop_domain.toLowerCase();
      console.log(`\n🧩 === Processing shop: ${shop} ===`);
      console.log('🧩 Shop data:', s);

      // Get access token
      const { data: store, error: storeErr } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shop)
        .maybeSingle();

      console.log('🧩 Store token query:', { hasToken: !!store?.access_token, storeErr });

      if (storeErr || !store?.access_token) {
        console.log('🧩 ❌ Skipping shop - no token');
        results.push({ shop, action: 'skip', reason: 'NO_TOKEN' });
        continue;
      }

      // Query Shopify to check active subscription exists
      console.log('🧩 Querying Shopify for active subscriptions...');
      const GRAPHQL_API_VERSION = '2025-07';
      const query = `#graphql
        query { appInstallation { activeSubscriptions { id status } } }
      `;
      const resp = await fetch(`https://${shop}/admin/api/${GRAPHQL_API_VERSION}/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': store.access_token },
        body: JSON.stringify({ query })
      });

      console.log('🧩 Shopify API response status:', resp.status);

      if (!resp.ok) {
        console.log('🧩 ❌ Shopify API failed');
        results.push({ shop, action: 'skip', reason: `HTTP_${resp.status}` });
        continue;
      }
      const json = await resp.json().catch(() => ({}));
      const subs = json?.data?.appInstallation?.activeSubscriptions || [];
      const hasActive = Array.isArray(subs) && subs.length > 0;

      console.log('🧩 Shopify subscriptions:', { subs, hasActive });

      if (hasActive) {
        console.log('🧩 ✅ Active subscription found');

        // تحديد نوع المتجر
        const isDevelopmentStore = shop.includes('.myshopify.com');

        if (isDevelopmentStore) {
          console.log('🧩 🧪 Development store - immediate activation (Shopify auto-approves)');
          // متاجر التطوير: تفعيل فوري (Shopify يوافق تلقائياً)
          const { error: promoteErr } = await supabase.rpc('confirm_subscription_payment', {
            p_shop_domain: shop,
            p_shopify_charge_id: null,
          });
          if (promoteErr) {
            console.log('🧩 ❌ Development store promotion failed:', promoteErr.message);
            results.push({ shop, action: 'error', reason: promoteErr.message, store_type: 'development' });
          } else {
            console.log('🧩 ✅ Development store successfully activated');
            results.push({ shop, action: 'promoted_to_active', store_type: 'development' });
          }
        } else {
          console.log('🧩 🏪 Production store - checking approval timing');
          // المتاجر الحقيقية: تحقق من وقت الطلب للسماح بوقت الموافقة
          const { data: currentSub } = await supabase
            .from('shop_subscriptions')
            .select('requested_at')
            .eq('shop_domain', shop)
            .maybeSingle();

          if (currentSub?.requested_at) {
            const requestedTime = new Date(currentSub.requested_at).getTime();
            const now = Date.now();
            const elapsedMinutes = (now - requestedTime) / (1000 * 60);

            console.log('🧩 🏪 Production store timing:', {
              requestedAt: currentSub.requested_at,
              elapsedMinutes: Math.round(elapsedMinutes * 10) / 10,
              minimumWait: 2
            });

            // انتظار دقيقتين على الأقل للمتاجر الحقيقية (وقت كافي للموافقة)
            if (elapsedMinutes < 2) {
              console.log('🧩 ⏳ Production store - allowing time for user approval');
              results.push({
                shop,
                action: 'pending_user_approval',
                elapsedMinutes: Math.round(elapsedMinutes * 10) / 10,
                store_type: 'production'
              });
              continue;
            }
          }

          console.log('🧩 ✅ Production store - promoting to active');
          const { error: promoteErr } = await supabase.rpc('confirm_subscription_payment', {
            p_shop_domain: shop,
            p_shopify_charge_id: null,
          });
          if (promoteErr) {
            console.log('🧩 ❌ Production store promotion failed:', promoteErr.message);
            results.push({ shop, action: 'error', reason: promoteErr.message, store_type: 'production' });
          } else {
            console.log('🧩 ✅ Production store successfully activated');
            results.push({ shop, action: 'promoted_to_active', store_type: 'production' });
          }
        }
      } else {
        const storeType = shop.includes('.myshopify.com') ? 'development' : 'production';
        console.log(`🧩 ⏳ No active subscription found - keeping pending (${storeType} store)`);
        results.push({ shop, action: 'pending_no_active_subscription', store_type: storeType });
      }
    }

    return new Response(JSON.stringify({ success: true, results }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message ?? String(e) }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

