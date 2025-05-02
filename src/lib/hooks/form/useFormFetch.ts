
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
      console.log('Attempting to fetch forms from Supabase...');
      
      // Try to get a mock form if connection fails
      let mockData: FormData[] = [];
      
      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log('Forms fetched successfully:', data);
        setForms(data || []);
        return data;
      } catch (connectionError) {
        console.error('Connection error in fetchForms:', connectionError);
        
        // Provide mock data when offline or during connection issues
        mockData = [{
          id: 'mock-form-1',
          title: 'نموذج تجريبي',
          description: 'هذا نموذج تجريبي يظهر عند وجود مشكلة في الاتصال',
          data: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'offline-user',
          is_published: true,
          shop_id: null
        }];
        
        // Set mock data to enable UI interaction during connection issues
        setForms(mockData);
        throw connectionError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء جلب النماذج';
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
      console.log(`Attempting to fetch form with ID: ${formId}`);
      
      // Handle new form case
      if (formId === 'new') {
        console.log('Creating new form template');
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
      
      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single();
          
        if (error) {
          console.error('Supabase error fetching form:', error);
          throw error;
        }
        
        console.log('Form fetched successfully:', data);
        return data;
      } catch (connectionError) {
        console.error('Connection error in getFormById:', connectionError);
        
        // Provide empty form template when offline
        if (formId === 'new' || !formId) {
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
        
        // Mock existing form when offline
        return {
          id: formId,
          title: 'نموذج غير متصل',
          description: 'يتعذر الوصول إلى البيانات أثناء عدم الاتصال',
          data: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 'offline-user',
          is_published: true
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء جلب النموذج';
      setError(errorMessage);
      console.error('Error fetching form by ID:', err);
      
      // Return empty form even on error to prevent UI blocking
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
