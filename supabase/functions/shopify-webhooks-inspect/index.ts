import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// CORS headers
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const url = new URL(req.url)
  const shop = (url.searchParams.get('shop') || '').toLowerCase()

  console.log('🔎 Inspect request', { method: req.method, shop })

  if (!shop) return json({ success: false, error: 'MISSING_SHOP', message: 'Provide ?shop=myshop.myshopify.com' }, 400)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  try {
    // Load store and token
    const { data: store, error } = await supabase
      .from('shopify_stores')
      .select('shop, access_token, is_active')
      .eq('shop', shop)
      .single()

    if (error || !store) return json({ success: false, error: 'STORE_NOT_FOUND', details: error?.message }, 404)
    if (!store.access_token) return json({ success: false, error: 'MISSING_TOKEN' }, 400)

    const graphqlEndpoint = `https://${store.shop}/admin/api/2025-04/graphql.json`
    const callbackUrl = 'https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-webhooks'

    // 1) Check existing subscriptions
    const checkQuery = {
      query: `{
        webhookSubscriptions(first: 50, topics: [APP_UNINSTALLED]) {
          edges { node { id topic endpoint { __typename ... on WebhookHttpEndpoint { callbackUrl } } } }
        }
      }`,
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': store.access_token as string,
    }

    const checkRes = await fetch(graphqlEndpoint, { method: 'POST', headers, body: JSON.stringify(checkQuery) })
    const checkJson = await checkRes.json().catch(() => ({}))
    const edges: any[] = checkJson?.data?.webhookSubscriptions?.edges || []

    const current = edges.find((e: any) => e?.node?.endpoint?.callbackUrl === callbackUrl)
    const hasAny = edges.length > 0

    console.log('📋 Current APP_UNINSTALLED subscriptions:', edges.map((e: any) => ({ id: e?.node?.id, url: e?.node?.endpoint?.callbackUrl })))

    let created = false
    let fixedWrongUrl = false

    if (!current) {
      // If exists but wrong URL, we will create a correct one (simpler than update)
      if (hasAny) fixedWrongUrl = true

      const createMutation = {
        query: `mutation CreateUninstall($callbackUrl: URL!) {
          webhookSubscriptionCreate(topic: APP_UNINSTALLED, webhookSubscription: { callbackUrl: $callbackUrl, format: JSON }) {
            webhookSubscription { id }
            userErrors { field message }
          }
        }`,
        variables: { callbackUrl },
      }

      const createRes = await fetch(graphqlEndpoint, { method: 'POST', headers, body: JSON.stringify(createMutation) })
      const createJson = await createRes.json().catch(() => ({}))
      const err = createJson?.data?.webhookSubscriptionCreate?.userErrors?.[0]
      if (err) {
        console.warn('⚠️ webhookSubscriptionCreate userError:', err)
        return json({ success: false, error: 'CREATE_FAILED', details: err })
      }
      created = true
      console.log('✅ APP_UNINSTALLED webhook ensured:', createJson?.data?.webhookSubscriptionCreate?.webhookSubscription?.id)
    }

    return json({
      success: true,
      shop: store.shop,
      callbackUrl,
      existing: edges.map((e: any) => ({ id: e?.node?.id, url: e?.node?.endpoint?.callbackUrl })),
      ensured: created || !!current,
      fixedWrongUrl,
    })
  } catch (e: any) {
    console.error('❌ Inspect error', e)
    return json({ success: false, error: 'UNEXPECTED', message: e?.message ?? String(e) }, 500)
  }
})
