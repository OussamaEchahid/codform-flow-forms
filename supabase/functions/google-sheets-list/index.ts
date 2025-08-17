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

  // Refresh if expired
  if (tokenRow.expiry && new Date(tokenRow.expiry).getTime() < Date.now() - 60_000 && tokenRow.refresh_token) {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';

    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenRow.refresh_token,
        grant_type: 'refresh_token'
      })
    });
    const refreshed = await refreshRes.json();
    if (refreshRes.ok && refreshed.access_token) {
      await supabase.from('google_oauth_tokens').update({
        access_token: refreshed.access_token,
        expiry: refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString() : tokenRow.expiry
      }).eq('id', tokenRow.id);
      return refreshed.access_token;
    }
  }
  return tokenRow.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    let body: any = null;
    if (req.method !== 'GET') {
      body = await req.json().catch(() => null);
    }

    const shopId = url.searchParams.get('shop_id') || body?.shop_id || body?.shopId || '';
    const spreadsheetId = url.searchParams.get('spreadsheet_id') || body?.spreadsheet_id || body?.spreadsheetId;

    const token = await getValidAccessToken(supabase, shopId);
    if (!token) {
      return new Response(JSON.stringify({ error: 'not_connected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    if (!spreadsheetId) {
      // List spreadsheets via Drive API
      const driveRes = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType%3D%22application%2Fvnd.google-apps.spreadsheet%22&fields=files(id%2Cname)', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const files = await driveRes.json();
      return new Response(JSON.stringify({ spreadsheets: files.files || [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    } else {
      // List sheets (tabs) via Sheets API
      const sheetsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sheets = await sheetsRes.json();
      const tabs = (sheets.sheets || []).map((s: any) => ({ id: s.properties.sheetId, title: s.properties.title }));
      return new Response(JSON.stringify({ sheets: tabs }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});

