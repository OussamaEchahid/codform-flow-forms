import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getValidAccessToken(supabase: any, shopId: string) {
  const { data: tokenRow } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('shop_id', shopId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (!tokenRow) return null;
  if (tokenRow.expiry && new Date(tokenRow.expiry).getTime() < Date.now() - 60_000 && tokenRow.refresh_token) {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: tokenRow.refresh_token, grant_type: 'refresh_token' })
    });
    const refreshed = await refreshRes.json();
    if (refreshRes.ok && refreshed.access_token) {
      await supabase.from('google_oauth_tokens').update({ access_token: refreshed.access_token, expiry: refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString() : tokenRow.expiry }).eq('id', tokenRow.id);
      return refreshed.access_token;
    }
  }
  return tokenRow.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const body = await req.json();
    const { shop_id, spreadsheet_id, sheet_title, values } = body;

    const token = await getValidAccessToken(supabase, shop_id);
    if (!token) return new Response(JSON.stringify({ error: 'not_connected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });

    const appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${encodeURIComponent(sheet_title)}:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ values })
    });

    const result = await appendRes.json();
    if (!appendRes.ok) {
      console.error('Append failed:', result);
      return new Response(JSON.stringify({ error: 'append_failed', details: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
    return new Response(JSON.stringify({ success: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});

