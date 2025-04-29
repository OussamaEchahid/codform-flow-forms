
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface ProductSettings {
  productId: string;
  formId: string;
  enabled: boolean;
}

export default function ProductSettingsAPI() {
  const [response, setResponse] = useState<{success?: boolean; error?: string}>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { shop } = useAuth();

  useEffect(() => {
    async function handleSettings() {
      try {
        // Get the request body
        const requestBody: ProductSettings = JSON.parse(document.body.innerText);
        
        if (!requestBody.productId || !requestBody.formId) {
          throw new Error('Missing required fields: productId or formId');
        }

        if (!shop) {
          throw new Error('Shop not authenticated');
        }

        // Use a more generic approach to work with tables that might not be in the type definitions
        // We'll use the raw query method instead which accepts any table name
        const { error } = await supabase.rpc(
          'insert_product_setting', 
          {
            p_shop_id: shop,
            p_product_id: requestBody.productId,
            p_form_id: requestBody.formId,
            p_enabled: requestBody.enabled
          }
        );

        if (error) {
          throw error;
        }

        setResponse({ success: true });
      } catch (error: any) {
        console.error('Settings error:', error);
        setResponse({ error: error.message || 'Error saving product settings' });
      } finally {
        setIsLoading(false);
      }
    }

    if (document.body.innerText) {
      handleSettings();
    } else {
      setIsLoading(false);
      setResponse({ error: 'No data provided' });
    }
  }, [shop]);

  // This component acts as an API endpoint, so it returns JSON
  useEffect(() => {
    if (!isLoading) {
      document.body.innerHTML = JSON.stringify(response, null, 2);
    }
  }, [isLoading, response]);

  return null;
}
