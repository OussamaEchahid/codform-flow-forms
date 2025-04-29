
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function SubmissionsAPI() {
  const [response, setResponse] = useState<{success?: boolean; error?: string}>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function handleSubmission() {
      try {
        // Get the request body
        const requestBody = JSON.parse(document.body.innerText);
        
        if (!requestBody.formId || !requestBody.data) {
          throw new Error('Missing required fields: formId or data');
        }

        // Store the submission in Supabase
        const { error } = await supabase
          .from('form_submissions')
          .insert({
            form_id: requestBody.formId,
            data: requestBody.data,
            shop_id: requestBody.data.shopDomain || null,
            user_id: null // Anonymous submission
          });

        if (error) {
          throw error;
        }

        setResponse({ success: true });
      } catch (error: any) {
        console.error('Submission error:', error);
        setResponse({ error: error.message || 'Error processing submission' });
      } finally {
        setIsLoading(false);
      }
    }

    if (document.body.innerText) {
      handleSubmission();
    } else {
      setIsLoading(false);
      setResponse({ error: 'No data provided' });
    }
  }, []);

  // This component acts as an API endpoint, so it returns JSON
  useEffect(() => {
    if (!isLoading) {
      document.body.innerHTML = JSON.stringify(response, null, 2);
    }
  }, [isLoading, response]);

  return null;
}
