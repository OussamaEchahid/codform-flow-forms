import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function OAuthGoogleCallback() {
  console.log('🚀 OAuthGoogleCallback component is loading!');
  const [message, setMessage] = useState('Processing Google callback...');

  useEffect(() => {
    console.log('🚀 useEffect is running!');
    
    try {
      // Immediate check without async
      const fullUrl = window.location.href;
      console.log('🔍 Full URL:', fullUrl);
      
      if (fullUrl.includes('success=1') || fullUrl.includes('success=true')) {
        console.log('✅ Success detected in URL');
        setMessage('Google connected successfully! Closing window...');
        try { 
          window.opener?.postMessage({ type: 'GOOGLE_CONNECTED' }, '*'); 
        } catch (e) {
          console.log('Could not post message to opener:', e);
        }
        setTimeout(() => {
          console.log('Attempting to close window');
          window.close();
        }, 1200);
        return;
      }
      
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');
      
      console.log('🔍 Parsed params:', { code: !!code, error });
      
      if (error) {
        setMessage(`Google authorization failed: ${error}`);
        return;
      }
      
      if (!code) {
        setMessage('Missing authorization code.');
        return;
      }
      
      // Handle the code case
      console.log('Processing code...');
      setMessage('Processing authorization code...');
      
    } catch (e) {
      console.error('Error in useEffect:', e);
      setMessage('Error processing callback');
    }
  }, []);

  console.log('🎨 OAuthGoogleCallback component is rendering with message:', message);
  
  return (
    <div className="p-6 text-center">
      <p>{message}</p>
    </div>
  );
}
