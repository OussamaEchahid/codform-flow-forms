
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { FormData, FormCreatePayload, FormUpdatePayload } from './types';

/**
 * Hook for handling form CRUD operations
 */
export const useFormCrud = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { language } = useI18n();

  /**
   * Create a new form
   */
  const createNewForm = useCallback(async (formData: FormCreatePayload) => {
    console.log("useFormCrud: Creating new form", formData);
    setIsLoading(true);

    try {
      // Ensure that data field exists and title is present (required in database)
      const dataToInsert = {
        ...formData,
        data: formData.data || [], 
        // Make sure title is always provided
        title: formData.title || 'Untitled Form',
        user_id: user?.id // Add user_id if user is available
      };

      const { data, error } = await supabase
        .from('forms')
        .insert(dataToInsert)
        .select('*')
        .single();

      if (error) {
        console.error("useFormCrud: Error creating form:", error);
        throw error;
      }

      console.log("useFormCrud: Form created successfully:", data);
      
      // Convert returned data to FormData
      const newForm: FormData = {
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
      
      return newForm;
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء النموذج' : 'Error creating form');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [language, user?.id]);

  /**
   * Save an existing form
   */
  const saveForm = useCallback(async (formId: string, formData: FormUpdatePayload) => {
    console.log(`useFormCrud: Saving form ${formId}`, formData);
    
    try {
      const { data, error } = await supabase
        .from('forms')
        .update(formData)
        .eq('id', formId)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error(`useFormCrud: Error saving form ${formId}:`, error);
        throw error;
      }

      console.log(`useFormCrud: Form ${formId} saved successfully:`, data);
      
      // Convert returned data to FormData
      const savedForm: FormData = {
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
      
      return savedForm;
    } catch (error) {
      console.error(`Error saving form ${formId}:`, error);
      toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
      return null;
    }
  }, [language]);

  /**
   * Publish or unpublish a form
   */
  const publishForm = useCallback(async (formId: string, isPublished: boolean) => {
    console.log(`useFormCrud: ${isPublished ? 'Publishing' : 'Unpublishing'} form ${formId}`);
    
    try {
      const { data, error } = await supabase
        .from('forms')
        .update({ is_published: isPublished })
        .eq('id', formId)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error(`useFormCrud: Error ${isPublished ? 'publishing' : 'unpublishing'} form ${formId}:`, error);
        throw error;
      }

      console.log(`useFormCrud: Form ${formId} ${isPublished ? 'published' : 'unpublished'} successfully:`, data);
      
      // Convert returned data to FormData
      const updatedForm: FormData = {
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
      
      toast.success(language === 'ar' 
        ? `تم ${isPublished ? 'نشر' : 'إلغاء نشر'} النموذج بنجاح` 
        : `Form ${isPublished ? 'published' : 'unpublished'} successfully`);
      
      return updatedForm;
    } catch (error) {
      console.error(`Error ${isPublished ? 'publishing' : 'unpublishing'} form ${formId}:`, error);
      toast.error(language === 'ar' 
        ? `خطأ في ${isPublished ? 'نشر' : 'إلغاء نشر'} النموذج` 
        : `Error ${isPublished ? 'publishing' : 'unpublishing'} form`);
      return null;
    }
  }, [language]);

  /**
   * Delete a form
   */
  const deleteForm = useCallback(async (formId: string) => {
    console.log(`useFormCrud: Deleting form ${formId}`);
    
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) {
        console.error(`useFormCrud: Error deleting form ${formId}:`, error);
        throw error;
      }

      console.log(`useFormCrud: Form ${formId} deleted successfully`);
      
      return true;
    } catch (error) {
      console.error(`Error deleting form ${formId}:`, error);
      toast.error(language === 'ar' ? 'خطأ في حذف النموذج' : 'Error deleting form');
      return false;
    }
  }, [language]);

  return {
    isLoading,
    createNewForm,
    saveForm,
    publishForm,
    deleteForm
  };
};
