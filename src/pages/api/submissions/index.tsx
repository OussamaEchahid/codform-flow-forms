
import { useEffect, useState } from 'react';
import { shopifySupabase } from '@/lib/shopify/supabase-client';

export default function SubmissionsAPI() {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleRequest() {
      try {
        // Get request method and body if POST
        const method = window.location.search.includes('method=POST') ? 'POST' : 'GET';
        
        if (method === 'POST') {
          // Try to parse body from URL search params (for testing only)
          const searchParams = new URLSearchParams(window.location.search);
          const bodyParam = searchParams.get('body');
          
          let body: any = {};
          
          if (bodyParam) {
            try {
              body = JSON.parse(bodyParam);
            } catch (e) {
              console.error('Failed to parse body param:', e);
            }
          }
          
          // Forward to Supabase Edge Function
          const { data, error } = await shopifySupabase.functions.invoke('api-submissions', {
            body
          });
          
          if (error) {
            throw new Error(error.message || 'Error submitting form');
          }
          
          setResponse(data);
        } else {
          // GET method not supported
          setResponse({ error: 'Method not allowed', message: 'Only POST requests are supported' });
        }
      } catch (error: any) {
        console.error('API Error:', error);
        setError(error.message || 'Unexpected error');
      }
    }

    handleRequest();
  }, []);

  // This component acts as an API endpoint, so it returns JSON
  useEffect(() => {
    if (error) {
      document.body.innerHTML = JSON.stringify({ error }, null, 2);
    } else if (response) {
      document.body.innerHTML = JSON.stringify(response, null, 2);
    }
  }, [response, error]);

  return null;
}
