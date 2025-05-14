
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { FormStep } from '@/lib/form-utils';
import { Json } from '@/integrations/supabase/types';

interface FormData {
  id: string;
  title: string;
  description: string | null;
  data: FormStep[];
  is_published: boolean;
  created_at: string;
  user_id: string;
  shop_id?: string | null;
}

export default function FormAPI() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForm() {
      try {
        if (!id) {
          throw new Error('Form ID is required');
        }

        // Skip API call if id is 'new' since it's a placeholder
        if (id === 'new') {
          setError('Cannot fetch form with id "new"');
          setIsLoading(false);
          return;
        }

        console.log('Fetching form data for ID:', id);
        
        // Call the Supabase Edge Function directly
        const { data, error } = await shopifySupabase.functions.invoke('api-forms', {
          body: { id }
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
      } catch (error: any) {
        console.error('Error in fetchForm:', error);
        setError(error.message || 'Error fetching form');
      } finally {
        setIsLoading(false);
      }
    }

    fetchForm();
  }, [id]);

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
