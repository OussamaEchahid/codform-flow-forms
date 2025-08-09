// Supabase Edge Function: advertising-pixels
// Secure create/delete for advertising_pixels with strict ownership checks
// - Requires JWT (verify_jwt = true in supabase/config.toml)
// - Uses service role to bypass RLS after validating ownership
// - Provides CORS for web usage

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })

  const json = async (body: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(body, null, 2), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      ...init,
    })

  try {
    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData?.user) {
      return json({ success: false, error: 'UNAUTHORIZED', details: authErr?.message }, { status: 401 })
    }
    const user = authData.user

    const body = await req.json().catch(() => ({}))
    const action = body?.action as 'create' | 'delete'
    const shop_id = (body?.shop_id || body?.payload?.shop_id) as string | undefined

    if (!action) {
      return json({ success: false, error: 'MISSING_ACTION' }, { status: 400 })
    }
    if (!shop_id) {
      return json({ success: false, error: 'MISSING_SHOP_ID' }, { status: 400 })
    }

    // Verify the caller owns the shop
    const { data: storeRow, error: storeErr } = await supabase
      .from('shopify_stores')
      .select('shop')
      .eq('shop', shop_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (storeErr) {
      return json({ success: false, error: 'STORE_CHECK_FAILED', details: storeErr.message }, { status: 500 })
    }
    if (!storeRow) {
      return json({ success: false, error: 'FORBIDDEN', message: 'User does not own this shop' }, { status: 403 })
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
        user_id: user.id,
      }

      if (!record.name || !record.pixel_id) {
        return json({ success: false, error: 'VALIDATION_ERROR', message: 'name and pixel_id are required' }, { status: 400 })
      }

      const { data, error } = await supabase.from('advertising_pixels').insert([record]).select().maybeSingle()
      if (error) {
        return json({ success: false, error: 'DB_INSERT_FAILED', details: error.message }, { status: 400 })
      }
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