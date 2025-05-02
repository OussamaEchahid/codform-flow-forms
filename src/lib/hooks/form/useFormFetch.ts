
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { FormData } from './types';

/**
 * Hook for fetching form data - Simplified to avoid type recursion issues
 */
export const useFormFetch = () => {
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { language } = useI18n();

  /**
   * Get a form by ID - Using simple object creation to prevent type recursion
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
      const { data: rawData, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .maybeSingle();

      if (error) {
        console.error(`useFormFetch: Error fetching form ${formId}:`, error);
        throw error;
      }

      if (!rawData) {
        console.log(`useFormFetch: Form ${formId} not found`);
        return null;
      }

      console.log(`useFormFetch: Form ${formId} fetched successfully:`, rawData);
      
      // Create a new object with a simple assignment
      const formData: FormData = {
        id: rawData.id,
        title: rawData.title,
        description: rawData.description,
        // Explicitly create a new object - fixes type recursion
        data: structuredClone(rawData.data || []),
        created_at: rawData.created_at,
        updated_at: rawData.updated_at,
        user_id: rawData.user_id,
        is_published: rawData.is_published,
        shop_id: rawData.shop_id
      };
      
      return formData;
    } catch (error) {
      console.error(`Error fetching form ${formId}:`, error);
      toast.error(language === 'ar' ? 'خطأ في جلب النموذج' : 'Error fetching form');
      return null;
    }
  }, [language]);

  /**
   * Fetch all forms for the current user - Simplified to prevent type issues
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
      
      const { data: rawData, error } = await query;

      if (error) {
        console.error("useFormFetch: Error fetching forms:", error);
        throw error;
      }

      console.log("useFormFetch: Forms fetched successfully:", rawData?.length || 0, "forms");
      
      const formsData: FormData[] = [];
      
      if (rawData && Array.isArray(rawData)) {
        // Process each form individually with simple object creation
        rawData.forEach(item => {
          if (item) {
            const formData: FormData = {
              id: item.id,
              title: item.title,
              description: item.description,
              // Explicitly create a new object - fixes type recursion
              data: structuredClone(item.data || []),
              created_at: item.created_at,
              updated_at: item.updated_at,
              user_id: item.user_id,
              is_published: item.is_published,
              shop_id: item.shop_id
            };
            
            formsData.push(formData);
          }
        });
      }
      
      setForms(formsData);
      return formsData;
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
