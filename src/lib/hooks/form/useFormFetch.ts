
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FormData } from './types';
import { toast } from 'sonner';

export const useFormFetch = () => {
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [fetchAttempts, setFetchAttempts] = useState<number>(0);
  
  // Enhanced debug logging
  const logDebug = (message: string, data?: any) => {
    console.log(`[FormFetch] ${message}`, data || '');
  };

  // Reset error state after some time to allow retry
  useEffect(() => {
    let errorTimer: ReturnType<typeof setTimeout> | null = null;
    
    if (error && fetchAttempts <= 3) {
      errorTimer = setTimeout(() => {
        setError('');
      }, 5000); // Clear error after 5 seconds
    }
    
    return () => {
      if (errorTimer) clearTimeout(errorTimer);
    };
  }, [error, fetchAttempts]);

  // Memoized fetch function with better error handling and caching
  const fetchForms = useCallback(async () => {
    // Avoid redundant fetches within a short time period
    const now = Date.now();
    if (now - lastFetchTime < 2000 && forms.length > 0 && !error) {
      logDebug('Skipping fetch, last fetch was recent');
      return forms;
    }
    
    setIsLoading(true);
    setFetchAttempts(prev => prev + 1);
    
    try {
      logDebug('Attempting to fetch forms from Supabase...');
      
      // Try to get data from Supabase
      const { data, error: fetchError } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Handle Supabase error
      if (fetchError) {
        throw fetchError;
      }

      // Update state with fetched data
      logDebug('Forms fetched successfully:', data);
      setForms(Array.isArray(data) ? data : []);
      setError('');
      setLastFetchTime(now);
      
      // Cache the data for offline use
      try {
        localStorage.setItem('cached_forms', JSON.stringify(data));
        localStorage.setItem('forms_last_fetch', now.toString());
      } catch (cacheError) {
        logDebug('Error caching forms:', cacheError);
      }
      
      // Return the data for immediate use
      return data || [];
    } catch (err) {
      // Enhanced error handling
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء جلب النماذج';
      logDebug('Error fetching forms:', err);
      setError(errorMessage);
      
      // Try to get cached data as fallback
      try {
        const cachedForms = localStorage.getItem('cached_forms');
        const lastFetchTimeStr = localStorage.getItem('forms_last_fetch');
        
        if (cachedForms) {
          const parsedForms = JSON.parse(cachedForms);
          logDebug('Using cached forms:', parsedForms);
          
          if (parsedForms && Array.isArray(parsedForms) && parsedForms.length > 0) {
            setForms(parsedForms);
            
            // Show toast only once when falling back to cached data
            if (fetchAttempts <= 1) {
              toast.info('استخدام بيانات محفوظة محليًا نظرًا لمشكلة في الاتصال');
            }
            
            return parsedForms;
          }
        }
      } catch (cacheError) {
        logDebug('Error retrieving cached forms:', cacheError);
      }
      
      // No cached data available, return empty array
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [forms, lastFetchTime, error, fetchAttempts]);
  
  const getFormById = async (formId: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      logDebug(`Attempting to fetch form with ID: ${formId}`);
      
      // Handle new form case
      if (formId === 'new') {
        logDebug('Creating new form template');
        setIsLoading(false);
        return {
          id: 'new',
          title: 'نموذج جديد',
          description: '',
          data: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '',
          is_published: false
        };
      }
      
      // Fetch from database
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .maybeSingle();
      
      if (formError) {
        logDebug('Error fetching form by ID:', formError);
        throw formError;
      }
      
      // Save to local cache
      try {
        localStorage.setItem(`form_${formId}`, JSON.stringify(formData));
      } catch (cacheError) {
        logDebug('Error caching individual form:', cacheError);
      }
      
      logDebug('Form fetched successfully:', formData);
      return formData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء جلب النموذج';
      logDebug('Error fetching form by ID:', err);
      setError(errorMessage);
      
      // Try to get from cache
      try {
        const cachedForm = localStorage.getItem(`form_${formId}`);
        if (cachedForm) {
          const parsedForm = JSON.parse(cachedForm);
          logDebug('Using cached form:', parsedForm);
          toast.info('استخدام نسخة محفوظة من النموذج بسبب مشكلة في الاتصال');
          return parsedForm;
        }
      } catch (cacheError) {
        logDebug('Error retrieving cached form:', cacheError);
      }
      
      // Return empty form if not found
      return {
        id: formId || 'new',
        title: 'نموذج جديد',
        description: '',
        data: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '',
        is_published: false
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    forms,
    isLoading,
    error,
    fetchForms,
    getFormById
  };
};
