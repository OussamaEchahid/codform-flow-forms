// Supabase Edge Function: advertising-pixels
// Secure create/delete/list for advertising_pixels with layered checks
// Current mode: public callable (verify_jwt = false) but validates store state in DB
// Uses service role (server-side) and CORS

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin',
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const json = async (body: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(body, null, 2), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      ...init,
    })

  try {
    const body = await req.json().catch(() => ({}))
    const action = body?.action as 'create' | 'delete' | 'list'
    const shop_id = (body?.shop_id || body?.payload?.shop_id) as string | undefined

    if (!action) return json({ success: false, error: 'MISSING_ACTION' }, { status: 400 })
    if (!shop_id) return json({ success: false, error: 'MISSING_SHOP_ID' }, { status: 400 })

    // Resolve store and owner
    const { data: store, error: storeErr } = await supabase
      .from('shopify_stores')
      .select('shop, user_id, is_active, access_token')
      .eq('shop', shop_id)
      .maybeSingle()

    if (storeErr) return json({ success: false, error: 'STORE_CHECK_FAILED', details: storeErr.message }, { status: 500 })
    if (!store || !store.is_active || !store.access_token || store.access_token === 'placeholder_token') {
      return json({ success: false, error: 'SHOP_NOT_ELIGIBLE', message: 'Store not active or missing token' }, { status: 403 })
    }

    if (action === 'list') {
      const { data, error } = await supabase
        .from('advertising_pixels')
        .select('id, shop_id, name, platform, pixel_id, event_type, target_type, target_id, conversion_api_enabled, enabled, created_at, updated_at')
        .eq('shop_id', shop_id)
        .order('created_at', { ascending: false })

      if (error) return json({ success: false, error: 'DB_LIST_FAILED', details: error.message }, { status: 400 })
      return json({ success: true, records: data ?? [] })
    }

    if (action === 'create') {
      const payload = body?.payload ?? {}
      const record = {
        name: String(payload.name ?? '').trim(),
        platform: String(payload.platform ?? 'Facebook'),
        pixel_id: String(payload.pixel_id ?? '').trim(),
        event_type: String(payload.event_type ?? 'Lead'),
        target_type: String(payload.target_type ?? 'All'),
        target_id: payload.target_id ? String(payload.target_id) : null,
        access_token: payload.access_token ? String(payload.access_token) : null,
        conversion_api_enabled: Boolean(payload.conversion_api_enabled ?? false),
        enabled: true,
        shop_id,
        user_id: store.user_id ?? '36d7eb85-0c45-4b4f-bea1-a9cb732ca893',
      }

      if (!record.name || !record.pixel_id) {
        return json({ success: false, error: 'VALIDATION_ERROR', message: 'name and pixel_id are required' }, { status: 400 })
      }

      const { data, error } = await supabase.from('advertising_pixels').insert([record]).select().maybeSingle()
      if (error) return json({ success: false, error: 'DB_INSERT_FAILED', details: error.message }, { status: 400 })
      return json({ success: true, data })
    }

    if (action === 'delete') {
      const id = body?.id as string | undefined
      if (!id) return json({ success: false, error: 'MISSING_ID' }, { status: 400 })

      const { error } = await supabase.from('advertising_pixels').delete().eq('id', id).eq('shop_id', shop_id)
      if (error) return json({ success: false, error: 'DB_DELETE_FAILED', details: error.message }, { status: 400 })
      return json({ success: true })
    }

    return json({ success: false, error: 'UNSUPPORTED_ACTION' }, { status: 400 })
  } catch (e: any) {
    return json({ success: false, error: 'UNEXPECTED_ERROR', details: e?.message ?? String(e) }, { status: 500 })
  }
})