
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

// A simplified type for form data to avoid recursion
interface FormTemplate {
  id?: string;
  title: string;
  description?: string;
  data: any;
}

export const useFormTemplates = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const getFormById = useCallback(async (formId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
      
      if (fetchError) {
        throw new Error(`Error fetching form: ${fetchError.message}`);
      }
      
      if (!data) {
        throw new Error('Form not found');
      }
      
      // Use structuredClone or JSON parsing to break any potential circular references
      return {
        ...data,
        // Create a fresh copy of the data to break potential circular references
        data: JSON.parse(JSON.stringify(data.data)),
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching form';
      setError(errorMessage);
      console.error('Error in getFormById:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewForm = useCallback(async (formData: FormTemplate) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a simplified version of form data to prevent deep type issues
      const formToCreate = {
        title: formData.title,
        description: formData.description || null,
        data: JSON.parse(JSON.stringify(formData.data)), // Create a fresh copy
        user_id: user?.id,
        is_published: true
      };
      
      const { data, error: createError } = await supabase
        .from('forms')
        .insert(formToCreate)
        .select()
        .single();
      
      if (createError) {
        throw new Error(`Error creating form: ${createError.message}`);
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating form';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error in createNewForm:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const saveForm = useCallback(async (formId: string, formData: Partial<FormTemplate>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a simplified version of form data to prevent deep type issues
      const formToUpdate: any = {};
      
      if (formData.title !== undefined) formToUpdate.title = formData.title;
      if (formData.description !== undefined) formToUpdate.description = formData.description;
      if (formData.data !== undefined) {
        formToUpdate.data = JSON.parse(JSON.stringify(formData.data)); // Create a fresh copy
      }
      
      const { data, error: updateError } = await supabase
        .from('forms')
        .update(formToUpdate)
        .eq('id', formId)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Error updating form: ${updateError.message}`);
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating form';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error in saveForm:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getFormById,
    createNewForm,
    saveForm
  };
};
