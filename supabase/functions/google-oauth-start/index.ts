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
    const url = new URL(req.url);

    // Try to get redirect_uri from query, body, or fallback to Origin
    let redirectUri = url.searchParams.get('redirect_uri') || '';

    if (!redirectUri) {
      try {
        const body = await req.json().catch(() => null) as any;
        if (body && (body.redirect_uri || body.redirectUri)) {
          redirectUri = body.redirect_uri || body.redirectUri;
        }
      } catch (_) {
        // ignore
      }
    }

    if (!redirectUri) {
      const origin = req.headers.get('origin') || '';
      if (origin) {
        redirectUri = `${origin}/oauth/google-callback`;
      }
    }

    if (!redirectUri) {
      return new Response(
        JSON.stringify({ error: 'missing_redirect_uri', message: 'redirect_uri is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
    const scope = encodeURIComponent([
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/spreadsheets'
    ].join(' '));

    const state = crypto.randomUUID();

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;

    return new Response(JSON.stringify({ url: authUrl, auth_url: authUrl, state }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e?.message || 'failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
