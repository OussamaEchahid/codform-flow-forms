
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

        // Use the main supabase client with forms table, not the shopify-specific one
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', id)
          .eq('is_published', true)
          .single();

        if (error) {
          throw error;
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
