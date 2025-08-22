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
        if (!isNaN(amount)) {
          if (amount >= 22 && amount < 30) plan_type = 'premium'
          else if (amount >= 11 && amount < 20) plan_type = 'basic'
        }

        console.log(`📋 Billing update: shop=${shopDomain}, status=${status}, amount=${amount}, plan=${plan_type}`)
        console.log(`📋 Full webhook data:`, JSON.stringify(body, null, 2))

        if (shopDomain && plan_type) {
          const subscriptionData = {
            shop_domain: shopDomain,
            plan_type: plan_type,
            status: status === 'active' ? 'active' : status || 'active',
            price_amount: amount,
            currency: 'USD',
            shopify_charge_id: appSub?.id || null,
            subscription_started_at: status === 'active' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          };

          console.log(`📋 Upserting subscription data:`, subscriptionData);

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
