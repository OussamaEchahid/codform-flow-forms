import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Create a cache for forms to reduce database calls
const formCache = new Map();

export const useFormTemplates = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to clear form cache when needed
  const clearFormCache = useCallback(() => {
    console.log('Clearing form cache');
    formCache.clear();
    return Promise.resolve();
  }, []);

  // Get a form by ID with caching
  const getFormById = useCallback(async (formId: string): Promise<any | null> => {
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
  
  return {
    isLoading,
    error,
    getFormById,
    clearFormCache
  };
};
