import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function OAuthGoogleCallback() {
  const [message, setMessage] = useState('Processing Google callback...');

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash || '';
        const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
        const href = decodeURI(window.location.href || '');
        const hasSuccessInHref = /(^|[?#&])success(?:=1|=true|(?=[#&$]))/i.test(href);
        const rawSuccess = params.get('success') || hashParams.get('success') || (hasSuccessInHref ? '1' : null);
        const success = (rawSuccess || '').toString().toLowerCase();
        const code = params.get('code');
        const err = params.get('error');
        console.warn('[OAuthGoogleCallback] href:', href, 'search:', window.location.search, 'hash:', hash, { success, code, err });

        if (err) {
          setMessage(`Google authorization failed: ${err}`);
          return;
        }

        // New flow: the server function already exchanged the code and redirected here with success=1
        if (success === '1' || success === 'true') {
          setMessage('Google connected. You can close this window.');
          try { window.opener?.postMessage({ type: 'GOOGLE_CONNECTED' }, '*'); } catch {}
          // Close window if it's a popup; otherwise just leave success message
          try {
            if (window.opener) setTimeout(() => window.close(), 1200);
          } catch {}
          return;
        }

        // Handle missing code
        if (!code) {
          setMessage('Missing authorization code.');
          return;
        }

        // Prefer server-side flow via Cloudflare Worker in production to avoid CORS
        const origin = window.location.origin;
        const isProdHost = /codmagnet\.com$/i.test(origin);
        if (isProdHost) {
          setMessage('Redirecting to complete Google connection...');
          const search = window.location.search || '';
          const hashStr = window.location.hash || '';
          // This will hit the Cloudflare Worker which forwards to Supabase and redirects back with success
          window.location.replace(`${origin}/auth/google/callback${search}${hashStr}`);
          return;
        }

        // Fallback for development environments: exchange code via Edge Function directly
        const redirect_uri = `${window.location.origin}/oauth/google-callback`;
        const shopId = localStorage.getItem('active_shopify_store') || localStorage.getItem('active_store') || '';
        const { data: userData } = await supabase.auth.getUser();
        const user_id = userData.user?.id ?? null;

        const { data, error } = await supabase.functions.invoke('google-oauth-callback', {
          body: { code, redirect_uri, shop_id: shopId, user_id },
        });
        if (error) throw error;

        setMessage('Google connected. You can close this window.');
        try { window.opener?.postMessage({ type: 'GOOGLE_CONNECTED' }, '*'); } catch {}
        setTimeout(() => window.close(), 1200);
      } catch (e: any) {
        console.error('OAuth callback error', e);
        setMessage(e?.message || 'Failed to complete Google connection');
      }
    };

    run();
  }, []);

  return (
    <div className="p-6 text-center">
      <p>{message}</p>
    </div>
  );
}
