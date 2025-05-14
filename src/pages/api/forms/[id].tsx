
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { FormStep } from '@/lib/form-utils';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

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

        console.log('Fetching form data for ID:', id);
        
        // Validate the form ID format first
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
          console.error('Invalid form ID format:', id);
          throw new Error('Invalid form ID format. Please use a valid UUID format like: "6942b35d-ad06-40fb-8f70-86230d20b0fd"');
        }
        
        // Try to fetch using edge function with improved error handling
        try {
          // Call the Supabase Edge Function directly
          const { data, error } = await shopifySupabase.functions.invoke('api-forms', {
            body: { id }
          });

          if (error) {
            console.error('Error calling api-forms function:', error);
            throw new Error(error.message || 'Error fetching form');
          }

          if (!data) {
            throw new Error('Form not found or not published');
          }

          // Properly cast the data to FormData with correct type for the 'data' field
          const formData: FormData = {
            ...data,
            data: data.data as unknown as FormStep[]
          };

          // Return the form data as JSON
          setForm(formData);
        } catch (funcError: any) {
          console.error('Edge function error:', funcError);
          
          // Try direct database access as fallback
          const { data, error: dbError } = await shopifySupabase
            .from('forms')
            .select('*')
            .eq('id', id)
            .eq('is_published', true)
            .single();
            
          if (dbError) {
            console.error('Database error:', dbError);
            if (dbError.code === 'PGRST116') {
              throw new Error(`Form with ID ${id} not found or not published`);
            }
            throw new Error(dbError.message || 'Error fetching form from database');
          }
          
          if (!data) {
            throw new Error('Form not found or not published');
          }
          
          // Format the data
          const formData: FormData = {
            ...data,
            data: data.data as unknown as FormStep[]
          };
          
          setForm(formData);
        }
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
        document.body.innerHTML = JSON.stringify({ 
          error, 
          formId: id,
          timestamp: new Date().toISOString(),
          message: 'تأكد من أن معرف النموذج بالتنسيق الصحيح (UUID) وأن النموذج منشور'
        }, null, 2);
      } else if (form) {
        document.body.innerHTML = JSON.stringify(form, null, 2);
      }
    }
  }, [isLoading, error, form, id]);

  return null;
}
