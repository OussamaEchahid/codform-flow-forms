
import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export const useFormTemplates = () => {
  const [forms, setForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formCache, setFormCache] = useState<Record<string, any>>({});
  const { user } = useAuth();
  const { language } = useI18n();

  const clearFormCache = useCallback(() => {
    console.log("useFormTemplates: Clearing form cache");
    setFormCache({});
    return Promise.resolve();
  }, []);

  const createNewForm = useCallback(async (formData: any) => {
    console.log("useFormTemplates: Creating new form", formData);
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('forms')
        .insert(formData)
        .select('*')
        .single();

      if (error) {
        console.error("useFormTemplates: Error creating form:", error);
        throw error;
      }

      console.log("useFormTemplates: Form created successfully:", data);
      
      // Update the local forms state with the new form
      setForms(prevForms => [...prevForms, data]);
      
      // Update the cache
      setFormCache(prev => ({ ...prev, [data.id]: data }));
      
      return data;
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء النموذج' : 'Error creating form');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  const fetchForms = useCallback(async () => {
    console.log("useFormTemplates: Fetching forms");
    setIsLoading(true);

    try {
      // Get forms by the current user or forms that are public
      const userId = user?.id;
      
      let query = supabase.from('forms').select('*');
      
      if (userId) {
        // If user is logged in, get forms created by this user
        query = query.eq('user_id', userId);
      } else {
        // If no user, get only public forms
        query = query.eq('is_public', true);
      }

      // Order by most recently created
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) {
        console.error("useFormTemplates: Error fetching forms:", error);
        throw error;
      }

      console.log("useFormTemplates: Forms fetched successfully:", data?.length || 0, "forms");
      setForms(data || []);
      
      // Update cache with fetched forms
      const newCache = { ...formCache };
      data?.forEach((form: any) => {
        newCache[form.id] = form;
      });
      setFormCache(newCache);

      return data;
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error(language === 'ar' ? 'خطأ في جلب النماذج' : 'Error fetching forms');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, language, formCache]);

  const getFormById = useCallback(async (formId: string) => {
    console.log(`useFormTemplates: Getting form by ID: ${formId}`);
    
    try {
      // Check if we already have this form in the cache
      if (formCache[formId]) {
        console.log(`useFormTemplates: Form ${formId} found in cache`);
        return formCache[formId];
      }
      
      // Form not in cache, fetch it from the database
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .maybeSingle();

      if (error) {
        console.error(`useFormTemplates: Error fetching form ${formId}:`, error);
        throw error;
      }

      if (!data) {
        console.log(`useFormTemplates: Form ${formId} not found`);
        return null;
      }

      console.log(`useFormTemplates: Form ${formId} fetched successfully:`, data);
      
      // Update the cache with this form
      setFormCache(prev => ({ ...prev, [formId]: data }));
      
      return data;
    } catch (error) {
      console.error(`Error fetching form ${formId}:`, error);
      toast.error(language === 'ar' ? 'خطأ في جلب النموذج' : 'Error fetching form');
      return null;
    }
  }, [formCache, language]);

  const saveForm = useCallback(async (formId: string, formData: any) => {
    console.log(`useFormTemplates: Saving form ${formId}`, formData);
    
    try {
      const { data, error } = await supabase
        .from('forms')
        .update(formData)
        .eq('id', formId)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error(`useFormTemplates: Error saving form ${formId}:`, error);
        throw error;
      }

      console.log(`useFormTemplates: Form ${formId} saved successfully:`, data);
      
      // Update the cache
      setFormCache(prev => ({ ...prev, [formId]: data }));
      
      // Also update the form in the forms state if it exists there
      setForms(prevForms => prevForms.map(form => 
        form.id === formId ? data : form
      ));
      
      return data;
    } catch (error) {
      console.error(`Error saving form ${formId}:`, error);
      toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
      return null;
    }
  }, [language]);

  const deleteForm = useCallback(async (formId: string) => {
    console.log(`useFormTemplates: Deleting form ${formId}`);
    
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) {
        console.error(`useFormTemplates: Error deleting form ${formId}:`, error);
        throw error;
      }

      console.log(`useFormTemplates: Form ${formId} deleted successfully`);
      
      // Remove from cache
      const newCache = { ...formCache };
      delete newCache[formId];
      setFormCache(newCache);
      
      // Remove from forms state
      setForms(prevForms => prevForms.filter(form => form.id !== formId));
      
      return true;
    } catch (error) {
      console.error(`Error deleting form ${formId}:`, error);
      toast.error(language === 'ar' ? 'خطأ في حذف النموذج' : 'Error deleting form');
      return false;
    }
  }, [formCache, language]);

  return {
    forms,
    isLoading,
    fetchForms,
    getFormById,
    saveForm,
    createNewForm,
    deleteForm,
    clearFormCache
  };
};
