import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

/*
  Edge function to clean up legacy APP_SUBSCRIPTIONS_UPDATE webhook subscriptions
  and ensure a single correct subscription pointing to /functions/v1/shopify-webhooks.

  Usage:
  - For a single shop:  GET /functions/v1/fix-billing-webhooks?shop=myshop.myshopify.com
  - For all active shops: GET /functions/v1/fix-billing-webhooks (admin-only; uses service role)

  Notes:
  - Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  - Uses each shop's stored access_token from table shopify_stores
*/

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

async function ensureBillingWebhookForShop(shop: string, accessToken: string, correctUrl: string) {
  const graphqlEndpoint = `https://${shop}/admin/api/2025-04/graphql.json`

  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': accessToken,
  } as const

  // 1) Read existing subscriptions for topic
  const checkQuery = {
    query: `{
      webhookSubscriptions(first: 100, topics: [APP_SUBSCRIPTIONS_UPDATE]) {
        edges { node { id endpoint { __typename ... on WebhookHttpEndpoint { callbackUrl } } } }
      }
    }`,
  }

  const checkRes = await fetch(graphqlEndpoint, { method: 'POST', headers, body: JSON.stringify(checkQuery) })
  const checkJson = await checkRes.json().catch(() => ({}))
  const edges: any[] = checkJson?.data?.webhookSubscriptions?.edges || []

  const toDelete: string[] = []
  let hasCorrect = false
  for (const e of edges) {
    const id = e?.node?.id as string
    const url = e?.node?.endpoint?.callbackUrl as string
    if (url === correctUrl) hasCorrect = true
    else if (id) toDelete.push(id)
  }

  const actions: any[] = []

  // 2) Delete wrong subscriptions (if any)
  for (const id of toDelete) {
    const delMutation = {
      query: `mutation Delete($id: ID!) { webhookSubscriptionDelete(id: $id) { deletedWebhookSubscriptionId userErrors { field message } } }`,
      variables: { id },
    }
    const delRes = await fetch(graphqlEndpoint, { method: 'POST', headers, body: JSON.stringify(delMutation) })
    const delJson = await delRes.json().catch(() => ({}))
    const err = delJson?.data?.webhookSubscriptionDelete?.userErrors?.[0]
    if (err) actions.push({ type: 'delete_failed', id, error: err })
    else actions.push({ type: 'deleted', id: delJson?.data?.webhookSubscriptionDelete?.deletedWebhookSubscriptionId || id })
  }

  // 3) Create the correct subscription if missing
  if (!hasCorrect) {
    const createMutation = {
      query: `mutation Create($callbackUrl: URL!) { webhookSubscriptionCreate(topic: APP_SUBSCRIPTIONS_UPDATE, webhookSubscription: { callbackUrl: $callbackUrl, format: JSON }) { webhookSubscription { id } userErrors { field message } } }`,
      variables: { callbackUrl: correctUrl },
    }
    const createRes = await fetch(graphqlEndpoint, { method: 'POST', headers, body: JSON.stringify(createMutation) })
    const createJson = await createRes.json().catch(() => ({}))
    const err = createJson?.data?.webhookSubscriptionCreate?.userErrors?.[0]
    if (err) actions.push({ type: 'create_failed', error: err })
    else actions.push({ type: 'created', id: createJson?.data?.webhookSubscriptionCreate?.webhookSubscription?.id })
  }

  return { shop, existingCount: edges.length, deleted: toDelete.length, created: !hasCorrect ? 1 : 0, actions }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const shopParam = (url.searchParams.get('shop') || '').toLowerCase()

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ADMIN_FIX_SECRET = Deno.env.get('ADMIN_FIX_SECRET') || ''
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const correctUrl = `${SUPABASE_URL}/functions/v1/shopify-webhooks`

    let stores: { shop: string; access_token: string }[] = []

    if (shopParam) {
      const { data, error } = await supabase
        .from('shopify_stores')
        .select('shop, access_token')
        .eq('shop', shopParam)
        .eq('is_active', true)
        .maybeSingle()
      if (error || !data) return json({ success: false, error: 'STORE_NOT_FOUND', details: error?.message }, 404)
      stores = [data as any]
    } else {
      // Require admin secret to fix all shops at once
      const provided = req.headers.get('x-admin-secret') || ''
      if (!ADMIN_FIX_SECRET || provided !== ADMIN_FIX_SECRET) {
        return json({ success: false, error: 'UNAUTHORIZED', message: 'Missing or invalid x-admin-secret' }, 401)
      }

      const { data, error } = await supabase
        .from('shopify_stores')
        .select('shop, access_token')
        .eq('is_active', true)
      if (error) return json({ success: false, error: 'DB_ERROR', details: error.message }, 500)
      stores = (data || []).filter((s: any) => !!s.access_token)
    }

    const results: any[] = []
    for (const s of stores) {
      try {
        const r = await ensureBillingWebhookForShop(s.shop, s.access_token, correctUrl)
        results.push({ success: true, ...r })
      } catch (e: any) {
        results.push({ success: false, shop: s.shop, error: e?.message ?? String(e) })
      }
    }

    return json({ success: true, count: results.length, results })
  } catch (e: any) {
    console.error('❌ fix-billing-webhooks error', e)
    return json({ success: false, error: 'UNEXPECTED', message: e?.message ?? String(e) }, 500)
  }
})

