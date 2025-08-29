import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// Simple compatibility endpoint that verifies HMAC then forwards to the canonical handler
// at /functions/v1/shopify-webhooks. This stops 401s from legacy subscriptions that still
// point to /shopify-billing-webhook.

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Constant-time compare
function safeEqual(a: string, b: string) {
  const enc = new TextEncoder()
  const aBytes = enc.encode(a)
  const bBytes = enc.encode(b)
  if (aBytes.length !== bBytes.length) return false
  let diff = 0
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i]
  return diff === 0
}

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
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const forwardUrl = `${SUPABASE_URL}/functions/v1/shopify-webhooks`

  // Read body as text (needed for HMAC)
  const rawBody = await req.text()

  // Verify HMAC to avoid acknowledging forged requests
  const valid = await verifyShopifyHmac(req, rawBody).catch(() => false)
  if (!valid) {
    console.warn('❌ Invalid HMAC on legacy webhook endpoint')
    return new Response(JSON.stringify({ success: false, error: 'INVALID_HMAC' }, null, 2), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  // Forward with same headers and body to the canonical handler
  const forwardHeaders = new Headers(req.headers)
  // Ensure content-type is preserved
  if (!forwardHeaders.get('content-type')) forwardHeaders.set('content-type', 'application/json')

  const resp = await fetch(forwardUrl, {
    method: req.method,
    headers: forwardHeaders,
    body: rawBody,
  }).catch((e) => {
    console.error('❌ Forwarding to /shopify-webhooks failed:', e)
    return new Response(JSON.stringify({ success: false, error: 'FORWARD_FAILED' }, null, 2), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  })

  // Pass-through response from the canonical handler
  return new Response(await resp.text(), {
    status: resp.status,
    headers: resp.headers,
  })
})

