
import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { FormStep } from '@/lib/form-utils';
import { Json } from '@/integrations/supabase/types';

interface FormData {
  id: string;
  title: string;
  description: string | null;
  data: FormStep[];
  is_published: boolean;
  is_default?: boolean;
  created_at: string;
  user_id: string;
  shop_id?: string | null;
}

export default function FormAPI() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [form, setForm] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForm() {
      try {
        // Extract parameters for form lookup
        const searchParams = new URLSearchParams(location.search);
        const productId = searchParams.get('productId');
        const shopId = searchParams.get('shopId') || searchParams.get('shop');

        // If product ID and shop ID are provided but no form ID, we need to find the appropriate form
        if (!id && productId && shopId) {
          console.log(`Looking up appropriate form for product ${productId} in shop ${shopId}`);
          
          try {
            // Call the API to resolve the form
            const { data, error } = await shopifySupabase.functions.invoke('api-forms', {
              body: { 
                productId, 
                shop: shopId 
              }
            });

            if (error) {
              console.error('Error resolving form for product:', error);
              throw new Error(error.message || 'Error resolving form for product');
            }

            if (!data) {
              throw new Error('No suitable form found');
            }

            // Return the resolved form data
            setForm(data as FormData);
            setIsLoading(false);
            return;
          } catch (e: any) {
            console.error('Error in form resolution:', e);
            throw new Error(e.message || 'Error finding suitable form');
          }
        } else if (!id) {
          throw new Error('Form ID is required');
        }

        // Skip API call if id is 'new' since it's a placeholder
        if (id === 'new') {
          console.log('Cannot fetch form with id "new", it will be redirected');
          setError('Form with ID "new" is being redirected to create a new form');
          setIsLoading(false);
          return;
        }
        
        console.log('Fetching form data for ID:', id, productId ? `and product: ${productId}` : '');
        
        try {
          // Try to validate if the ID is a valid UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(id)) {
            console.error(`Invalid UUID format: "${id}"`);
            throw new Error(`Invalid UUID format: "${id}"`);
          }
          
          // Prepare the request body with optional productId and shopId
          const requestBody: Record<string, any> = { id };
          if (productId) {
            requestBody.productId = productId;
          }
          if (shopId) {
            requestBody.shop = shopId;
          }
          
          // Call the Supabase Edge Function directly
          const { data, error } = await shopifySupabase.functions.invoke('api-forms', {
            body: requestBody
          });

          if (error) {
            console.error('Error calling api-forms function:', error);
            throw new Error(error.message || 'Error fetching form');
          }

          if (!data) {
            throw new Error('Form not found');
          }

          // Properly cast the data to FormData with correct type for the 'data' field
          const formData: FormData = {
            ...data,
            data: data.data as unknown as FormStep[]
          };

          // Return the form data as JSON
          setForm(formData);
        } catch (e: any) {
          console.error('Error in API call:', e);
          throw new Error(e.message || 'Error processing form data');
        }
      } catch (error: any) {
        console.error('Error in fetchForm:', error);
        setError(error.message || 'Error fetching form');
      } finally {
        setIsLoading(false);
      }
    }

    fetchForm();
  }, [id, location.search]);

  // This component acts as an API endpoint, so it returns JSON
  useEffect(() => {
    if (!isLoading) {
      if (error) {
        document.body.innerHTML = JSON.stringify({ error }, null, 2);
      } else if (form) {
        document.body.innerHTML = JSON.stringify(form, null, 2);
      }
    }
  }, [isLoading, error, form]);

  return null;
}
