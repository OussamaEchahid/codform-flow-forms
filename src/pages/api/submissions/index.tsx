
import { useEffect, useState } from 'react';
import { shopifySupabase } from '@/lib/shopify/supabase-client';

interface SubmissionResponse {
  success: boolean;
  message: string;
  submissionId?: string;
  error?: string;
}

export default function SubmissionAPI() {
  const [response, setResponse] = useState<SubmissionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleSubmission() {
      try {
        // Get request body from URL parameters or request body
        const urlParams = new URLSearchParams(window.location.search);
        let formId = urlParams.get('formId');
        let data = {};
        
        // Try to parse body as JSON if this is a POST request
        try {
          const bodyText = document.body.textContent || '';
          if (bodyText) {
            const bodyData = JSON.parse(bodyText);
            formId = bodyData.formId || formId;
            data = bodyData.data || {};
          }
        } catch (e) {
          console.error('Failed to parse body as JSON:', e);
        }
        
        if (!formId) {
          throw new Error('Form ID is required');
        }

        console.log('Processing submission for form:', formId, 'with data:', data);
        
        // Call the Supabase Edge Function
        const { data: result, error } = await shopifySupabase.functions.invoke('api-submissions', {
          body: { formId, data }
        });

        if (error) {
          console.error('Error calling api-submissions function:', error);
          throw new Error(error.message || 'Error processing submission');
        }

        // Return success response
        setResponse({
          success: true,
          message: 'Form submitted successfully',
          submissionId: result.submissionId
        });
      } catch (error: any) {
        console.error('Error in handleSubmission:', error);
        setError(error.message || 'Error processing submission');
        setResponse({
          success: false,
          message: 'Error submitting form',
          error: error.message || 'Unknown error'
        });
      } finally {
        setIsLoading(false);
      }
    }

    handleSubmission();
  }, []);

  // This component acts as an API endpoint, so it returns JSON
  useEffect(() => {
    if (!isLoading) {
      if (error) {
        document.body.innerHTML = JSON.stringify({ 
          success: false, 
          error: error 
        }, null, 2);
      } else if (response) {
        document.body.innerHTML = JSON.stringify(response, null, 2);
      }
    }
  }, [isLoading, error, response]);

  return null;
}
