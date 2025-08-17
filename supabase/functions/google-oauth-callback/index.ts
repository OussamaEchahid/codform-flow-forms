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

    // Enhanced debugging for the callback
    const url = new URL(req.url);
    console.log('🔗 OAuth Callback Debug:', {
      method: req.method,
      fullUrl: req.url,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams.entries()),
      headers: Object.fromEntries(req.headers.entries())
    });

    // Handle both GET (direct callback) and POST (from frontend)
    let code = '';
    let shopId = '';
    let userId = '';
    let redirectUri = '';

    if (req.method === 'GET') {
      code = url.searchParams.get('code') || '';
      const state = url.searchParams.get('state') || '';
      const error = url.searchParams.get('error') || '';
      const errorDescription = url.searchParams.get('error_description') || '';
      
      console.log('📥 GET Parameters:', {
        code: code ? 'Present (' + code.length + ' chars)' : 'Missing',
        state: state ? 'Present' : 'Missing',
        error,
        errorDescription,
        allParams: Object.fromEntries(url.searchParams.entries())
      });

      if (error) {
        return new Response(
          JSON.stringify({ 
            error: 'oauth_error', 
            details: error,
            description: errorDescription 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      if (state) {
        try {
          const decoded = JSON.parse(atob(decodeURIComponent(state)));
          shopId = decoded.s || '';
          userId = decoded.u || '';
          redirectUri = decoded.r || '';
          console.log('🔓 State decoded:', { shopId, userId, redirectUri });
        } catch (e) {
          console.error('❌ State decode error:', e);
        }
      }
    } else {
      const body = await req.json().catch(() => ({})) as any;
      code = body.code || '';
      shopId = body.shop_id || '';
      userId = body.user_id || '';
      redirectUri = body.redirect_uri || '';
      console.log('📨 POST Body:', { code: code ? 'Present' : 'Missing', shopId, userId, redirectUri });
    }

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'missing_code', message: 'Authorization code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';

    // Use the same redirect_uri that was used in the auth request
    const tokenRedirectUri = redirectUri || `${req.headers.get('origin')}/oauth/google-callback`;

    console.log('Token exchange with redirect_uri:', tokenRedirectUri);

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: tokenRedirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Token exchange failed:', tokens);
      return new Response(JSON.stringify({ 
        error: 'token_exchange_failed', 
        details: tokens,
        redirect_uri_used: tokenRedirectUri
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    // Fetch user email
    let email: string | null = null;
    try {
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (infoRes.ok) {
        const info = await infoRes.json();
        email = info.email || null;
      }
    } catch (e) {
      console.error('Failed to fetch user info:', e);
    }

    // Store tokens
    const { error } = await supabase
      .from('google_oauth_tokens')
      .upsert({
        user_id: userId || null,
        shop_id: shopId || null,
        email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || 'Bearer',
        scope: tokens.scope,
        expiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,shop_id'
      });

    if (error) {
      console.error('Saving tokens failed:', error);
      return new Response(
        JSON.stringify({ error: 'save_failed', details: error?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // For GET requests (direct callbacks), redirect to frontend with success
    if (req.method === 'GET' && redirectUri) {
      try {
        const target = new URL(redirectUri);
        target.searchParams.set('success', '1');
        return new Response(null, { 
          status: 302, 
          headers: { ...corsHeaders, Location: target.toString() } 
        });
      } catch (e) {
        console.error('Redirect error:', e);
      }
    }

    // For POST requests, return JSON success
    return new Response(JSON.stringify({ 
      success: true, 
      email,
      message: 'Google account connected successfully' 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200 
    });

  } catch (e) {
    console.error('OAuth callback error:', e);
    return new Response(JSON.stringify({ 
      error: e?.message || 'failed',
      stack: e?.stack 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500 
    });
  }
});