import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function OAuthGoogleCallback() {
  const [message, setMessage] = useState('Processing Google callback...');

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const code = params.get('code');
        const err = params.get('error');

        if (err) {
          setMessage(`Google authorization failed: ${err}`);
          return;
        }

        // New flow: the server function already exchanged the code and redirected here with success=1
        if (success === '1' || success === 'true') {
          setMessage('Google connected. You can close this window.');
          try { window.opener?.postMessage({ type: 'GOOGLE_CONNECTED' }, '*'); } catch {}
          setTimeout(() => window.close(), 1200);
          return;
        }

        // Backward compatibility: handle code on the client if present
        if (!code) {
          setMessage('Missing authorization code.');
          return;
        }

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
