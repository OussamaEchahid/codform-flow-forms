
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

        // Store the settings in a metadata table
        // Note: You need to create this table if it doesn't exist
        const { error } = await supabase
          .from('shopify_product_settings')
          .upsert({
            shop_id: shop,
            product_id: requestBody.productId,
            form_id: requestBody.formId,
            enabled: requestBody.enabled,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'shop_id,product_id'
          });

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
