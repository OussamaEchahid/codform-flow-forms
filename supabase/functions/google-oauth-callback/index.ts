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
    let redirectUri = url.searchParams.get('redirect_uri') || '';
    let shopId = url.searchParams.get('shop_id') || '';
    let userId: string | null = url.searchParams.get('user_id') || null;

    // Also accept JSON body for POST invocations
    if (!code || !redirectUri || !shopId) {
      try {
        const body = await req.json().catch(() => null) as any;
        if (body) {
          code = code || body.code || '';
          redirectUri = redirectUri || body.redirect_uri || body.redirectUri || '';
          shopId = shopId || body.shop_id || body.shopId || '';
          userId = userId || body.user_id || body.userId || null;
        }
      } catch (_) {
        // ignore body parse errors
      }
    }

    if (!code || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'missing_parameters', message: 'code and redirect_uri are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';

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

    // Optionally fetch user email
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
      return new Response(JSON.stringify({ error: 'save_failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
