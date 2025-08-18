import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function OAuthGoogleCallback() {
  console.log('🚀 OAuthGoogleCallback component is loading!');
  const [message, setMessage] = useState('Processing Google callback...');

  useEffect(() => {
    const run = async () => {
      try {
        // Detailed logging for debugging
        console.log('🔍 OAuth Callback Debug - Full URL:', window.location.href);
        console.log('🔍 Query string:', window.location.search);
        console.log('🔍 Hash:', window.location.hash);
        
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash || '';
        const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
        
        // Multiple ways to check for success parameter
        const successQuery = params.get('success');
        const successHash = hashParams.get('success');
        const successInUrl = window.location.href.includes('success=1') || window.location.href.includes('success=true');
        const success = successQuery || successHash || (successInUrl ? '1' : null);
        
        const code = params.get('code');
        const err = params.get('error');
        
        console.log('🔍 Parsed values:');
        console.log('  - success (query):', successQuery);
        console.log('  - success (hash):', successHash);
        console.log('  - success (in URL):', successInUrl);
        console.log('  - final success:', success);
        console.log('  - code:', code ? 'present' : 'missing');
        console.log('  - error:', err);

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

  console.log('🎨 OAuthGoogleCallback component is rendering with message:', message);
  
  return (
    <div className="p-6 text-center">
      <p>{message}</p>
    </div>
  );
}
