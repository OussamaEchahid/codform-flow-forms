
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FormData } from './types';

export const useFormFetch = () => {
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchForms = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setForms(data || []);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching forms';
      setError(errorMessage);
      console.error('Error fetching forms:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  const getFormById = async (formId: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching the form';
      setError(errorMessage);
      console.error('Error fetching form by ID:', err);
      return null;
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
