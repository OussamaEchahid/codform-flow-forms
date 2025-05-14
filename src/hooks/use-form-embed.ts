
import { useState, useEffect } from 'react';

export interface FormEmbedOptions {
  formId: string;
  productId?: string;
  containerId: string;
  hideHeader?: boolean;
  debug?: boolean;
}

/**
 * Hook to properly embed forms in Shopify stores
 */
export function useFormEmbed(options: FormEmbedOptions) {
  const { formId, productId, containerId, hideHeader = true, debug = false } = options;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Log debugging information when enabled
  const logDebug = (message: string, data?: any) => {
    if (debug) {
      console.log(`[FormEmbed] ${message}`, data || '');
    }
  };

  // Validate form ID format (UUID)
  const isValidUuid = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };

  useEffect(() => {
    if (!formId) {
      setError('No form ID provided');
      setLoading(false);
      return;
    }

    if (!isValidUuid(formId)) {
      setError(`Invalid form ID format: ${formId}. Must be a valid UUID.`);
      logDebug('Invalid form ID format', formId);
      setLoading(false);
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      setError(`Container element with ID "${containerId}" not found`);
      logDebug('Container not found', containerId);
      setLoading(false);
      return;
    }

    logDebug('Initializing form embed', { formId, productId, containerId, hideHeader });

    try {
      // Clear any previous content
      container.innerHTML = '';
      
      // Create iframe for embedding the form
      const iframe = document.createElement('iframe');
      
      // Build the correct embed URL
      const embedBaseUrl = "https://codform-flow-forms.lovable.app/embed";
      let embedUrl = `${embedBaseUrl}/${formId}?embedded=true`;
      
      // Add optional parameters
      if (hideHeader) {
        embedUrl += '&hideHeader=true';
      }
      
      if (productId) {
        embedUrl += `&productId=${encodeURIComponent(productId)}`;
      }
      
      // Set iframe attributes
      iframe.src = embedUrl;
      iframe.style.width = '100%';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      iframe.style.overflowY = 'auto';
      iframe.setAttribute('title', 'نموذج الدفع عند الاستلام');
      iframe.setAttribute('id', `codform-iframe-${containerId}`);
      
      // Handle loading state
      iframe.onload = () => {
        setLoading(false);
        logDebug('Form iframe loaded successfully', embedUrl);
      };
      
      // Handle errors
      iframe.onerror = (error) => {
        setError('Failed to load form');
        setLoading(false);
        logDebug('Error loading form iframe', error);
      };
      
      // Setup message handling from the iframe
      const handleMessage = (event: MessageEvent) => {
        // Only accept messages from our form domain
        if (event.origin !== 'https://codform-flow-forms.lovable.app' && 
            event.origin !== 'https://mtyfuwdsshlzqwjujavp.supabase.co') {
          return;
        }
        
        logDebug('Received message from form', event.data);
        
        if (event.data && event.data.type) {
          switch (event.data.type) {
            case 'codform:loaded':
              setLoading(false);
              setError(null);
              break;
              
            case 'codform:submitted':
              setSuccess(true);
              logDebug('Form submitted successfully');
              break;
              
            case 'codform:error':
              setError(event.data.error || 'An error occurred with the form');
              logDebug('Form error received', event.data.error);
              break;
          }
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Add iframe to container
      container.appendChild(iframe);
      
      // Return cleanup function
      return () => {
        window.removeEventListener('message', handleMessage);
        logDebug('Form embed cleanup');
      };
    } catch (err) {
      setError('Failed to initialize form embed');
      setLoading(false);
      logDebug('Error in form embed initialization', err);
    }
  }, [formId, productId, containerId, hideHeader, debug]);

  return {
    loading,
    error,
    success,
    retry: () => {
      setLoading(true);
      setError(null);
      setSuccess(false);
    }
  };
}
