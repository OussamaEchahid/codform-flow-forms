
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
        // Get current URL to extract form ID
        const currentUrl = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        
        // Extract form ID from URL or params
        let formId = urlParams.get('formId');
        
        // If formId is not in params, try to extract from current route
        if (!formId) {
          const pathMatch = currentUrl.match(/\/form-builder\/([a-f0-9-]{36})/);
          if (pathMatch) {
            formId = pathMatch[1];
          }
        }
        
        // Get form data from URL parameters or request body
        let data = {};
        
        // Try to parse body as JSON if this is a POST request
        try {
          const bodyText = document.body.textContent || '';
          if (bodyText) {
            const bodyData = JSON.parse(bodyText);
            data = bodyData.data || bodyData || {};
          }
        } catch (e) {
          console.error('Failed to parse body as JSON:', e);
        }
        
        // Get shop domain from localStorage or URL
        const shopDomain = localStorage.getItem('shopify_store') || 
                          localStorage.getItem('shopify_active_store') ||
                          urlParams.get('shopDomain');
        
        if (!formId || !shopDomain) {
          throw new Error('Form ID and Shop Domain are required');
        }

        console.log('Processing submission for form:', formId, 'shop:', shopDomain, 'with data:', data);
        
        // Call the Supabase Edge Function with correct parameters
        const { data: result, error } = await shopifySupabase.functions.invoke('api-submissions', {
          body: { 
            formId: formId,
            shopDomain: shopDomain,
            data: data
          }
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
