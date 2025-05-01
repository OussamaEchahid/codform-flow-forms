
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define the form data interface
export interface FormData {
  id: string;
  title: string;
  description?: string;
  data: any[];
  sectionConfig?: any;
  style?: any;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  shop_id?: string;
}

// Create a cache for forms to reduce database calls
const formCache = new Map();

export const useFormTemplates = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forms, setForms] = useState<FormData[]>([]);

  // Function to clear form cache when needed
  const clearFormCache = useCallback(() => {
    console.log('Clearing form cache');
    formCache.clear();
    return Promise.resolve();
  }, []);

  // Function to fetch all forms
  const fetchForms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching all forms');
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching forms:', error);
        throw error;
      }
      
      console.log('Fetched forms:', data);
      setForms(data || []);
      return data;
    } catch (err: any) {
      console.error('Error in fetchForms:', err);
      setError(err?.message || 'An error occurred while fetching forms');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a form by ID with caching
  const getFormById = useCallback(async (formId: string): Promise<FormData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('getFormById called for ID:', formId);

      // Check cache first
      if (formCache.has(formId)) {
        console.log('Form found in cache');
        const cachedForm = formCache.get(formId);
        setIsLoading(false);
        return cachedForm;
      }

      console.log('Form not in cache, fetching from database');
      
      // If running in development or testing mode and seeing the network error,
      // you can use this mock data for testing
      if (process.env.NODE_ENV === 'development' && window.location.search.includes('mock=true')) {
        console.log('Using mock data for form');
        const mockForm = {
          id: formId,
          title: 'Mock Form (Development Mode)',
          description: 'This is a mock form for development',
          data: [],
          sectionConfig: { sections: [], layout: 'vertical' },
          style: {}
        };
        formCache.set(formId, mockForm);
        setIsLoading(false);
        return mockForm;
      }

      // Otherwise try to fetch from Supabase
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (error) {
        console.error('Error getting form by ID:', error);
        throw error;
      }

      console.log('Fetched form data:', data);

      // Cache the result
      if (data) {
        formCache.set(formId, data);
      }

      setIsLoading(false);
      return data;
    } catch (err: any) {
      console.error('Error in getFormById:', err);
      setError(err?.message || 'An error occurred while fetching the form');
      setIsLoading(false);
      
      // For fetch errors (common with network issues), try to provide more details
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        console.warn('Network error detected - might be temporary');
      }
      
      return null;
    }
  }, []);
  
  // Create a default form
  const createDefaultForm = useCallback(async (): Promise<FormData | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const defaultForm = {
        title: 'نموذج جديد',
        description: 'وصف النموذج',
        data: [
          {
            id: '1',
            title: 'الخطوة الأولى',
            fields: []
          }
        ],
        is_published: false
      };
      
      const { data, error } = await supabase
        .from('forms')
        .insert([defaultForm])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating default form:', error);
        throw error;
      }
      
      await fetchForms(); // Refresh forms list
      return data;
    } catch (err: any) {
      console.error('Error in createDefaultForm:', err);
      setError(err?.message || 'An error occurred while creating the form');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchForms]);
  
  // Create form from template
  const createFormFromTemplate = useCallback(async (templateId: number): Promise<FormData | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, you would fetch the template data
      // and use it to create a new form
      const templateForm = {
        title: `نموذج من قالب ${templateId}`,
        description: 'تم إنشاء هذا النموذج من قالب',
        data: [
          {
            id: '1',
            title: 'الخطوة الأولى',
            fields: []
          }
        ],
        is_published: false
      };
      
      const { data, error } = await supabase
        .from('forms')
        .insert([templateForm])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating form from template:', error);
        throw error;
      }
      
      await fetchForms(); // Refresh forms list
      return data;
    } catch (err: any) {
      console.error('Error in createFormFromTemplate:', err);
      setError(err?.message || 'An error occurred while creating the form from template');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchForms]);
  
  // Save form
  const saveForm = useCallback(async (formId: string, formData: Partial<FormData>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('forms')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId);
        
      if (error) {
        console.error('Error saving form:', error);
        throw error;
      }
      
      // Update cache
      if (formCache.has(formId)) {
        const cachedForm = formCache.get(formId);
        formCache.set(formId, { ...cachedForm, ...formData });
      }
      
      return true;
    } catch (err: any) {
      console.error('Error in saveForm:', err);
      setError(err?.message || 'An error occurred while saving the form');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Publish/unpublish form
  const publishForm = useCallback(async (formId: string, isPublished: boolean): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('forms')
        .update({
          is_published: isPublished,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId);
        
      if (error) {
        console.error('Error publishing form:', error);
        throw error;
      }
      
      // Update cache
      if (formCache.has(formId)) {
        const cachedForm = formCache.get(formId);
        formCache.set(formId, { ...cachedForm, is_published: isPublished });
      }
      
      // Refresh forms list
      await fetchForms();
      
      return true;
    } catch (err: any) {
      console.error('Error in publishForm:', err);
      setError(err?.message || 'An error occurred while publishing/unpublishing the form');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchForms]);
  
  // Delete form
  const deleteForm = useCallback(async (formId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);
        
      if (error) {
        console.error('Error deleting form:', error);
        throw error;
      }
      
      // Remove from cache
      if (formCache.has(formId)) {
        formCache.delete(formId);
      }
      
      // Refresh forms list
      await fetchForms();
      
      return true;
    } catch (err: any) {
      console.error('Error in deleteForm:', err);
      setError(err?.message || 'An error occurred while deleting the form');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchForms]);
  
  // Load forms on initial mount
  useEffect(() => {
    fetchForms();
  }, [fetchForms]);
  
  return {
    isLoading,
    error,
    forms,
    getFormById,
    clearFormCache,
    fetchForms,
    createDefaultForm,
    createFormFromTemplate,
    saveForm,
    publishForm,
    deleteForm
  };
};
