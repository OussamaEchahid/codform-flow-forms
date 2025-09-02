import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

interface SuccessParams {
  shop: string;
  plan: string;
  charge_id?: string;
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let url = new URL(req.url);
    let shop = url.searchParams.get('shop');
    let plan = url.searchParams.get('plan');
    const chargeId = url.searchParams.get('charge_id');

    // Fallback: handle HTML-encoded ampersands (?shop=...&amp;plan=...)
    if ((!shop || !plan) && req.url.includes('amp;')) {
      try {
        url = new URL(req.url.replace(/amp;/g, ''));
        shop = shop || url.searchParams.get('shop');
        plan = plan || url.searchParams.get('plan');
      } catch {}
    }

    if (!shop || !plan) {
      return new Response(JSON.stringify({ error: 'Missing shop or plan parameter' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    console.log(`🔔 === SUBSCRIPTION-SUCCESS CALLED ===`);
    console.log(`🔔 Shop: ${shop}`);
    console.log(`🔔 Plan: ${plan}`);
    console.log(`🔔 Charge ID: ${chargeId}`);
    console.log(`🔔 Timestamp: ${new Date().toISOString()}`);
    console.log(`🔔 Full URL: ${req.url}`);
    console.log(`🔔 User Agent: ${req.headers.get('user-agent')}`);
    console.log(`🔔 Referer: ${req.headers.get('referer')}`);
    console.log(`✅ Confirming subscription for shop: ${shop}, plan: ${plan}, charge: ${chargeId}`);

    // تحقق من حالة الاشتراك من Shopify قبل التفعيل النهائي
    try {
      const tokenResp = await supabase.rpc('get_store_access_token', { p_shop: shop })
      if (tokenResp.error || !tokenResp.data) {
        console.warn('⚠️ Cannot fetch shop token, marking as pending (requested only).');
        await supabase.from('shop_subscriptions').upsert({
          shop_domain: shop,
          status: 'pending',
          requested_plan_type: plan as any,
          requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'shop_domain' })
      } else {
        const token = tokenResp.data as string
        // Use a stable Shopify API version. If this becomes outdated, it still returns data for a while.
        const GRAPHQL_API_VERSION = '2024-07'
        const query = `#graphql
          query { appInstallation { activeSubscriptions { id status } } }
        `
        const resp = await fetch(`https://${shop}/admin/api/${GRAPHQL_API_VERSION}/graphql.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
          body: JSON.stringify({ query })
        })
        const json = await resp.json().catch(() => ({}))
        const subs = json?.data?.appInstallation?.activeSubscriptions || []
        const hasConfirmed = Array.isArray(subs) && subs.some((s: any) => {
          const st = (s?.status || '').toString().toLowerCase()
          return st === 'active' || st === 'accepted'
        })

        if (!hasConfirmed) {
          console.log('ℹ️ No ACTIVE/ACCEPTED subscription detected yet. Marking as pending - waiting for payment completion.')
          // Keep requested state for traceability - DO NOT auto-activate
          await supabase.from('shop_subscriptions').upsert({
            shop_domain: shop,
            status: 'pending',
            requested_plan_type: plan as any,
            requested_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'shop_domain' })

          console.log('⏳ Subscription marked as pending. User must complete payment for activation.')
        } else {
          // Confirm immediately for ACTIVE or ACCEPTED in test/dev
          const { error } = await supabase.rpc('confirm_subscription_payment', {
            p_shop_domain: shop,
            p_shopify_charge_id: chargeId || null,
          })
          if (error) throw error
          console.log('✅ Subscription confirmed and activated via confirm_subscription_payment (active/accepted)')
        }
      }
    } catch (e) {
      console.error('❌ Error verifying subscription status, keeping pending:', e)
      await supabase.from('shop_subscriptions').upsert({ shop_domain: shop, status: 'pending', requested_plan_type: plan as any, requested_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'shop_domain' })
    }

    // إعادة توجيه مباشرة إلى صفحة الخطط
    return new Response(null, {
      headers: { 
        ...corsHeaders, 
        'Location': 'https://codmagnet.com/plans?success=true&plan=' + plan 
      },
      status: 302,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('subscription-success error:', message);
    
    // إعادة توجيه إلى الخطط مع رسالة خطأ
    return new Response(null, {
      headers: { 
        ...corsHeaders, 
        'Location': 'https://codmagnet.com/plans?error=true' 
      },
      status: 302,
    });
  }
});