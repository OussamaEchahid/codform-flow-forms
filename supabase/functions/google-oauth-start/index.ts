import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({})) as any;
    
    const shopId = body.shop_id || '';
    const userId = body.user_id || '';
    const redirectUri = body.redirect_uri || '';

    if (!redirectUri) {
      return new Response(
        JSON.stringify({ error: 'missing_redirect_uri' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
    
    const scope = encodeURIComponent([
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/spreadsheets'
    ].join(' '));

    // Store context in state parameter
    const statePayload = { s: shopId, u: userId, r: redirectUri };
    const state = encodeURIComponent(btoa(JSON.stringify(statePayload)));

    // Use the exact redirect_uri from frontend
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;

    return new Response(JSON.stringify({ 
      url: authUrl, 
      auth_url: authUrl,
      state,
      redirect_uri: redirectUri 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('OAuth start error:', e);
    return new Response(
      JSON.stringify({ error: e?.message || 'failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});