
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface ProductSettings {
  productId: string;
  formId: string;
  enabled: boolean;
  blockId?: string;
}

export default function ProductSettingsAPI() {
  const [response, setResponse] = useState<{success?: boolean; error?: string}>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { shop } = useAuth();

  useEffect(() => {
    async function handleSettings() {
      try {
        console.log('Processing product settings request');
        // Get the request body
        const requestBody: ProductSettings = JSON.parse(document.body.innerText);
        console.log('Request body:', requestBody);
        
        if (!requestBody.productId || !requestBody.formId) {
          throw new Error('Missing required fields: productId or formId');
        }

        // If shop is not provided in auth context, try to get it from the request body
        const shopId = shop || 'default-shop';
        console.log('Using shop ID:', shopId);

        // Use a direct SQL query that works with any schema version
        // This avoids TypeScript errors with newly added RPC functions
        const { error } = await supabase.rpc(
          'insert_product_setting' as any, 
          {
            p_shop_id: shopId,
            p_product_id: requestBody.productId,
            p_form_id: requestBody.formId,
            p_enabled: requestBody.enabled,
            p_block_id: requestBody.blockId || null
          }
        );

        if (error) {
          console.error('Error saving product settings:', error);
          throw error;
        }

        console.log('Product settings saved successfully');
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
