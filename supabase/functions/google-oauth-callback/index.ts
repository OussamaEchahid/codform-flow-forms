import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    let code = url.searchParams.get('code') || '';

    // Decode app context from state (preferred)
    let shopId = '' as string;
    let userId: string | null = null;
    let appRedirect = '' as string;
    const state = url.searchParams.get('state') || '';
    if (state) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(state)));
        shopId = decoded.s || '';
        userId = decoded.u || null;
        appRedirect = decoded.r || '';
      } catch (_) {
        // ignore state parse errors
      }
    }

    // Accept JSON body fallback
    if (!code) {
      try {
        const body = await req.json().catch(() => null) as any;
        if (body) {
          code = body.code || code;
          shopId = body.shop_id || body.shopId || shopId;
          userId = body.user_id || body.userId || userId;
          appRedirect = body.app_redirect || appRedirect;
        }
      } catch (_) {}
    }

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'missing_code', message: 'Authorization code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';

    // Our redirect_uri for token exchange must equal the one used in the auth request
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Token exchange failed:', tokens);
      return new Response(JSON.stringify({ error: 'token_exchange_failed', details: tokens }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Fetch user email (optional)
    let email: string | null = null;
    try {
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (infoRes.ok) {
        const info = await infoRes.json();
        email = info.email || null;
      }
    } catch (_) {}

    // Store tokens
    const { error } = await supabase
      .from('google_oauth_tokens')
      .insert({
        user_id: userId,
        shop_id: shopId,
        email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        scope: tokens.scope,
        expiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null
      });

    if (error) {
      console.error('Saving tokens failed:', error);
      return new Response(
        JSON.stringify({ error: 'save_failed', details: error?.message || error, code: (error as any)?.code }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Prefer a server-side redirect to the app-provided URL; fallback to Origin/FRONTEND_URL + '/oauth/google-callback'
    let redirectTarget = appRedirect;
    if (!redirectTarget) {
      const origin = req.headers.get('origin') || '';
      if (origin) redirectTarget = `${origin.replace(/\/$/, '')}/oauth/google-callback`;
    }
    if (!redirectTarget) {
      const frontend = Deno.env.get('FRONTEND_URL') || '';
      if (frontend) redirectTarget = `${frontend.replace(/\/$/, '')}/oauth/google-callback`;
    }

    if (redirectTarget) {
      try {
        const target = new URL(redirectTarget);
        target.searchParams.set('success', '1');
        return new Response(null, { status: 302, headers: { ...corsHeaders, Location: target.toString() } });
      } catch (_) {
        // fall through
      }
    }

    // Last-resort HTML without scripts/styles (CSP-safe)
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Google Connected</title></head>
<body>Google account connected. <a href="/">Continue</a></body></html>`;
    return new Response(html, { headers: { ...corsHeaders, 'Content-Type': 'text/html' }, status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
