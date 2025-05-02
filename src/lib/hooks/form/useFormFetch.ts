
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { FormData } from './types';

/**
 * Hook for fetching form data
 */
export const useFormFetch = () => {
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { language } = useI18n();

  /**
   * Get a form by ID
   */
  const getFormById = useCallback(async (formId: string, formCache: Record<string, FormData>) => {
    console.log(`useFormFetch: Getting form by ID: ${formId}`);
    
    try {
      // Check if we already have this form in cache
      if (formCache[formId]) {
        console.log(`useFormFetch: Form ${formId} found in cache`);
        return formCache[formId];
      }
      
      // Form not in cache, fetch from database
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .maybeSingle();

      if (error) {
        console.error(`useFormFetch: Error fetching form ${formId}:`, error);
        throw error;
      }

      if (!data) {
        console.log(`useFormFetch: Form ${formId} not found`);
        return null;
      }

      console.log(`useFormFetch: Form ${formId} fetched successfully:`, data);
      
      // Convert database result to FormData type using manual assignment
      const result: FormData = {
        id: data.id,
        title: data.title,
        description: data.description,
        data: data.data,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
        is_published: data.is_published,
        shop_id: data.shop_id
      };
      
      return result;
    } catch (error) {
      console.error(`Error fetching form ${formId}:`, error);
      toast.error(language === 'ar' ? 'خطأ في جلب النموذج' : 'Error fetching form');
      return null;
    }
  }, [language]);

  /**
   * Fetch all forms for the current user
   */
  const fetchForms = useCallback(async () => {
    console.log("useFormFetch: Fetching forms");
    setIsLoading(true);

    try {
      // Get forms created by current user or public forms
      const userId = user?.id;
      
      let query = supabase.from('forms').select('*');
      
      if (userId) {
        // If user is logged in, get forms created by this user
        query = query.eq('user_id', userId);
      } else {
        // If no user, only get public forms
        query = query.eq('is_public', true);
      }

      // Order by newest first
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) {
        console.error("useFormFetch: Error fetching forms:", error);
        throw error;
      }

      console.log("useFormFetch: Forms fetched successfully:", data?.length || 0, "forms");
      
      // Convert database results to FormData[] using explicit mapping
      const results: FormData[] = [];
      
      if (data) {
        for (const item of data) {
          // Add each item as a properly typed FormData object
          results.push({
            id: item.id,
            title: item.title,
            description: item.description,
            data: item.data,
            created_at: item.created_at,
            updated_at: item.updated_at,
            user_id: item.user_id,
            is_published: item.is_published,
            shop_id: item.shop_id
          });
        }
      }
      
      setForms(results);
      return results;
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error(language === 'ar' ? 'خطأ في جلب النماذج' : 'Error fetching forms');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, language]);

  /**
   * Update the forms state
   */
  const updateFormsState = useCallback((newForms: FormData[]) => {
    setForms(newForms);
  }, []);

  return {
    forms,
    isLoading,
    fetchForms,
    getFormById,
    updateFormsState
  };
};
