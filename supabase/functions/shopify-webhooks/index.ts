import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// CORS headers
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
}

// Helper: constant-time compare
function safeEqual(a: string, b: string) {
  const aBytes = new TextEncoder().encode(a)
  const bBytes = new TextEncoder().encode(b)
  if (aBytes.length !== bBytes.length) return false
  let result = 0
  for (let i = 0; i < aBytes.length; i++) result |= aBytes[i] ^ bBytes[i]
  return result === 0
}

// Verify Shopify HMAC using raw body
async function verifyShopifyHmac(req: Request, rawBody: string) {
  const secret = Deno.env.get('SHOPIFY_API_SECRET') || ''
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256') || ''
  if (!secret || !hmacHeader) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const digestB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
  return safeEqual(digestB64, hmacHeader)
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const topic = (req.headers.get('x-shopify-topic') || '').toLowerCase()
  const shopDomain = (req.headers.get('x-shopify-shop-domain') || '').toLowerCase()
  console.log('📬 Webhook received', { topic, shopDomain, method: req.method })

  // Read raw text for HMAC verification
  const rawBody = await req.text()

  // Always acknowledge quickly if secret missing to avoid retries
  const valid = await verifyShopifyHmac(req, rawBody).catch(() => false)
  if (!valid) {
    console.warn('❌ Invalid HMAC for webhook', { topic, shopDomain })
    return new Response(JSON.stringify({ success: false, error: 'INVALID_HMAC' }, null, 2), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  let body: any = {}
  try { body = JSON.parse(rawBody) } catch { body = {} }

  try {
    // app/uninstalled
    if (topic === 'app/uninstalled') {
      if (shopDomain) {
        await supabase
          .from('shopify_stores')
          .update({ is_active: false, access_token: null, scope: null, token_type: null, updated_at: new Date().toISOString() })
          .eq('shop', shopDomain)
      }
      return new Response(JSON.stringify({ success: true, handled: 'app/uninstalled', shop: shopDomain }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // GDPR: customers/data_request (ack only)
    if (topic === 'customers/data_request') {
      return new Response(JSON.stringify({ success: true, handled: 'customers/data_request' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // GDPR: customers/redact (anonymize PII in our records)
    if (topic === 'customers/redact') {
      const email: string | undefined = body?.customer?.email || body?.email
      const phone: string | undefined = body?.customer?.phone || body?.phone
      const pseudonym = 'redacted'

      if (shopDomain) {
        // Best-effort anonymization of abandoned carts and orders
        await supabase
          .from('abandoned_carts')
          .update({ customer_email: null, customer_phone: null, updated_at: new Date().toISOString() })
          .eq('shop_id', shopDomain)
          .or(`customer_email.eq.${email ?? ''},customer_phone.eq.${phone ?? ''}`)

        await supabase
          .from('orders')
          .update({ customer_email: null, customer_phone: null, customer_name: pseudonym, updated_at: new Date().toISOString() })
          .eq('shop_id', shopDomain)
          .or(`customer_email.eq.${email ?? ''},customer_phone.eq.${phone ?? ''}`)
      }

      return new Response(JSON.stringify({ success: true, handled: 'customers/redact' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // GDPR: shop/redact (scrub shop)
    if (topic === 'shop/redact') {
      if (shopDomain) {
        await supabase
          .from('shopify_stores')
          .update({ is_active: false, access_token: null, scope: null, token_type: null, updated_at: new Date().toISOString() })
          .eq('shop', shopDomain)
      }
      return new Response(JSON.stringify({ success: true, handled: 'shop/redact' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }


    // Billing: app_subscriptions/update
    if (topic === 'app_subscriptions/update') {
      try {
        const appSub: any = body?.app_subscription || body?.subscription || body
        const status: string = (appSub?.status || '').toString().toLowerCase()
        const lineItems: any[] = appSub?.line_items || appSub?.lineItems || []
        const amountRaw = lineItems?.[0]?.plan?.pricing_details?.price?.amount ?? lineItems?.[0]?.plan?.pricingDetails?.price?.amount
        const amount = Number(amountRaw)

        let plan_type: 'free' | 'basic' | 'premium' | null = null
        let standardPrice = 0

        if (!isNaN(amount)) {
          if (amount >= 22 && amount < 30) {
            plan_type = 'premium'
            standardPrice = 22.85
          } else if (amount >= 11 && amount < 20) {
            plan_type = 'basic'
            standardPrice = 11.85
          }
        }

        // التحقق من نوع المتجر - Development stores
        // ملاحظة مهمة: Development stores قد تظهر charges كـ "live" حتى لو كانت test charges
        // هذا سلوك طبيعي من Shopify - نحن نعتمد على النطاق للكشف
        const isDevelopmentStore = shopDomain?.includes('.myshopify.com')

        // فحص إضافي للـ test flag (قد يكون موجود أو لا)
        const hasTestFlag = body?.app_subscription?.test === true ||
                           body?.subscription?.test === true ||
                           body?.test === true

        console.log(`📋 Billing update: shop=${shopDomain}, status=${status}, amount=${amount}, plan=${plan_type}`)
        console.log(`📋 Store detection:
          - Domain-based (.myshopify.com): ${isDevelopmentStore}
          - Has test flag: ${hasTestFlag}
          - Treating as: ${isDevelopmentStore ? 'Development Store (Safe to proceed)' : 'Production Store'}`)
        console.log(`📋 Full webhook data:`, JSON.stringify(body, null, 2))

        if (shopDomain && plan_type) {
          // تطبيع الحالة: معالجة خاصة للـ Development Stores
          // الحالات المحتملة من Shopify: pending, accepted, active, cancelled, declined
          let normalizedStatus: 'pending' | 'active' | 'cancelled' = 'pending'

          if (status === 'active') {
            normalizedStatus = 'active'
          } else if (status === 'accepted') {
            // في Development Stores، "accepted" يعني test charge مقبول تلقائياً
            // في Production Stores، "accepted" يعني الدفع تم بنجاح
            normalizedStatus = isDevelopmentStore ? 'active' : 'active'
            console.log(`📋 Accepted status treated as active (${isDevelopmentStore ? 'test charge' : 'paid charge'})`)
          } else if (status === 'cancelled' || status === 'declined') {
            normalizedStatus = 'cancelled'
          }

          const subscriptionData: any = {
            shop_domain: shopDomain,
            price_amount: standardPrice, // استخدام السعر المعياري بدلاً من amount من Shopify
            currency: 'USD',
            shopify_charge_id: appSub?.id || null,
            updated_at: new Date().toISOString(),
          };

          if (normalizedStatus === 'active') {
            // Activate: commit plan_type and clear any requested state
            subscriptionData.plan_type = plan_type;
            subscriptionData.status = 'active';
            subscriptionData.subscription_started_at = new Date().toISOString();
            subscriptionData.requested_plan_type = null;
            subscriptionData.requested_at = null;
            // تعيين تاريخ التجديد التالي (شهر من الآن)
            const nextBilling = new Date();
            nextBilling.setMonth(nextBilling.getMonth() + 1);
            subscriptionData.next_billing_date = nextBilling.toISOString();
            // إضافة معلومات نوع الـ charge للتتبع
            // ملاحظة: Development stores قد تظهر كـ "live" في webhook حتى لو كانت test charges
            subscriptionData.charge_type = isDevelopmentStore ? 'development_store' : 'production_store';
            subscriptionData.is_test_charge = isDevelopmentStore || hasTestFlag;
            console.log(`✅ Subscription activated: ${plan_type} (${isDevelopmentStore ? 'Development Store - Safe to use' : 'Production Store - Real payment'})`);
          } else if (normalizedStatus === 'pending') {
            // Pending: keep current active plan intact and store requested plan
            subscriptionData.status = 'pending';
            subscriptionData.requested_plan_type = plan_type;
            subscriptionData.requested_at = new Date().toISOString();
            // لا نغير next_billing_date للاشتراكات المعلقة
          } else {
            // Cancelled/declined: clear requested state and billing date
            subscriptionData.status = 'cancelled';
            subscriptionData.requested_plan_type = null;
            subscriptionData.requested_at = null;
            subscriptionData.next_billing_date = null;
            // إرجاع إلى الخطة المجانية عند الإلغاء
            subscriptionData.plan_type = 'free';
            subscriptionData.price_amount = 0;
          }

          console.log(`📋 Upserting subscription data:`, subscriptionData);

          // إضافة تنبيه خاص للـ Development Stores
          if (isDevelopmentStore) {
            console.log(`🔔 IMPORTANT: This is a Development Store (.myshopify.com)`);
            console.log(`🔔 Charges may appear as "live" in webhooks but are actually safe test charges`);
            console.log(`🔔 No real money will be charged from development stores`);
          }

          const { data, error } = await supabase
            .from('shop_subscriptions')
            .upsert(subscriptionData, { onConflict: 'shop_domain' })
            .select();

          if (error) {
            console.error('❌ Database error:', error);
            throw error;
          }

          console.log('✅ Subscription updated successfully:', data);
        }

        return new Response(JSON.stringify({ success: true, handled: 'app_subscriptions/update', shop: shopDomain, plan_type, status }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      } catch (e) {
        console.error('❌ Error handling app_subscriptions/update', e)
        return new Response(JSON.stringify({ success: false, error: 'BILLING_UPDATE_FAILED' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }
    }

    // Fallback
    return new Response(JSON.stringify({ success: true, message: 'NOOP', topic }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: 'UNEXPECTED', details: e?.message ?? String(e) }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
